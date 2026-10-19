import { useState } from 'react';
import { ImageOff, Lock, Plus, SquarePen, Trash2 } from 'lucide-react';

import { FilePreviewImage } from '@owner/ui/FilePreviewImage/FilePreviewImage';
import {
  type MenuFormRules,
  MenuFormSheet,
  type MenuFormValues,
} from '@owner/ui/MenuFormSheet/MenuFormSheet';
import { formatPriceDigits } from '@owner/ui/menuPrice';

// 목록의 메뉴 한 개. 가게 관리는 고칠 때 메뉴 ID를 유지해야 해서 id를 함께 둔다.
// 가게 관리에서 불러온 메뉴는 사진이 없을 수 있어, 쓰는 쪽이 TImage에 null을 넣는다
export interface MenuListItem<TImage extends File | string | null> extends Omit<
  MenuFormValues<NonNullable<TImage>>,
  'image'
> {
  image: TImage;
  // 이미 등록한 메뉴의 ID. 새로 추가한 메뉴와 입점 등록 메뉴에는 없다
  id?: string | null;
}

export interface MenuListFieldsProps<TImage extends File | string | null> {
  menus: MenuListItem<TImage>[];
  // 고친 메뉴는 id를 그대로 두고, 새로 추가한 메뉴는 id 없이 넘긴다
  onChange: (menus: MenuListItem<TImage | File>[]) => void;
  maxMenus: number;
  rules: MenuFormRules;
  // 넘기면 메뉴마다 수정과 삭제 버튼을 보여줄지 정한다. 없으면 모두 고치고 지울 수 있다
  canEdit?: (menu: MenuListItem<TImage>) => boolean;
  // 넘기면 고치거나 지울 수 없는 이유를 메뉴 아래에 보여준다
  getLockNotice?: (menu: MenuListItem<TImage>) => string | undefined;
}

// 바텀시트로 새 메뉴를 추가하는지, 몇 번째 메뉴를 수정하는지
type SheetState = { mode: 'add' } | { mode: 'edit'; index: number } | null;

const iconButtonClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary';

// 이미 올라간 사진은 주소로, 새로 고른 사진은 파일로 보여준다. 사진이 없으면 빈 자리를 보여준다
const MenuImage = ({ image }: { image: File | string | null }) => {
  const className = 'size-18 shrink-0 rounded-lg object-cover';

  if (!image) {
    return (
      <span
        aria-hidden="true"
        className="flex size-18 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-text-disabled"
      >
        <ImageOff className="size-6" />
      </span>
    );
  }

  return typeof image === 'string' ? (
    <img alt="" className={className} src={image} />
  ) : (
    <FilePreviewImage className={className} file={image} />
  );
};

// 대표 메뉴 목록과 추가·수정·삭제. 입점 등록과 가게 관리가 함께 쓴다.
// 개수 제한과 입력 규칙은 api의 값을 쓰는 쪽에서 넘긴다 (ui는 api의 값을 가져오지 않는다)
export const MenuListFields = <TImage extends File | string | null>({
  canEdit,
  getLockNotice,
  maxMenus,
  menus,
  onChange,
  rules,
}: MenuListFieldsProps<TImage>) => {
  const [sheet, setSheet] = useState<SheetState>(null);

  const handleSave = (menu: MenuFormValues<NonNullable<TImage> | File>) => {
    if (sheet?.mode === 'edit') {
      onChange(
        menus.map((current, index) =>
          index === sheet.index ? { ...current, ...menu } : current,
        ),
      );
    } else {
      onChange([...menus, menu]);
    }

    setSheet(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님에게 보여줄 대표 메뉴를 최대 {maxMenus}개까지 등록할 수 있어요.
      </p>

      {menus.length > 0 && (
        <ul aria-label="등록한 대표 메뉴" className="flex flex-col gap-3">
          {menus.map((menu, index) => {
            const lockNotice = getLockNotice?.(menu);
            const isEditable = canEdit?.(menu) ?? true;

            return (
              <li
                className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-surface p-3"
                // 칸마다 따로 들고 있는 상태가 없어 순서로 구분한다
                key={index}
              >
                <div className="flex items-center gap-4">
                  <MenuImage image={menu.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-mobile font-semibold text-text-primary">
                      {menu.name}
                    </p>
                    <p className="mt-0.5 text-body-sm-mobile text-text-secondary">
                      {formatPriceDigits(menu.price)}원
                    </p>
                  </div>
                  {isEditable && (
                    <button
                      aria-label={`${menu.name} 수정`}
                      className={iconButtonClassName}
                      onClick={() => setSheet({ mode: 'edit', index })}
                      type="button"
                    >
                      <SquarePen aria-hidden="true" className="size-5" />
                    </button>
                  )}
                  {isEditable && (
                    <button
                      aria-label={`${menu.name} 삭제`}
                      className={`-ml-3 ${iconButtonClassName}`}
                      onClick={() =>
                        onChange(
                          menus.filter((_, menuIndex) => menuIndex !== index),
                        )
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="size-5" />
                    </button>
                  )}
                </div>
                {lockNotice && (
                  <p className="flex items-center gap-1.5 text-caption-mobile break-keep text-text-secondary">
                    <Lock aria-hidden="true" className="size-3.5 shrink-0" />
                    {lockNotice}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {menus.length < maxMenus && (
        <button
          className="flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-surface-brand text-body-mobile font-semibold text-text-primary hover:border-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          onClick={() => setSheet({ mode: 'add' })}
          type="button"
        >
          <Plus aria-hidden="true" className="size-5 text-action-primary" />
          대표 메뉴 추가하기 ({menus.length}/{maxMenus})
        </button>
      )}

      {sheet && (
        <MenuFormSheet<NonNullable<TImage>>
          initialMenu={sheet.mode === 'edit' ? menus[sheet.index] : undefined}
          onClose={() => setSheet(null)}
          onSave={handleSave}
          rules={rules}
        />
      )}
    </div>
  );
};
