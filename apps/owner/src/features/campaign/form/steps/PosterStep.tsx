import { type ReactNode, useEffect, useId, useState } from 'react';
import { Check, Info } from 'lucide-react';

import type { BudgetStepValues, CouponStepValues } from '@owner/api/campaign';
import {
  type ImageValue,
  isImageOfFile,
  toSavedImage,
  type UploadableImage,
  uploadImage,
} from '@owner/api/imageUpload';
import {
  type CampaignPoster,
  getPosterTemplates,
  type PosterSlotValues,
  type PosterTemplate,
  preparePosterImageUpload,
} from '@owner/api/poster';
import { getMyStore, type MyStore, type StoreMenu } from '@owner/api/store';
import { ImageUploadSlot } from '@owner/ui/ImageUploadSlot/ImageUploadSlot';

import { PosterPreview } from '../../PosterPreview';
import { useCampaignForm } from '../useCampaignForm';

const THUMBNAIL_WIDTH = 96;
// 집행 기간은 4단계에서 정해, 아직 없으면 기간 자리에 이 이름을 보여준다
const PERIOD_PLACEHOLDER = '집행 기간';

// 미리보기 글은 서버가 포스터를 만들 때 채우는 형식을 따른다 (예: 전체 메뉴 1000원 할인, 10.22~10.24)
const toPosterDiscountText = (
  { discountTarget, discountType, discountValue, menuId }: CouponStepValues,
  menus: StoreMenu[],
) => {
  if (discountValue === null) {
    return '';
  }

  const target =
    discountTarget === 'MENU'
      ? (menus.find(({ id }) => id === menuId)?.name ?? '')
      : '전체 메뉴';

  return `${target} ${discountValue}${discountType === 'PERCENT' ? '%' : '원'} 할인`.trim();
};

// YYYY-MM-DD를 MM.DD로 적는다
const toPosterDate = (value: string) => value.slice(5).replace('-', '.');

const toPosterPeriod = ({ endDate, startDate }: BudgetStepValues) =>
  startDate && endDate
    ? `${toPosterDate(startDate)}~${toPosterDate(endDate)}`
    : PERIOD_PLACEHOLDER;

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

// 미리보기용으로 줄이는 긴 변. 미리보기는 폭 360px 안팎이라 이 정도면 충분하다
const PREVIEW_IMAGE_SIDE = 720;

// 미리보기 iframe은 sandbox라 출처가 없어 이 화면이 만든 blob 주소를 읽지 못한다.
// 그래서 작게 줄인 data 주소로 넘긴다. 글을 고칠 때마다 다시 그리므로 원본 그대로 넣지 않는다
const toPreviewImageUrl = async (file: File) => {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(
      1,
      PREVIEW_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    bitmap.close();
  }
};

interface FieldGroupProps {
  legend: string;
  description?: string;
  children: ReactNode;
}

const FieldGroup = ({ children, description, legend }: FieldGroupProps) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-body-mobile font-bold text-text-primary">
      {legend}
    </legend>
    {children}
    {description && (
      <p className="-mt-1 text-caption-mobile break-keep text-text-secondary">
        {description}
      </p>
    )}
  </fieldset>
);

interface TemplateOptionsProps {
  templates: PosterTemplate[];
  selectedId: string | undefined;
  slots: PosterSlotValues;
  onSelect: (template: PosterTemplate) => void;
}

// 게시·활성 템플릿을 지금 채울 내용으로 작게 그려 보여주고 하나를 고른다
const TemplateOptions = ({
  onSelect,
  selectedId,
  slots,
  templates,
}: TemplateOptionsProps) => {
  const name = useId();

  return (
    <div className="-mx-page flex gap-3 overflow-x-auto px-page pb-1">
      {templates.map((template) => (
        <label className="shrink-0 cursor-pointer" key={template.id}>
          <input
            checked={selectedId === template.id}
            className="peer sr-only"
            name={name}
            onChange={() => onSelect(template)}
            type="radio"
            value={template.id}
          />
          <span className="relative block overflow-hidden rounded-lg border-2 border-border-subtle transition-colors peer-checked:border-action-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary">
            <span aria-hidden="true" className="block">
              <PosterPreview
                html={template.html}
                slots={slots}
                width={THUMBNAIL_WIDTH}
              />
            </span>
          </span>
          {/* 선택 표시를 썸네일 위에 올리면 포스터를 가리므로 이름 옆에 둔다 */}
          <span className="mt-1.5 flex items-center justify-center gap-1 text-caption-mobile font-medium text-text-primary peer-checked:font-bold peer-checked:text-text-brand peer-checked:[&>svg]:block">
            <Check aria-hidden="true" className="hidden size-3.5" />
            {template.name}
          </span>
        </label>
      ))}
    </div>
  );
};

