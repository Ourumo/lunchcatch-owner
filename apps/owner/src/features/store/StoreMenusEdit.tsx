import { useEffect, useState } from 'react';

import { MAX_MENUS, menuInputRules } from '@owner/api/signupFlow';
import {
  getMenuIdsInUse,
  type StoreImage,
  updateStoreMenus,
} from '@owner/api/store';
import {
  MenuListFields,
  type MenuListItem,
} from '@owner/components/MenuListFields/MenuListFields';

import { StoreEditLayout } from './StoreEditLayout';
import { useStoreEdit } from './useStoreEdit';

// 수정 화면의 메뉴. 입점 등록과 같은 입력 화면을 쓰므로 가격은 쉼표 없는 숫자 문자열로 다루고 저장할 때 숫자로 바꾼다
type StoreMenuItem = MenuListItem<StoreImage>;

const IN_USE_NOTICE =
  '할인 중인 캠페인에 쓰이고 있어 수정하거나 삭제할 수 없어요';

// 순서, ID, 이름, 가격, 사진이 모두 같으면 바뀌지 않은 것으로 본다
const isSameMenus = (a: StoreMenuItem[], b: StoreMenuItem[]) =>
  a.length === b.length &&
  a.every(
    (menu, index) =>
      menu.id === b[index].id &&
      menu.name === b[index].name &&
      menu.price === b[index].price &&
      menu.image === b[index].image,
  );

// 메뉴 하나하나는 시트에서 검사하고, 여기서는 개수만 본다. 대표 메뉴는 선택이라 0개도 저장할 수 있다
const isValidMenus = (menus: StoreMenuItem[]) => menus.length <= MAX_MENUS;

// 새로 추가한 메뉴는 id 없이 오므로 null로 보내 새 ID를 받게 한다
const saveMenus = (menus: StoreMenuItem[]) =>
  updateStoreMenus(
    menus.map(({ id, image, name, price }) => ({
      id: id ?? null,
      image,
      name,
      price: Number(price),
    })),
  );

// 할인 중인 캠페인이 쓰는 메뉴 ID. 불러오기 전이거나 불러오지 못하면 null이다
const useMenuIdsInUse = () => {
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

  return menuIdsInUse;
};

// 가게 관리 > 대표 메뉴 수정. 선택, 최대 3개. 고친 메뉴는 ID를 유지해 캠페인의 할인 대상이 그대로 남는다.
// 입력 화면은 입점 등록과 같은 것을 쓴다
export const StoreMenusEdit = () => {
  const edit = useStoreEdit({
    select: (store): StoreMenuItem[] =>
      store.menus.map(({ id, imageUrl, name, price }) => ({
        id,
        image: imageUrl,
        name,
        price: String(price),
      })),
    isEqual: isSameMenus,
    isValid: isValidMenus,
    save: saveMenus,
  });
  const menuIdsInUse = useMenuIdsInUse();

  // 새로 추가한 메뉴는 아직 어떤 캠페인도 쓰지 않는다
  const isInUse = ({ id }: StoreMenuItem) =>
    Boolean(id && menuIdsInUse?.includes(id));

  return (
    <StoreEditLayout edit={edit} title="대표 메뉴">
      {edit.values && (
        <div className="px-page pt-6 pb-8">
          <MenuListFields<StoreImage>
            // 쓰이는 메뉴 ID를 불러오기 전이거나 불러오지 못하면 잘못 고치거나 지우지 않도록 수정과 삭제 버튼을 모두 숨긴다
            canEdit={(menu) => menuIdsInUse !== null && !isInUse(menu)}
            // 고치면 할인 중인 캠페인의 메뉴가 바뀌고, 지우면 그 캠페인이 없는 메뉴를 가리키게 되어 둘 다 막는다
            getLockNotice={(menu) =>
              isInUse(menu) ? IN_USE_NOTICE : undefined
            }
            maxMenus={MAX_MENUS}
            menus={edit.values}
            onChange={edit.setValues}
            rules={menuInputRules}
          />
        </div>
      )}
    </StoreEditLayout>
  );
};
