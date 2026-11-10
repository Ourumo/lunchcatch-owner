import { http } from 'msw/http';

import { getDb, updateDb } from '@owner/mocks/db';
import { checkOnboardingOwner } from '@owner/mocks/onboarding';
import { fail, ok } from '@owner/mocks/response';

import { createUpload, findUploadedImage } from './imageUpload';

// 가게 대표 메뉴와 메뉴 사진 (api/storeMenus.ts). 입점 신청 중에만 등록할 수 있고 수정 · 삭제는 없다

const MAX_MENUS = 3;

interface MenuBody {
  name: string;
  price: number;
  description?: string;
}

interface PrepareBody {
  menuId: number;
}

interface ConfirmBody {
  uploadId: string;
}

export const storeMenuHandlers = [
  // 메뉴 등록. 사진 없이 먼저 등록하고, 받은 메뉴 ID로 사진을 올린다
  http.post<never, MenuBody>('*/v1/owner/store-menus', async ({ request }) => {
    const rejected = checkOnboardingOwner();

    if (rejected) return rejected;

    const { description, name, price } = await request.json();
    const { menus } = getDb().store;

    if (menus.length >= MAX_MENUS) {
      return fail(422, 'STORE-011', '대표 메뉴는 3개까지 등록할 수 있습니다.');
    }

    const menuId = getDb().nextId;
    const sortOrder = menus.length;

    updateDb((db) => {
      db.nextId += 1;
      db.store.menus.push({
        menuId,
        name,
        price,
        description: description ?? null,
        sortOrder,
        image: null,
      });
    });

    return ok({ menuId, sortOrder });
  }),

  // 메뉴 사진 업로드 주소 발급. 메뉴 한 개에 사진 한 장이다
  http.post<never, PrepareBody>(
    '*/v1/owner/store-menu-images\\:prepareUpload',
    async ({ request }) => {
      const rejected = checkOnboardingOwner();

      if (rejected) return rejected;

      const { menuId } = await request.json();

      if (!getDb().store.menus.some((menu) => menu.menuId === menuId)) {
        return fail(404, 'STORE-012', '메뉴를 찾을 수 없습니다.');
      }

      return ok(createUpload({ target: 'MENU', menuId, sortOrder: 0 }));
    },
  ),

  // 메뉴 사진 업로드 확인. 받은 사진을 메뉴에 붙인다. 다시 올리면 바뀐다
  http.post<never, ConfirmBody>(
    '*/v1/owner/store-menu-images\\:confirmUpload',
    async ({ request }) => {
      const rejected = checkOnboardingOwner();

      if (rejected) return rejected;

      const { uploadId } = await request.json();

      // 이미 붙인 업로드를 다시 확인하면(응답을 받지 못해 다시 보낸 경우) 그대로 성공으로 답한다
      if (getDb().uploads[uploadId]?.confirmed) return ok(null);

      const result = findUploadedImage(uploadId);

      if ('error' in result) return result.error;

      const { upload, url } = result;

      updateDb((db) => {
        const menu = db.store.menus.find(
          ({ menuId }) => menuId === upload.menuId,
        );
        const saved = db.uploads[uploadId];

        // 사진은 가게 · 메뉴 쪽에 옮겨 두고 업로드 기록에서는 지워, 저장 공간을 두 번 쓰지 않는다
        if (saved) {
          saved.confirmed = true;
          saved.url = null;
        }
        if (menu) menu.image = { objectKey: uploadId, url, sortOrder: 0 };
      });

      return ok(null);
    },
  ),
];
