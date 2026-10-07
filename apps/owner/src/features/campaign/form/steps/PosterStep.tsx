import { type ReactNode, useEffect, useId, useState } from 'react';
import { Input } from '@repo/ui';
import { Check, ImageOff, Info } from 'lucide-react';

import {
  type CampaignPoster,
  getPosterTemplates,
  POSTER_TEXT_MAX_LENGTH,
  type PosterSlotValues,
  type PosterTemplate,
} from '@owner/api/poster';
import { getMyStore, type MyStore } from '@owner/api/store';
import { getCampaignTitle } from '@owner/features/campaign/campaignFormat';
import { useCampaignForm } from '@owner/features/campaign/form/useCampaignForm';
import { PosterPreview } from '@owner/features/campaign/PosterPreview';

const DEFAULT_EVENT_NAME = '오늘 점심 한정 특별 혜택!';
const THUMBNAIL_WIDTH = 96;

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

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

// 게시·활성 템플릿을 지금 입력한 내용으로 작게 그려 보여주고 하나를 고른다
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
          {/* 선택 표시를 썸네일 위에 올리면 광고 라벨을 가리므로 이름 옆에 둔다 */}
          <span className="mt-1.5 flex items-center justify-center gap-1 text-caption-mobile font-medium text-text-primary peer-checked:font-bold peer-checked:text-text-brand peer-checked:[&>svg]:block">
            <Check aria-hidden="true" className="hidden size-3.5" />
            {template.name}
          </span>
        </label>
      ))}
    </div>
  );
};

interface ImageOptionsProps {
  store: MyStore;
  selectedUrl: string | null;
  onSelect: (imageUrl: string | null) => void;
}

