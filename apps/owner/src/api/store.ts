import { request } from './client';
import { mockDelay } from './mocks/delay';
import { mockStore } from './mocks/store';
import {
  type HoursStepValues,
  isHoursStepComplete,
  type ServerBusinessHour,
  toHoursStepValues,
  weekdays,
} from './signupFlow';
import type { ApiResult } from './types';

// 로그인한 점주의 가게 정보. 점주 계정 1개에 가게 1개만 등록된다
// 조회는 서버 API를 쓰고, 영업시간 수정은 API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

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

const INVALID_BUSINESS_HOURS_MESSAGE = '영업 요일과 시간을 다시 확인해 주세요.';

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
// 같은 요일 중복, 영업 요일 없음, 시각 누락, 시작 시각보다 이르거나 같은 종료 시각은 받지 않는다.
// 요일은 고른 순서와 상관없이 월~일 순서로 저장한다
export const updateBusinessHours = async (
  hours: HoursStepValues,
): Promise<ApiResult<HoursStepValues>> => {
  await mockDelay();

  const hasDuplicateDay =
    new Set(hours.openDays).size !== hours.openDays.length;

  if (hasDuplicateDay || !isHoursStepComplete(hours)) {
    return { ok: false, message: INVALID_BUSINESS_HOURS_MESSAGE };
  }

  const savedHours: HoursStepValues = {
    ...hours,
    openDays: weekdays
      .map(({ value }) => value)
      .filter((day) => hours.openDays.includes(day)),
  };

  mockStore.businessHours = savedHours;

  return { ok: true, data: structuredClone(savedHours) };
};
