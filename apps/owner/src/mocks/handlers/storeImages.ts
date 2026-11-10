import { http } from 'msw/http';

import { getDb, updateDb } from '@owner/mocks/db';
import { checkOnboardingOwner } from '@owner/mocks/onboarding';
import { fail, ok } from '@owner/mocks/response';

import { createUpload, findUploadedImage } from './imageUpload';

// 가게 대표 이미지(로고)와 매장 사진 (api/storeImages.ts). 입점 신청 중에만 올릴 수 있다

const MAX_INTERIOR_IMAGES = 3;

interface PrepareBody {
  imageType: 'LOGO' | 'INTERIOR';
}

interface ConfirmBody {
  uploadId: string;
}

export const storeImageHandlers = [
  // 업로드 주소 발급. 서버처럼 발급할 때 자리를 잡는다.
  // 로고는 발급하는 순간 기존 로고가 빠지고, 매장 사진은 확인 전이어도 3장 중 한 자리를 차지한다
  http.post<never, PrepareBody>(
    '*/v1/owner/store-images\\:prepareUpload',
    async ({ request }) => {
      const rejected = checkOnboardingOwner();

      if (rejected) return rejected;

      const { imageType } = await request.json();

      if (imageType === 'LOGO') {
        const upload = createUpload({
          target: 'LOGO',
          menuId: null,
          sortOrder: 0,
        });

        updateDb((db) => {
          db.store.logoImage = null;
          db.latestLogoUploadId = upload.uploadId;
        });

        return ok({ ...upload, sortOrder: null });
      }

      const interiorCount = Object.values(getDb().uploads).filter(
        ({ target }) => target === 'INTERIOR',
      ).length;

      if (interiorCount >= MAX_INTERIOR_IMAGES) {
        return fail(
          422,
          'STORE-007',
          '매장 사진은 3장까지 등록할 수 있습니다.',
        );
      }

      const upload = createUpload({
        target: 'INTERIOR',
        menuId: null,
        sortOrder: interiorCount,
      });

      return ok({ ...upload, sortOrder: interiorCount });
    },
  ),

  // 업로드 확인. 받은 사진을 가게에 붙인다.
  // 더 나중에 발급한 로고 업로드가 있으면 이 로고는 붙이지 않는다 (403 STORE-008, 다른 창에서 로고를 다시 올린 경우)
  http.post<never, ConfirmBody>(
    '*/v1/owner/store-images\\:confirmUpload',
    async ({ request }) => {
      const rejected = checkOnboardingOwner();

      if (rejected) return rejected;

      const { uploadId } = await request.json();

      // 이미 붙인 업로드를 다시 확인하면(응답을 받지 못해 다시 보낸 경우) 그대로 성공으로 답한다
      if (getDb().uploads[uploadId]?.confirmed) return ok(null);

      const result = findUploadedImage(uploadId);

      if ('error' in result) return result.error;

      const { upload, url } = result;

      if (upload.target === 'LOGO' && getDb().latestLogoUploadId !== uploadId) {
        return fail(403, 'STORE-008', '더 나중에 올린 대표 이미지가 있습니다.');
      }

      updateDb((db) => {
        const image = { objectKey: uploadId, url, sortOrder: upload.sortOrder };
        const saved = db.uploads[uploadId];

        // 사진은 가게 · 메뉴 쪽에 옮겨 두고 업로드 기록에서는 지워, 저장 공간을 두 번 쓰지 않는다
        if (saved) {
          saved.confirmed = true;
          saved.url = null;
        }

        if (upload.target === 'LOGO') {
          db.store.logoImage = image;
        } else if (
          !db.store.interiorImages.some(
            ({ objectKey }) => objectKey === uploadId,
          )
        ) {
          db.store.interiorImages.push(image);
        }
      });

      return ok(null);
    },
  ),
];
