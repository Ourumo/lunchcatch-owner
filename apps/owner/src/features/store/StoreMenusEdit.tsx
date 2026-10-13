import { useEffect, useState } from 'react';
import { Lock, Plus, SquarePen, Trash2 } from 'lucide-react';

import { MAX_MENUS } from '@owner/api/signupFlow';
import {
  getMenuIdsInUse,
  type StoreImage,
  type StoreMenuValues,
  updateStoreMenus,
} from '@owner/api/store';
import { FilePreviewImage } from '@owner/components/FilePreviewImage/FilePreviewImage';

import { formatPriceDigits } from './menuPrice';
import { StoreEditLayout } from './StoreEditLayout';
import { StoreMenuSheet } from './StoreMenuSheet';
import { useStoreEdit } from './useStoreEdit';

// 바텀시트로 새 메뉴를 추가하는지, 몇 번째 메뉴를 수정하는지
type SheetState = { mode: 'add' } | { mode: 'edit'; index: number } | null;

const iconButtonClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary';

// 순서, ID, 이름, 가격, 사진이 모두 같으면 바뀌지 않은 것으로 본다
const isSameMenus = (a: StoreMenuValues[], b: StoreMenuValues[]) =>
  a.length === b.length &&
  a.every(
    (menu, index) =>
      menu.id === b[index].id &&
      menu.name === b[index].name &&
      menu.price === b[index].price &&
      menu.image === b[index].image,
  );

// 메뉴 하나하나는 시트에서 검사하고, 여기서는 개수만 본다. 대표 메뉴는 선택이라 0개도 저장할 수 있다
const isValidMenus = (menus: StoreMenuValues[]) => menus.length <= MAX_MENUS;

// 이미 올라간 사진은 주소로, 새로 고른 사진은 파일로 보여준다
const MenuImage = ({ image }: { image: StoreImage }) => {
  const className = 'size-18 shrink-0 rounded-lg object-cover';

  return typeof image === 'string' ? (
    <img alt="" className={className} src={image} />
  ) : (
    <FilePreviewImage className={className} file={image} />
  );
};

interface MenusFieldsProps {
  values: StoreMenuValues[];
  onChange: (values: StoreMenuValues[]) => void;
}

// 입점 등록의 대표 메뉴 단계와 같은 모양. 입력 화면을 공용 컴포넌트로 나누기 전까지 목록은 복사해 둔다
const MenusFields = ({ onChange, values: menus }: MenusFieldsProps) => {
  const [sheet, setSheet] = useState<SheetState>(null);
  // 할인 중인 캠페인이 쓰는 메뉴 ID. 불러오기 전이거나 불러오지 못하면 null이고, 잘못 지우지 않도록 삭제 버튼을 모두 숨긴다
  const [menuIdsInUse, setMenuIdsInUse] = useState<string[] | null>(null);

  useEffect(() => {
    let ignore = false;

    getMenuIdsInUse().then((result) => {
      if (!ignore && result.ok) {
        setMenuIdsInUse(result.data);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const handleSave = (menu: StoreMenuValues) => {
    if (sheet?.mode === 'edit') {
      onChange(
        menus.map((current, index) => (index === sheet.index ? menu : current)),
      );
    } else {
      onChange([...menus, menu]);
    }

    setSheet(null);
  };

  return (
    <div className="flex flex-col gap-4 px-page pt-6 pb-8">
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        손님에게 보여줄 대표 메뉴를 최대 {MAX_MENUS}개까지 등록할 수 있어요.
      </p>

      {menus.length > 0 && (
        <ul aria-label="대표 메뉴" className="flex flex-col gap-3">
          {menus.map((menu, index) => {
            // 새로 추가한 메뉴는 아직 어떤 캠페인도 쓰지 않는다
            const isInUse = menu.id !== null && menuIdsInUse?.includes(menu.id);
            const canDelete = menuIdsInUse !== null && !isInUse;

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
                      {formatPriceDigits(String(menu.price))}원
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
                  {canDelete && (
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
                {/* 지우면 그 캠페인이 없는 메뉴를 가리키게 되어 수정만 허용한다 */}
                {isInUse && (
                  <p className="flex items-center gap-1.5 text-caption-mobile break-keep text-text-secondary">
                    <Lock aria-hidden="true" className="size-3.5 shrink-0" />
                    할인 중인 캠페인에 쓰이고 있어 삭제할 수 없어요
                  </p>
                )}
              </li>
            );
          })}
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
        <StoreMenuSheet
          initialMenu={sheet.mode === 'edit' ? menus[sheet.index] : undefined}
          onClose={() => setSheet(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// 가게 관리 > 대표 메뉴 수정. 선택, 최대 3개. 고친 메뉴는 ID를 유지해 캠페인의 할인 대상이 그대로 남는다
export const StoreMenusEdit = () => {
  const edit = useStoreEdit({
    select: (store): StoreMenuValues[] =>
      store.menus.map(({ id, imageUrl, name, price }) => ({
        id,
        image: imageUrl,
        name,
        price,
      })),
    isEqual: isSameMenus,
    isValid: isValidMenus,
    save: updateStoreMenus,
  });

  return (
    <StoreEditLayout edit={edit} title="대표 메뉴">
      {edit.values && (
        <MenusFields onChange={edit.setValues} values={edit.values} />
      )}
    </StoreEditLayout>
  );
};
