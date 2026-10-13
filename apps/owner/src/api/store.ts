import { mockDelay } from './mocks/delay';
import { mockStore } from './mocks/store';
import {
  type HoursStepValues,
  isHoursStepComplete,
  weekdays,
} from './signupFlow';
import type { ApiResult } from './types';

// 로그인한 점주의 가게 정보. 점주 계정 1개에 가게 1개만 등록된다
// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export interface StoreMenu {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface MyStore {
  id: string;
  name: string;
  roadAddress: string;
  // 가게 대표 이미지(로고)
  logoImageUrl: string;
  // 매장 이미지. 0~3장 (입점 등록 MAX_INTERIOR_IMAGES)
  interiorImageUrls: string[];
  // 영업일마다 같은 시간을 쓴다. 입점 등록의 영업시간 입력값과 같은 형태
  businessHours: HoursStepValues;
  // 대표 메뉴. 선택, 최대 3개 (입점 등록 MAX_MENUS)
  menus: StoreMenu[];
}

const INVALID_BUSINESS_HOURS_MESSAGE = '영업 요일과 시간을 다시 확인해 주세요.';

export const getMyStore = async (): Promise<ApiResult<MyStore>> => {
  await mockDelay();

  return { ok: true, data: structuredClone(mockStore) };
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
