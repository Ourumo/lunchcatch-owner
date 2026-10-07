import { useState } from 'react';
import { Plus, SquarePen, Trash2 } from 'lucide-react';

import { MAX_MENUS, type MenuItemValues } from '@owner/api/signupFlow';
import { FilePreviewImage } from '@owner/components/FilePreviewImage/FilePreviewImage';
import { MenuFormSheet } from '@owner/features/signup/MenuFormSheet';
import { formatPriceDigits } from '@owner/features/signup/menuPrice';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

// 바텀시트로 새 메뉴를 추가하는지, 몇 번째 메뉴를 수정하는지
type SheetState = { mode: 'add' } | { mode: 'edit'; index: number } | null;

const iconButtonClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary';

// 대표 메뉴 목록과 추가·수정·삭제. 선택 단계라 메뉴 없이도 등록 신청을 완료할 수 있다
export const MenuStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { menus } = values.menu;
  const [sheet, setSheet] = useState<SheetState>(null);

  const updateMenus = (nextMenus: MenuItemValues[]) => {
    updateStepValues('menu', { menus: nextMenus });
  };

  const handleSave = (menu: MenuItemValues) => {
    if (sheet?.mode === 'edit') {
      updateMenus(
        menus.map((current, index) => (index === sheet.index ? menu : current)),
      );
    } else {
      updateMenus([...menus, menu]);
    }

    setSheet(null);
  };

  return (
    <div className="flex flex-col gap-4 px-page pt-6 pb-8">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님에게 보여줄 대표 메뉴를 최대 {MAX_MENUS}개까지 등록할 수 있어요.
      </p>

      {menus.length > 0 && (
        <ul aria-label="등록한 대표 메뉴" className="flex flex-col gap-3">
          {menus.map((menu, index) => (
            <li
              className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-3"
              // 메뉴에 별도 ID가 없어 등록 순서로 구분한다
              key={index}
            >
              <FilePreviewImage
                className="size-18 shrink-0 rounded-lg object-cover"
                file={menu.image}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-mobile font-semibold text-text-primary">
                  {menu.name}
                </p>
                <p className="mt-0.5 text-body-sm-mobile text-text-secondary">
                  {formatPriceDigits(menu.price)}원
                </p>
              </div>
              <button
                aria-label={`${menu.name} 수정`}
                className={iconButtonClassName}
                onClick={() => setSheet({ mode: 'edit', index })}
                type="button"
              >
                <SquarePen aria-hidden="true" className="size-5" />
              </button>
              <button
                aria-label={`${menu.name} 삭제`}
                className={`-ml-3 ${iconButtonClassName}`}
                onClick={() =>
                  updateMenus(
                    menus.filter((_, menuIndex) => menuIndex !== index),
                  )
                }
                type="button"
              >
                <Trash2 aria-hidden="true" className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {menus.length < MAX_MENUS && (
        <button
          className="flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-surface-brand text-body-mobile font-semibold text-text-primary hover:border-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          onClick={() => setSheet({ mode: 'add' })}
          type="button"
        >
          <Plus aria-hidden="true" className="size-5 text-action-primary" />
          대표 메뉴 추가하기 ({menus.length}/{MAX_MENUS})
        </button>
      )}

      {sheet && (
        <MenuFormSheet
          initialMenu={sheet.mode === 'edit' ? menus[sheet.index] : undefined}
          onClose={() => setSheet(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
