import { useId, useState } from 'react';
import { BottomSheet, Button, Input } from '@repo/ui';

import type { ImageValue } from '@owner/api/imageUpload';
import type { MenuField } from '@owner/api/signupFlow';
import { ImageUploadSlot } from '@owner/ui/ImageUploadSlot/ImageUploadSlot';
import { formatPriceDigits, toPriceDigits } from '@owner/ui/menuPrice';

// 시트에서 입력을 마친 메뉴. 가격은 쉼표 없는 숫자 문자열. 설명은 선택이라 없으면 빈 문자열이다
export interface MenuFormValues {
  image: ImageValue;
  name: string;
  price: string;
  description: string;
}

// 시트에서 입력 중인 메뉴. 저장 전이라 사진이 비어 있을 수 있다
export interface MenuFormDraft {
  image: ImageValue | null;
  name: string;
  price: string;
  description: string;
}

// 메뉴 입력 규칙. api의 값과 검사 함수를 쓰는 쪽에서 넘긴다 (ui는 api의 값을 가져오지 않는다)
export interface MenuFormRules {
  nameMaxLength: number;
  priceMax: number;
  descriptionMaxLength: number;
  getErrors: (draft: MenuFormDraft) => Record<MenuField, string | undefined>;
}

export interface MenuFormSheetProps {
  // 수정할 메뉴. 없으면 새 메뉴를 추가한다. 사진이 없는 메뉴면 사진을 다시 고르게 한다
  initialMenu?: MenuFormDraft;
  rules: MenuFormRules;
  onClose: () => void;
  // 사진을 다시 고르지 않았으면 원래 사진을 그대로, 새로 고른 사진은 selected 상태로 넘긴다
  onSave: (menu: MenuFormValues) => void;
}

// 대표 메뉴 추가·수정 바텀시트. 입점 등록과 가게 관리가 함께 쓴다.
// 열 때마다 새로 그려 입력값을 초기화하므로 열려 있을 때만 렌더링한다
export const MenuFormSheet = ({
  initialMenu,
  onClose,
  onSave,
  rules,
}: MenuFormSheetProps) => {
  const descriptionId = useId();
  const descriptionCountId = useId();
  const [draft, setDraft] = useState<MenuFormDraft>(
    initialMenu ?? { image: null, name: '', price: '', description: '' },
  );
  // 입력 중에는 오류를 보여주지 않고, 칸을 벗어나거나 확인을 누른 뒤부터 보여준다
  const [touched, setTouched] = useState<Record<MenuField, boolean>>({
    image: false,
    name: false,
    price: false,
  });
  const errors = rules.getErrors(draft);
  const getVisibleError = (field: MenuField) =>
    touched[field] ? errors[field] : undefined;
  const priceMaxDigits = String(rules.priceMax).length;

  const updateDraft = (patch: Partial<MenuFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const touch = (field: MenuField) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleConfirm = () => {
    setTouched({ image: true, name: true, price: true });

    if (!draft.image || Object.values(errors).some(Boolean)) {
      return;
    }

    onSave({
      image: draft.image,
      name: draft.name.trim(),
      price: draft.price,
      description: draft.description.trim(),
    });
  };

  return (
    // 입력 중 배경을 잘못 눌러 내용이 사라지지 않도록 배경으로는 닫지 않는다
    <BottomSheet
      closeOnBackdrop={false}
      isOpen
      onClose={onClose}
      title={initialMenu ? '대표 메뉴 수정' : '대표 메뉴 추가'}
    >
      {/* 키보드가 올라와도 확인 버튼까지 닿도록 내용 영역만 스크롤한다 */}
      <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto">
        {/* 매장 이미지 칸(3칸 그리드 한 칸)과 같은 폭으로 가운데에 둔다 */}
        <div className="mx-auto w-[calc((100%-1rem)/3)]">
          <ImageUploadSlot
            errorMessage={getVisibleError('image')}
            image={draft.image}
            label="메뉴 사진"
            onRemove={() => {
              updateDraft({ image: null });
              touch('image')();
            }}
            onSelect={([file]) =>
              updateDraft({ image: { status: 'selected', file } })
            }
            size="sm"
          />
        </div>
        <Input
          errorMessage={getVisibleError('name')}
          label="메뉴명"
          maxLength={rules.nameMaxLength}
          onBlur={touch('name')}
          onChange={(event) => updateDraft({ name: event.target.value })}
          placeholder="예) 명품 한우 설렁탕"
          required
          value={draft.name}
        />
        <Input
          errorMessage={getVisibleError('price')}
          inputMode="numeric"
          label="가격"
          onBlur={touch('price')}
          onChange={(event) =>
            updateDraft({
              price: toPriceDigits(event.target.value, priceMaxDigits),
            })
          }
          placeholder="예) 12,000"
          required
          trailing="원"
          value={formatPriceDigits(draft.price)}
        />
        {/* 여러 줄로 쓸 수 있어 Input과 같은 모양의 textarea를 쓴다. 길이는 입력칸에서 막는다 */}
        <div className="flex flex-col gap-2">
          <label
            className="text-caption-web font-medium text-text-primary"
            htmlFor={descriptionId}
          >
            메뉴 설명{' '}
            <span className="font-normal text-text-secondary">(선택)</span>
          </label>
          <textarea
            aria-describedby={descriptionCountId}
            className="min-h-24 w-full resize-none rounded-md border border-border-subtle bg-bg-surface px-3 py-2.5 text-caption-web text-text-primary placeholder:text-text-secondary focus:border-action-primary focus:outline-none"
            id={descriptionId}
            maxLength={rules.descriptionMaxLength}
            onChange={(event) =>
              updateDraft({ description: event.target.value })
            }
            placeholder="예) 24시간 우려낸 진한 사골 국물"
            rows={3}
            value={draft.description}
          />
          <p
            className="-mt-1 mr-1 text-right text-caption-mobile text-text-secondary"
            id={descriptionCountId}
          >
            {draft.description.length}/{rules.descriptionMaxLength}
          </p>
        </div>
      </div>
      {/* 입점 등록의 다음 버튼, 가게 관리의 저장 버튼과 헷갈리지 않도록 시트는 확인으로 둔다 */}
      <Button className="mt-5 w-full" onClick={handleConfirm}>
        확인
      </Button>
    </BottomSheet>
  );
};
