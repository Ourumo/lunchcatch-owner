import { request } from './client';
import {
  type HoursStepValues,
  type ServerBusinessHour,
  toHoursStepValues,
  toServerBusinessHours,
} from './signupFlow';
import type { ApiResult } from './types';

// 로그인한 점주의 가게 정보. 점주 계정 1개에 가게 1개만 등록된다

export interface StoreMenu {
  id: string;
  name: string;
  price: number;
  // 없으면 빈 문자열
  description: string;
  // 메뉴는 사진 없이 먼저 등록되므로 사진이 없을 수 있다
  imageUrl: string | null;
}

export interface MyStore {
  id: string;
  name: string;
  roadAddress: string;
  // 가게 대표 이미지(로고). 올리기 전이면 null
  logoImageUrl: string | null;
  // 매장 이미지. 0~3장 (입점 등록 MAX_INTERIOR_IMAGES)
  interiorImageUrls: string[];
  // 영업일마다 같은 시간을 쓴다. 입점 등록의 영업시간 입력값과 같은 형태
  businessHours: HoursStepValues;
  // 대표 메뉴. 선택, 최대 3개 (입점 등록 MAX_MENUS)
  menus: StoreMenu[];
}

interface StoreImageResponse {
  objectKey: string;
  url: string;
  sortOrder: number;
}

interface StoreResponse {
  // 가게를 아직 만들지 않았으면 null
  storeId: number | null;
  name: string | null;
  roadAddress: string | null;
  businessHours: ServerBusinessHour[];
  logoImage: StoreImageResponse | null;
  interiorImages: StoreImageResponse[];
  menus: {
    menuId: number;
    name: string;
    price: number;
    description: string | null;
    sortOrder: number;
    image: StoreImageResponse | null;
  }[];
}

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) =>
  a.sortOrder - b.sortOrder;

export const getMyStore = async (): Promise<ApiResult<MyStore>> => {
  try {
    const data = await request<StoreResponse>('/v1/owner/store');

    // 이 함수를 쓰는 화면은 ACTIVE 점주용이라, 가게가 아직 없으면 조회하지 못한 것으로 본다
    if (data.storeId === null) {
      return { ok: false };
    }

    return {
      ok: true,
      data: {
        id: String(data.storeId),
        name: data.name ?? '',
        roadAddress: data.roadAddress ?? '',
        logoImageUrl: data.logoImage?.url ?? null,
        interiorImageUrls: [...data.interiorImages]
          .sort(bySortOrder)
          .map(({ url }) => url),
        businessHours: toHoursStepValues(data.businessHours),
        menus: [...data.menus].sort(bySortOrder).map((menu) => ({
          id: String(menu.menuId),
          name: menu.name,
          price: menu.price,
          description: menu.description ?? '',
          imageUrl: menu.image?.url ?? null,
        })),
      },
    };
  } catch {
    return { ok: false };
  }
};

// 영업시간 수정 (docs/requirements-owner.md "영업시간 등록/수정").
// 입점 신청과 같은 API지만 ACTIVE 점주는 version을 보내지 않는다.
// 응답에 저장한 영업시간이 없어, 화면은 가게 정보를 다시 불러와 보여준다
export const updateBusinessHours = async (
  hours: HoursStepValues,
): Promise<ApiResult<null>> => {
  try {
    await request('/v1/owner/store/hours', {
      method: 'PUT',
      body: { businessHours: toServerBusinessHours(hours) },
    });

    return { ok: true, data: null };
  } catch {
    return { ok: false };
  }
};
