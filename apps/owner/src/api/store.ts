import { mockDelay } from './mocks/delay';
import { mockStore } from './mocks/store';
import type { HoursStepValues } from './signupFlow';
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

export const getMyStore = async (): Promise<ApiResult<MyStore>> => {
  await mockDelay();

  return { ok: true, data: structuredClone(mockStore) };
};
