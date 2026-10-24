import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from 'react';
import { Camera, Check, Info, RotateCw } from 'lucide-react';

import type { CouponStepValues } from '@owner/api/campaign';
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
import { ACCEPTED_IMAGE_TYPES, getImageFileError } from '@owner/ui/imageFile';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';
import { StatusMessage } from '@owner/ui/StatusMessage/StatusMessage';

import { PosterPreview } from '../../PosterPreview';
import { useCampaignForm } from '../useCampaignForm';

const THUMBNAIL_WIDTH = 96;
// 미리보기 글은 서버가 포스터를 만들 때 채우는 형식을 따른다 (예: 전체 메뉴 1000원 할인, 매일 11:30 ~ 15:00)
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

// 시간 칸은 집행 기간이 아니라 1단계에서 정한 쿠폰 사용 시간이다 (lc-backend #763)
const toPosterPeriod = ({
  usableFrom,
  usableUntil,
}: Pick<CouponStepValues, 'usableFrom' | 'usableUntil'>) =>
  `매일 ${usableFrom} ~ ${usableUntil}`;

// 이미지를 올리기 전 포스터의 이미지 자리에 넣는 안내 그림. 미리보기 iframe은 sandbox라 data 주소로 넘긴다
const IMAGE_PLACEHOLDER_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">' +
    '<rect x="2" y="2" width="316" height="196" rx="14" fill="#ffffff" fill-opacity="0.75" stroke="#7a716a" stroke-width="2" stroke-dasharray="8 6"/>' +
    '<g transform="translate(144 46) scale(1.33)" fill="none" stroke="#2f2a27" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></g>' +
    '<text x="160" y="122" text-anchor="middle" font-family="sans-serif" font-size="17" font-weight="700" fill="#2f2a27">눌러서 이미지 올리기</text>' +
    '<text x="160" y="148" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#5c544e">jpg, png · 10MB 이하</text>' +
    '</svg>',
)}`;

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

// fieldset은 기본으로 내용 너비보다 줄어들지 않아(min-width: min-content), 가로로 넘기는 템플릿 목록이
// 화면을 넓히지 않도록 min-w-0을 둔다
const FieldGroup = ({ children, description, legend }: FieldGroupProps) => (
  <fieldset className="flex min-w-0 flex-col gap-3">
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
        // 숨긴 라디오(sr-only)는 절대 위치라, label을 기준으로 두어야 가로로 넘긴 위치만큼 페이지가 넓어지지 않는다
        <label className="relative shrink-0 cursor-pointer" key={template.id}>
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

interface PosterImagePickerProps {
  html: string;
  slots: PosterSlotValues;
  // 업로드 상태. 올리는 중이면 진행률을, 실패하면 다시 시도를 겹쳐 보여준다
  image: ImageValue | null;
  onSelect: (file: File) => void;
  onRetry: () => void;
}

// 포스터 미리보기를 누르면 포스터 이미지를 고른다. 이미지를 올린 뒤에도 누르면 바꾼다
const PosterImagePicker = ({
  html,
  image,
  onRetry,
  onSelect,
  slots,
}: PosterImagePickerProps) => {
  const errorId = useId();
  const [fileError, setFileError] = useState<string>();
  const hasImage = slots.imageUrl !== null;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    // 같은 사진을 다시 골라도 change가 일어나도록 비운다
    event.target.value = '';

    if (!file) {
      return;
    }

    const error = getImageFileError(file);
    setFileError(error);

    if (!error) {
      onSelect(file);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <label className="relative block cursor-pointer overflow-hidden rounded-xl border border-border-subtle shadow-[0_4px_16px_rgba(36,36,36,0.08)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-action-primary">
          <input
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            aria-describedby={fileError ? errorId : undefined}
            aria-label={hasImage ? '포스터 이미지 변경' : '포스터 이미지 등록'}
            className="sr-only"
            onChange={handleChange}
            type="file"
          />
          <PosterPreview
            html={html}
            slots={{
              ...slots,
              imageUrl: slots.imageUrl ?? IMAGE_PLACEHOLDER_URL,
            }}
          />
          {/* iframe은 누른 것을 바깥에 알리지 않아, 포스터 위를 투명한 면으로 덮어 누르면 이미지를 고르게 한다 */}
          <span aria-hidden="true" className="absolute inset-0" />
          {hasImage && (
            <span
              aria-hidden="true"
              className="absolute right-2.5 bottom-2.5 flex h-9 items-center gap-1.5 rounded-full bg-bg-inverse/85 px-3.5 text-caption-mobile font-semibold text-text-on-inverse"
            >
              <Camera className="size-4" />
              변경
            </span>
          )}
        </label>
        {/* 겹친 안내를 눌러도 아래 포스터가 눌려 이미지를 바꿀 수 있도록 다시 시도 버튼만 누를 수 있게 둔다 */}
        {image?.status === 'uploading' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-bg-inverse/50 px-3">
            <span
              aria-hidden="true"
              className="text-caption-mobile font-semibold text-text-on-inverse"
            >
              {Math.round(image.progress)}%
            </span>
            <div
              aria-label="포스터 이미지 업로드 중"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(image.progress)}
              className="h-1 w-full max-w-24 overflow-hidden rounded-full bg-bg-surface/40"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-bg-surface transition-[width]"
                style={{ width: `${image.progress}%` }}
              />
            </div>
          </div>
        )}
        {image?.status === 'failed' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-bg-inverse/60 px-2 text-center">
            <span
              className="text-caption-mobile font-semibold break-keep text-text-on-inverse"
              role="alert"
            >
              업로드 실패
            </span>
            <button
              aria-label="포스터 이미지 다시 올리기"
              className="pointer-events-auto flex h-11 items-center gap-1 rounded-full bg-bg-surface px-4 text-caption-mobile font-semibold text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={onRetry}
              type="button"
            >
              <RotateCw aria-hidden="true" className="size-3.5" />
              다시 시도
            </button>
          </div>
        )}
      </div>
      {fileError && (
        <p
          className="ml-1 text-caption-mobile break-keep text-status-danger-fg"
          id={errorId}
          role="alert"
        >
          {fileError}
        </p>
      )}
    </div>
  );
};

// 등록 2단계: 관리자가 게시한 템플릿을 고르고 포스터 이미지를 올린다.
// 글은 서버가 가게명, 쿠폰 조건, 쿠폰 사용 시간으로 채워, 미리보기도 같은 값으로 보여준다
export const PosterStep = () => {
  const { campaignId, setPoster, values } = useCampaignForm();
  const { coupon, poster } = values;
  const [templates, setTemplates] = useState<Loadable<PosterTemplate[]>>();
  const [store, setStore] = useState<Loadable<MyStore>>();
  // 값이 바뀌면 템플릿과 가게 정보를 다시 불러온다
  const [requestId, setRequestId] = useState(0);
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
  }, [requestId]);

  // 둘 중 하나만 실패해도 포스터를 만들 수 없어 함께 다시 부른다
  const retry = () => {
    setTemplates(undefined);
    setStore(undefined);
    setRequestId((id) => id + 1);
  };

  if (templates === undefined || store === undefined) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3 px-page">
        <span className="sr-only">포스터 템플릿을 불러오는 중</span>
        {[160, 420].map((height, index) => (
          <SkeletonBlock height={height} key={index} />
        ))}
      </div>
    );
  }

  if (templates === null || store === null) {
    return (
      <StatusMessage
        description="잠시 후 다시 시도해 주세요."
        onRetry={retry}
        title="포스터를 만들 정보를 불러오지 못했어요"
      />
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
    period: toPosterPeriod(coupon),
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
          <PosterImagePicker
            html={selectedTemplate.html}
            image={image}
            onRetry={() => {
              if (image?.status === 'failed') {
                void uploadPosterImage(image);
              }
            }}
            onSelect={(file) =>
              void uploadPosterImage({ status: 'selected', file })
            }
            slots={slots}
          />
          <p className="flex gap-1 text-caption-mobile break-keep text-text-secondary">
            <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            가게명과 할인 내용은 자동으로 채워지고, 시간은 쿠폰 사용 시간이
            들어가요.
          </p>
        </section>
      ) : (
        <p className="-mt-4 rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center text-body-sm-mobile text-text-secondary">
          템플릿을 고르면 미리보기가 나와요
        </p>
      )}
    </div>
  );
};
