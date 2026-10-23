import {
  type ImageValue,
  isImageOfFile,
  isImageUploading,
  type UploadableImage,
  uploadImage,
} from '@owner/api/imageUpload';
import {
  MAX_MENUS,
  menuInputRules,
  type MenuItemValues,
} from '@owner/api/signupFlow';
import {
  confirmStoreMenuImageUpload,
  getRegisteredStoreMenus,
  prepareStoreMenuImageUpload,
  type RegisteredStoreMenu,
  registerStoreMenu,
} from '@owner/api/storeMenus';
import { MenuListFields } from '@owner/ui/MenuListFields/MenuListFields';

import { useSignupFlow } from '../useSignupFlow';

// 등록 요청이 오류 코드 없이 실패했는지. 시간 초과나 연결 끊김처럼 응답을 받지 못했으면 서버가 저장했는지 알 수 없다.
// 오류 코드가 있으면 서버가 거절한 것이라 저장되지 않았다
const isUnknownRegisterFailure = ({ id, image }: MenuItemValues) =>
  !id && image?.status === 'failed' && !image.code;

// 응답을 받지 못한 등록이 서버에 저장된 메뉴. 이름과 가격이 같고 화면에 아직 없는 메뉴 중 서버 순서가 앞선 것을 고른다.
// 화면에 있는 메뉴는 빼서, 같은 이름과 가격의 메뉴를 일부러 두 번 넣은 경우와 섞지 않는다
const findRegisteredMenu = (
  { name, price }: MenuItemValues,
  registeredMenus: RegisteredStoreMenu[],
  screenMenus: MenuItemValues[],
) => {
  const screenMenuIds = new Set(screenMenus.map(({ id }) => id));

  return registeredMenus
    .filter(
      (registered) =>
        !screenMenuIds.has(registered.id) &&
        registered.name === name.trim() &&
        registered.price === Number(price),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .at(0);
};

// 대표 메뉴 목록과 추가. 선택 단계라 메뉴 없이도 등록 신청을 완료할 수 있다.
// 시트에서 확인하면 바로 메뉴를 등록하고 그 메뉴 사진을 올린다 ("다음"에서는 등록하지 않는다).
// 메뉴 수정·삭제 API가 없어 등록한 메뉴는 바꾸거나 지울 수 없다.
// 등록하지 못한 메뉴는 서버에 없어 고치거나 지울 수 있다 (서버가 계속 거절해도 빼고 넘어갈 수 있게)
export const MenuStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { menus } = values.menu;
  const isUploading = menus.some(
    ({ image }) => image !== null && isImageUploading(image),
  );

  // 그 사진을 고른 메뉴만 바꾼다. 올리는 동안 다른 메뉴도 바뀌므로 그때의 최신 값에서 고른다
  const updateMenu = (file: File, patch: Partial<MenuItemValues>) =>
    updateStepValues('menu', ({ menus: currentMenus }) => ({
      menus: currentMenus.map((menu) =>
        isImageOfFile(menu.image, file) ? { ...menu, ...patch } : menu,
      ),
    }));

  // 메뉴를 등록하지 않았으면 등록해 메뉴 ID를 받고, 그 ID로 사진을 올린다.
  // 받은 ID는 메뉴에 넣어 다시 시도할 때 다시 등록하지 않는다 (같은 메뉴를 다시 보내면 메뉴가 하나 더 생긴다).
  // 지난 등록의 응답을 받지 못했으면 서버에 이미 저장됐을 수 있어, 다시 등록하기 전에 서버 메뉴 목록에서 찾는다
  const registerMenu = async (menu: MenuItemValues, image: UploadableImage) => {
    const { file } = image;

    updateMenu(file, { image: { status: 'uploading', file, progress: 0 } });

    let menuId = menu.id;

    if (!menuId && isUnknownRegisterFailure(menu)) {
      const registered = await getRegisteredStoreMenus();

      // 저장됐는지 모르는 채로 등록하면 메뉴가 하나 더 생길 수 있어 실패로 두고 다시 시도하게 한다
      if (!registered.ok) {
        updateMenu(file, { image: { status: 'failed', file } });
        return;
      }

      const registeredMenu = findRegisteredMenu(menu, registered.data, menus);

      if (registeredMenu) {
        menuId = registeredMenu.id;
        updateMenu(file, { id: menuId });
      }
    }

    if (!menuId) {
      const result = await registerStoreMenu(menu);

      if (!result.ok) {
        updateMenu(file, {
          image: { status: 'failed', file, code: result.code },
        });
        return;
      }

      menuId = result.data;
      updateMenu(file, { id: menuId });
    }

    const registeredMenuId = menuId;
    const uploadedImage = await uploadImage(image, {
      prepare: (request) =>
        prepareStoreMenuImageUpload(registeredMenuId, request),
      confirm: confirmStoreMenuImageUpload,
      onProgress: (progress) =>
        updateMenu(file, { image: { status: 'uploading', file, progress } }),
    });

    updateMenu(file, { image: uploadedImage });
  };

  // 메뉴마다 한 개씩 차례로 등록하고 사진을 올린다. 올리는 중에는 추가, 다시 시도, 사진 등록을 막아 한 번에 하나만 돈다.
  // 앞 단계로 가도 끝까지 올린다
  const registerMenus = async (targets: MenuItemValues[]) => {
    for (const menu of targets) {
      const { image } = menu;

      if (image?.status === 'selected' || image?.status === 'failed') {
        await registerMenu(menu, image);
      }
    }
  };

  // 시트에서 확인한 메뉴는 사진을 selected로 담아 뒤에 붙어 오고, 고친 메뉴는 새 값으로 그 자리에 온다.
  // 둘 다 목록에 없던 값이라 등록을 시작한다. 지운 메뉴는 등록할 것이 없다
  const handleMenusChange = (nextMenus: MenuItemValues[]) => {
    const addedMenus = nextMenus.filter((menu) => !menus.includes(menu));

    updateStepValues('menu', { menus: nextMenus });
    void registerMenus(addedMenus);
  };

  const handleRetry = (index: number) => {
    void registerMenus([menus[index]]);
  };

  // 새로고침으로 고른 파일이 사라져 사진이 붙지 않은 메뉴에 사진만 다시 고른다
  const handleImageSelect = (index: number, file: File) => {
    const image: ImageValue = { status: 'selected', file };
    const menu = { ...menus[index], image };

    updateStepValues('menu', {
      menus: menus.map((current, menuIndex) =>
        menuIndex === index ? menu : current,
      ),
    });
    void registerMenus([menu]);
  };

  return (
    <div className="px-page pt-6 pb-8">
      <MenuListFields<ImageValue | null>
        // 등록하지 못한 메뉴만 고치거나 지울 수 있다. 다른 메뉴를 처리하는 중에는 한 번에 하나만 돌도록 막는다
        canEdit={({ id }) => !id && !isUploading}
        disabled={isUploading}
        maxMenus={MAX_MENUS}
        menus={menus}
        notice="등록한 메뉴는 지금은 바꾸거나 지울 수 없어요"
        onChange={handleMenusChange}
        onImageSelect={handleImageSelect}
        onRetry={handleRetry}
        rules={menuInputRules}
      />
    </div>
  );
};
