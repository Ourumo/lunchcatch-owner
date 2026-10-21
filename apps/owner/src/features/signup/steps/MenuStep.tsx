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
  prepareStoreMenuImageUpload,
  registerStoreMenu,
} from '@owner/api/storeMenus';
import { MenuListFields } from '@owner/ui/MenuListFields/MenuListFields';

import { useSignupFlow } from '../useSignupFlow';

// 대표 메뉴 목록과 추가. 선택 단계라 메뉴 없이도 등록 신청을 완료할 수 있다.
// 시트에서 확인하면 바로 메뉴를 등록하고 그 메뉴 사진을 올린다 ("다음"에서는 등록하지 않는다).
// 메뉴 수정·삭제 API가 없어 등록한 메뉴는 바꾸거나 지울 수 없다
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
  // 받은 ID는 메뉴에 넣어 다시 시도할 때 다시 등록하지 않는다 (같은 메뉴를 다시 보내면 메뉴가 하나 더 생긴다)
  const registerMenu = async (menu: MenuItemValues, image: UploadableImage) => {
    const { file } = image;

    updateMenu(file, { image: { status: 'uploading', file, progress: 0 } });

    let menuId = menu.id;

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

  // 시트에서 확인한 메뉴는 사진을 selected로 담아 뒤에 붙어 온다
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
        canEdit={() => false}
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