// 입점 때 등록한 대표 메뉴 이미지와 가게 대표 이미지 중에서 고른다. 고르지 않으면 이미지 없이 만든다
const ImageOptions = ({ onSelect, selectedUrl, store }: ImageOptionsProps) => {
  const name = useId();
  const options = [
    ...store.menus.map((menu) => ({ label: menu.name, url: menu.imageUrl })),
    { label: '가게 대표 이미지', url: store.logoImageUrl },
  ];
  const optionClassName =
    'relative block size-16 overflow-hidden rounded-lg border-2 border-border-subtle transition-colors peer-checked:border-action-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary';

  return (
    <div className="-mx-page flex gap-2 overflow-x-auto px-page pb-1">
      <label className="shrink-0 cursor-pointer">
        <input
          checked={selectedUrl === null}
          className="peer sr-only"
          name={name}
          onChange={() => onSelect(null)}
          type="radio"
        />
        <span
          className={`${optionClassName} flex items-center justify-center bg-surface-subtle`}
        >
          <ImageOff aria-hidden="true" className="size-5 text-text-secondary" />
        </span>
        <span className="mt-1 block w-16 truncate text-center text-caption-mobile text-text-secondary">
          이미지 없이
        </span>
      </label>
      {options.map((option) => (
        <label className="shrink-0 cursor-pointer" key={option.label}>
          <input
            checked={selectedUrl === option.url}
            className="peer sr-only"
            name={name}
            onChange={() => onSelect(option.url)}
            type="radio"
          />
          <span className={optionClassName}>
            <img alt="" className="size-full object-cover" src={option.url} />
          </span>
          <span className="mt-1 block w-16 truncate text-center text-caption-mobile text-text-secondary">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
};

// 등록 2단계: 관리자가 게시한 템플릿을 고르고, 할인 내용·이벤트명·가게명·이미지를 슬롯에 채운다.
// 템플릿 HTML 구조와 광고 라벨은 바꿀 수 없고, 슬롯 값만 바뀐다
export const PosterStep = () => {
  const { setPoster, values } = useCampaignForm();
  const { coupon, poster } = values;
  const [templates, setTemplates] = useState<Loadable<PosterTemplate[]>>();
  const [store, setStore] = useState<Loadable<MyStore>>();
  // 포스터에 적는 기간은 쿠폰 사용 가능 시간을 따른다. 1단계에서 바꾸면 여기에도 반영한다
  const period = `${coupon.usableFrom} ~ ${coupon.usableUntil}`;

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

  // 저장해 둔 포스터의 기간이 지금 쿠폰 사용 시간과 다르면 맞춰서 함께 저장되게 한다
  useEffect(() => {
    if (poster && poster.slots.period !== period) {
      setPoster({ ...poster, slots: { ...poster.slots, period } });
    }
  }, [period, poster, setPoster]);

  // 아직 포스터가 없을 때 템플릿을 고르면 쿠폰 조건과 가게 정보로 슬롯을 미리 채운다
  const createDefaultSlots = (currentStore: MyStore): PosterSlotValues => {
    const menu =
      coupon.discountTarget === 'MENU'
        ? currentStore.menus.find(({ id }) => id === coupon.menuId)
        : undefined;

    return {
      discountText: getCampaignTitle(coupon, currentStore.menus).slice(
        0,
        POSTER_TEXT_MAX_LENGTH.discountText,
      ),
      eventName: DEFAULT_EVENT_NAME,
      imageUrl: (menu ?? currentStore.menus[0])?.imageUrl ?? null,
      period,
      storeName: currentStore.name,
    };
  };

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

  // 미리보기와 썸네일은 저장된 슬롯을 쓰되, 기간은 항상 지금 쿠폰 사용 시간으로 맞춘다
  const slots: PosterSlotValues = poster
    ? { ...poster.slots, period }
    : createDefaultSlots(store);
  const selectedTemplate = templates.find(
    ({ id }) => id === poster?.templateId,
  );

  const updatePoster = (patch: Partial<CampaignPoster>) => {
    setPoster({
      posterId: poster?.posterId ?? '',
      templateId: poster?.templateId ?? '',
      ...patch,
      slots: { ...slots, ...patch.slots },
    });
  };

  const updateSlots = (patch: Partial<PosterSlotValues>) =>
    updatePoster({ slots: { ...slots, ...patch } });

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
          <p className="flex items-center gap-1 text-caption-mobile text-text-secondary">
            <Info aria-hidden="true" className="size-3.5 shrink-0" />
            광고 표시와 배치는 템플릿에 고정되어 바꿀 수 없어요.
          </p>
        </section>
      ) : (
        <p className="-mt-4 rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center text-body-sm-mobile text-text-secondary">
          템플릿을 고르면 미리보기가 나와요
        </p>
      )}

      {selectedTemplate && (
        <>
          <FieldGroup legend="문구">
            <Input
              errorMessage={
                slots.discountText.trim()
                  ? undefined
                  : '할인 내용을 입력해 주세요'
              }
              label="할인 내용"
              maxLength={POSTER_TEXT_MAX_LENGTH.discountText}
              onChange={(event) =>
                updateSlots({ discountText: event.target.value })
              }
              placeholder="예) 전 메뉴 20% 할인"
              trailing={`${slots.discountText.length}/${POSTER_TEXT_MAX_LENGTH.discountText}`}
              value={slots.discountText}
            />
            <Input
              label="이벤트 문구 (선택)"
              maxLength={POSTER_TEXT_MAX_LENGTH.eventName}
              onChange={(event) =>
                updateSlots({ eventName: event.target.value })
              }
              placeholder={`예) ${DEFAULT_EVENT_NAME}`}
              trailing={`${slots.eventName.length}/${POSTER_TEXT_MAX_LENGTH.eventName}`}
              value={slots.eventName}
            />
            <Input
              errorMessage={
                slots.storeName.trim() ? undefined : '가게명을 입력해 주세요'
              }
              label="가게명"
              maxLength={POSTER_TEXT_MAX_LENGTH.storeName}
              onChange={(event) =>
                updateSlots({ storeName: event.target.value })
              }
              trailing={`${slots.storeName.length}/${POSTER_TEXT_MAX_LENGTH.storeName}`}
              value={slots.storeName}
            />
            <div className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-subtle px-3 py-2.5 text-caption-web">
              <span className="text-text-secondary">기간</span>
              <span className="font-medium text-text-primary">{period}</span>
            </div>
            <p className="-mt-1 text-caption-mobile break-keep text-text-secondary">
              기간은 쿠폰 사용 가능 시간으로 채워지고, 1단계에서 바꾸면 함께
              바뀌어요.
            </p>
          </FieldGroup>

          <FieldGroup legend="이미지">
            <ImageOptions
              onSelect={(imageUrl) => updateSlots({ imageUrl })}
              selectedUrl={slots.imageUrl}
              store={store}
            />
          </FieldGroup>
        </>
      )}
    </div>
  );
};
