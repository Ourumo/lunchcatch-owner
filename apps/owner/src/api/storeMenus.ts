import { ApiError, request } from './client';
import type {
  PrepareUploadRequest,
  PrepareUploadResponse,
} from './imageUpload';
import type { MenuItemValues } from './signupFlow';
import type { ApiResult } from './types';

// 가게 대표 메뉴 등록과 메뉴 사진 업로드 (docs/requirements-owner.md "가게 이미지 및 대표 메뉴 등록/수정").
// 입점 신청(ONBOARDING)에서만 쓸 수 있다. 메뉴 수정·삭제 API는 없다

interface StoreMenuRegisterResponse {
  menuId: number;
  // 메뉴 중 몇 번째로 보이는지
  sortOrder: number;
}

// 대표 메뉴 등록. 등록한 메뉴 ID를 돌려주고, 그 ID로 메뉴 사진을 올린다.
// 같은 메뉴를 다시 보내면 메뉴가 하나 더 생기고 지울 수 없으므로, 받은 ID를 기억해 다시 부르지 않는다.
// 설명은 선택이라 비어 있으면 보내지 않는다. 실패하면 서버가 거절한 이유(code)를 함께 돌려준다
export const registerStoreMenu = async ({
  description,
  name,
  price,
}: Pick<MenuItemValues, 'description' | 'name' | 'price'>): Promise<
  ApiResult<string>
> => {
  try {
    const data = await request<StoreMenuRegisterResponse>(
      '/v1/owner/store-menus',
      {
        method: 'POST',
        body: {
          name: name.trim(),
          price: Number(price),
          description: description.trim() || undefined,
        },
      },
    );

    return { ok: true, data: String(data.menuId) };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof ApiError ? (error.code ?? undefined) : undefined,
    };
  }
};

// 메뉴 사진 업로드 주소 발급. 메뉴 한 개에 사진 한 장이다. 서버가 거절하면 ApiError를 던진다
export const prepareStoreMenuImageUpload = (
  menuId: string,
  uploadRequest: PrepareUploadRequest,
) =>
  request<PrepareUploadResponse>('/v1/owner/store-menu-images:prepareUpload', {
    method: 'POST',
    body: { menuId: Number(menuId), ...uploadRequest },
  });

// 메뉴 사진 업로드 확인. 서버가 S3에 올라간 것을 확인하면 사진이 메뉴에 붙는다. 서버가 거절하면 ApiError를 던진다
export const confirmStoreMenuImageUpload = async (uploadId: string) => {
  await request<null>('/v1/owner/store-menu-images:confirmUpload', {
    method: 'POST',
    body: { uploadId },
  });
};
