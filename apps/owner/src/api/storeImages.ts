import { request } from './client';
import type {
  PrepareUploadRequest,
  PrepareUploadResponse,
} from './imageUpload';

// 가게 대표 이미지(로고)와 매장 사진 업로드 (docs/requirements-owner.md "가게 이미지 및 대표 메뉴 등록").
// 입점 신청(ONBOARDING)에서만 쓸 수 있다. 공통 업로드 함수(uploadImage)의 prepare, confirm에 넘긴다

// LOGO는 가게마다 1장이고 다시 올리면 바뀐다. INTERIOR는 최대 3장
export type StoreImageType = 'LOGO' | 'INTERIOR';

// 매장 사진 3장 초과(422). 확인하지 않은 업로드도 자리를 잡고 있어, 화면의 사진이 3장보다 적어도 올 수 있다
export const STORE_IMAGE_LIMIT_CODE = 'STORE-007';

// 더 나중에 받은 로고 업로드가 있어 이 업로드는 확인할 수 없음(403). 다른 창에서 로고를 올린 경우다
export const STORE_IMAGE_SUPERSEDED_CODE = 'STORE-008';

interface StoreImagePrepareUploadResponse extends PrepareUploadResponse {
  // 매장 사진 중 몇 번째로 보이는지. 로고면 null
  sortOrder: number | null;
}

// 업로드 주소 발급. 발급할 때 서버가 자리를 잡는다(매장 사진은 확인하지 않아도 3장 중 한 자리).
// 로고는 발급하는 순간 기존 로고가 빠지고, 새 로고를 확인해야 다시 붙는다. 서버가 거절하면 ApiError를 던진다
export const prepareStoreImageUpload = (
  imageType: StoreImageType,
  uploadRequest: PrepareUploadRequest,
) =>
  request<StoreImagePrepareUploadResponse>(
    '/v1/owner/store-images:prepareUpload',
    { method: 'POST', body: { imageType, ...uploadRequest } },
  );

// 업로드 확인. 서버가 S3에 올라간 것을 확인하면 사진이 가게에 붙는다. 서버가 거절하면 ApiError를 던진다
export const confirmStoreImageUpload = async (uploadId: string) => {
  await request<null>('/v1/owner/store-images:confirmUpload', {
    method: 'POST',
    body: { uploadId },
  });
};