// 등록 2단계: 관리자가 게시한 템플릿을 고르고 포스터 이미지를 올린다.
// 글은 서버가 가게명, 쿠폰 조건, 집행 기간으로 채워, 미리보기도 같은 값으로 보여준다
export const PosterStep = () => {
  const { campaignId, setPoster, values } = useCampaignForm();
  const { budget, coupon, poster } = values;
  const [templates, setTemplates] = useState<Loadable<PosterTemplate[]>>();
  const [store, setStore] = useState<Loadable<MyStore>>();
  // 이미지 칸의 업로드 상태. 이미 올린 이미지는 미리보기 주소로 보여준다
  const [image, setImage] = useState<ImageValue | null>(() =>
    poster?.imageUrl ? toSavedImage(poster.imageUrl) : null,
  );

  useEffect(() => {
    let ignore = false;

    getPosterTemplates().then((result) => {
      if (!ignore) {
        setTemplates(result.ok ? result.data : null);
      }
    });
    getMyStore().then((result) => {
      if (!ignore) {
        setStore(result.ok ? result.data : null);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  if (templates === undefined || store === undefined) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3 px-page">
        <span className="sr-only">포스터 템플릿을 불러오는 중</span>
        {[160, 420].map((height, index) => (
          <div
            aria-hidden="true"
            className="animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
            key={index}
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  if (templates === null || store === null) {
    return (
      <p className="mx-page rounded-xl bg-surface-subtle px-4 py-6 text-center text-body-sm-mobile text-text-secondary">
        포스터 템플릿을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="mx-page rounded-xl bg-surface-subtle px-4 py-6 text-center text-body-sm-mobile break-keep text-text-secondary">
        지금 고를 수 있는 포스터 템플릿이 없어요. 템플릿이 준비되면 이어서 만들
        수 있어요.
      </p>
    );
  }

  // 미리보기와 썸네일의 글. 서버가 포스터를 만들 때 채우는 값과 같다
  const slots: PosterSlotValues = {
    eventName: store.name,
    discountText: toPosterDiscountText(coupon, store.menus),
    period: toPosterPeriod(budget),
    imageUrl: poster?.imageUrl ?? null,
  };
  const selectedTemplate = templates.find(
    ({ id }) => id === poster?.templateId,
  );

  const updatePoster = (patch: Partial<CampaignPoster>) => {
    setPoster({
      posterId: poster?.posterId ?? '',
      templateId: poster?.templateId ?? '',
      imageObjectKey: poster?.imageObjectKey ?? null,
      imageUrl: poster?.imageUrl ?? null,
      ...patch,
    });
  };

  // 이미지는 고르자마자 올린다. 올리는 동안에는 이전 이미지로 저장되지 않게 키를 비우고,
  // 다 올리면 그사이 고른 템플릿은 그대로 두고 이미지만 바꾼다
  const uploadPosterImage = async (target: UploadableImage) => {
    const { file } = target;

    setImage({ status: 'uploading', file, progress: 0 });
    setPoster((prev) => prev && { ...prev, imageObjectKey: null });

    const uploaded = await uploadImage(target, {
      prepare: (request) => preparePosterImageUpload(campaignId, request),
      onProgress: (progress) =>
        setImage((current) =>
          isImageOfFile(current, file)
            ? { status: 'uploading', file, progress }
            : current,
        ),
    });

    // 그사이 다른 이미지를 골랐으면 이 결과는 버린다
    setImage((current) => (isImageOfFile(current, file) ? uploaded : current));

    if (uploaded.status === 'attached') {
      const imageUrl = await toPreviewImageUrl(file);

      setPoster(
        (prev) =>
          prev && {
            ...prev,
            imageObjectKey: uploaded.uploadKey,
            imageUrl,
          },
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 px-page">
      <FieldGroup legend="템플릿">
        <TemplateOptions
          onSelect={(template) => updatePoster({ templateId: template.id })}
          selectedId={selectedTemplate?.id}
          slots={slots}
          templates={templates}
        />
      </FieldGroup>

      {selectedTemplate ? (
        <section className="flex flex-col gap-2">
          <h3 className="sr-only">포스터 미리보기</h3>
          <div className="overflow-hidden rounded-xl border border-border-subtle shadow-[0_4px_16px_rgba(36,36,36,0.08)]">
            <PosterPreview html={selectedTemplate.html} slots={slots} />
          </div>
          <p className="flex gap-1 text-caption-mobile break-keep text-text-secondary">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            가게명과 할인 내용은 자동으로 채워지고, 기간은 집행 기간을 정하면
            들어가요.
          </p>
        </section>
      ) : (
        <p className="-mt-4 rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center text-body-sm-mobile text-text-secondary">
          템플릿을 고르면 미리보기가 나와요
        </p>
      )}

      {selectedTemplate && (
        <FieldGroup
          description="jpg, png 파일을 10MB 이하로 올려 주세요. 고르면 바로 올라가요."
          legend="이미지"
        >
          <ImageUploadSlot
            image={image}
            label="포스터 이미지"
            onRetry={() => {
              if (image?.status === 'failed') {
                void uploadPosterImage(image);
              }
            }}
            onSelect={([file]) =>
              void uploadPosterImage({ status: 'selected', file })
            }
          />
        </FieldGroup>
      )}
    </div>
  );
};
