import { useState } from 'react';
import { BottomSheet, Button, Input } from '@repo/ui';

import {
  getMenuErrors,
  MENU_NAME_MAX_LENGTH,
  type MenuDraft,
  type MenuField,
  type MenuItemValues,
  toMenuItem,
} from '@owner/api/signupFlow';
import { ImageUploadSlot } from '@owner/components/ImageUploadSlot/ImageUploadSlot';

import { formatPriceDigits, toPriceDigits } from './menuPrice';

interface MenuFormSheetProps {
  // 수정할 메뉴. 없으면 새 메뉴를 추가한다
  initialMenu?: MenuItemValues;
  onClose: () => void;
  onSave: (menu: MenuItemValues) => void;
}

const emptyDraft: MenuDraft = { image: null, name: '', price: '' };

// 대표 메뉴 추가·수정 바텀시트. 열 때마다 새로 그려 입력값을 초기화하므로 열려 있을 때만 렌더링한다
export const MenuFormSheet = ({
  initialMenu,
  onClose,
  onSave,
}: MenuFormSheetProps) => {
  const [draft, setDraft] = useState<MenuDraft>(initialMenu ?? emptyDraft);
  // 입력 중에는 오류를 보여주지 않고, 칸을 벗어나거나 저장을 누른 뒤부터 보여준다
  const [touched, setTouched] = useState<Record<MenuField, boolean>>({
    image: false,
    name: false,
    price: false,
  });
  const errors = getMenuErrors(draft);
  const getVisibleError = (field: MenuField) =>
    touched[field] ? errors[field] : undefined;

  const updateDraft = (patch: Partial<MenuDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const touch = (field: MenuField) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = () => {
    setTouched({ image: true, name: true, price: true });
    const menu = toMenuItem(draft);

    if (menu) {
      onSave(menu);
    }
  };

  return (
    // 입력 중 배경을 잘못 눌러 내용이 사라지지 않도록 배경으로는 닫지 않는다
    <BottomSheet
      closeOnBackdrop={false}
      isOpen
      onClose={onClose}
      title={initialMenu ? '대표 메뉴 수정' : '대표 메뉴 추가'}
    >
      {/* 키보드가 올라와도 저장 버튼까지 닿도록 내용 영역만 스크롤한다 */}
      <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto">
        {/* 목록 카드의 썸네일처럼 작은 정사각형으로 받는다 */}
        <div className="w-32">
          <ImageUploadSlot
            className="aspect-square"
            errorMessage={getVisibleError('image')}
            image={draft.image}
            label="메뉴 사진"
            onRemove={() => {
              updateDraft({ image: null });
              touch('image')();
            }}
            onSelect={([file]) => updateDraft({ image: file })}
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
      <Button className="mt-5 w-full" onClick={handleSave}>
        저장
      </Button>
    </BottomSheet>
  );
};
