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

export interface StoreLocation {
  latitude: number;
  longitude: number;
}

export interface MyStore {
  id: string;
  name: string;
  roadAddress: string;
  // 입점 신청 때 고른 가게 위치. 쿠폰 사용 처리에 매장 스캔 기기 위치로 보낸다. 서버에 좌표가 없으면 null
  location: StoreLocation | null;
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
  latitude: number | null;
  longitude: number | null;
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
        location:
          data.latitude !== null && data.longitude !== null
            ? { latitude: data.latitude, longitude: data.longitude }
            : null,
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

type BusinessHourRequest = ReturnType<typeof toServerBusinessHours>[number];

// 저장할 요일의 시작·종료 안에 들어가는 기존 브레이크타임과 라스트오더만 남긴다. 서버 검사와 같은 기준이다.
// 브레이크는 시작 < 브레이크 시작 < 브레이크 종료 < 종료, 라스트오더는 시작 이상 종료 이하이고 남긴 브레이크 구간 밖이어야 한다.
// 시각은 모두 HH:mm:ss라 문자열로 견준다
const keepOptionalTimes = (
  { closeTime, openTime }: BusinessHourRequest,
  saved: ServerBusinessHour | undefined,
) => {
  const breakStartTime = saved?.breakStartTime ?? null;
  const breakEndTime = saved?.breakEndTime ?? null;
  const lastOrderTime = saved?.lastOrderTime ?? null;
  const hasBreak =
    breakStartTime !== null &&
    breakEndTime !== null &&
    openTime < breakStartTime &&
    breakStartTime < breakEndTime &&
    breakEndTime < closeTime;
  const hasLastOrder =
    lastOrderTime !== null &&
    openTime <= lastOrderTime &&
    lastOrderTime <= closeTime &&
    !(
      hasBreak &&
      breakStartTime <= lastOrderTime &&
      lastOrderTime < breakEndTime
    );

  return {
    breakStartTime: hasBreak ? breakStartTime : null,
    breakEndTime: hasBreak ? breakEndTime : null,
    lastOrderTime: hasLastOrder ? lastOrderTime : null,
  };
};

// 영업시간 수정 (docs/requirements-owner.md "영업시간 등록/수정").
// 입점 신청과 같은 API지만 ACTIVE 점주는 version을 보내지 않는다.
// 서버는 전체 교체라 보내지 않은 브레이크타임과 라스트오더를 지운다. 점주 화면에는 그 입력이 없으므로
// 저장 직전에 지금 값을 받아 같은 요일에 실어 보낸다. 받지 못하면 지울 수 있어 저장하지 않는다.
// 새로 영업일로 고른 요일에는 원래 값이 없어 넣지 않는다.
// 응답에 저장한 영업시간이 없어, 화면은 가게 정보를 다시 불러와 보여준다
export const updateBusinessHours = async (
  hours: HoursStepValues,
): Promise<ApiResult<null>> => {
  try {
    const { businessHours: savedHours } =
      await request<Pick<StoreResponse, 'businessHours'>>('/v1/owner/store');

    await request('/v1/owner/store/hours', {
      method: 'PUT',
      body: {
        businessHours: toServerBusinessHours(hours).map((hour) => ({
          ...hour,
          ...keepOptionalTimes(
            hour,
            savedHours.find(({ dayOfWeek }) => dayOfWeek === hour.dayOfWeek),
          ),
        })),
      },
    });

    return { ok: true, data: null };
  } catch {
    return { ok: false };
  }
};
