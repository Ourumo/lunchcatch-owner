import { useState } from 'react';
import { BottomSheet, Button, Input } from '@repo/ui';

import {
  getMenuErrors,
  MENU_NAME_MAX_LENGTH,
  type MenuField,
} from '@owner/api/signupFlow';
import type { StoreImage, StoreMenuValues } from '@owner/api/store';
import { ImageUploadSlot } from '@owner/components/ImageUploadSlot/ImageUploadSlot';

import { formatPriceDigits, toPriceDigits } from './menuPrice';

interface StoreMenuSheetProps {
  // 수정할 메뉴. 없으면 새 메뉴를 추가한다
  initialMenu?: StoreMenuValues;
  onClose: () => void;
  onSave: (menu: StoreMenuValues) => void;
}

// 시트에서 입력 중인 메뉴. 가격은 쉼표 없는 숫자 문자열로 다룬다
interface StoreMenuDraft {
  image: StoreImage | null;
  name: string;
  price: string;
}

const emptyDraft: StoreMenuDraft = { image: null, name: '', price: '' };

const toDraft = ({ image, name, price }: StoreMenuValues): StoreMenuDraft => ({
  image,
  name,
  price: String(price),
});

// 가게 관리 대표 메뉴 추가·수정 바텀시트. 입점 등록의 메뉴 시트와 같은 모양이고, 이미 올라간 사진(주소)도 보여준다.
// 고칠 때는 메뉴 ID를 그대로 넘겨 캠페인의 할인 대상이 유지되게 한다.
// 열 때마다 새로 그려 입력값을 초기화하므로 열려 있을 때만 렌더링한다
export const StoreMenuSheet = ({
  initialMenu,
  onClose,
  onSave,
}: StoreMenuSheetProps) => {
  const [draft, setDraft] = useState<StoreMenuDraft>(
    initialMenu ? toDraft(initialMenu) : emptyDraft,
  );
  // 입력 중에는 오류를 보여주지 않고, 칸을 벗어나거나 확인을 누른 뒤부터 보여준다
  const [touched, setTouched] = useState<Record<MenuField, boolean>>({
    image: false,
    name: false,
    price: false,
  });
  const errors = getMenuErrors(draft);
  const getVisibleError = (field: MenuField) =>
    touched[field] ? errors[field] : undefined;

  const updateDraft = (patch: Partial<StoreMenuDraft>) => {
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
      id: initialMenu?.id ?? null,
      image: draft.image,
      name: draft.name.trim(),
      price: Number(draft.price),
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
            onSelect={([file]) => updateDraft({ image: file })}
            size="sm"
          />
        </div>
        <Input
          errorMessage={getVisibleError('name')}
          label="메뉴명"
          maxLength={MENU_NAME_MAX_LENGTH}
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
            updateDraft({ price: toPriceDigits(event.target.value) })
          }
          placeholder="예) 12,000"
          required
          trailing="원"
          value={formatPriceDigits(draft.price)}
        />
      </div>
      {/* 화면 아래의 저장 버튼과 헷갈리지 않도록 시트는 확인으로 둔다 */}
      <Button className="mt-5 w-full" onClick={handleConfirm}>
        확인
      </Button>
    </BottomSheet>
  );
};
