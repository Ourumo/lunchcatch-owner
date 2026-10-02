import { mockDelay } from './mocks/delay';
import { mockStore } from './mocks/store';
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
  logoImageUrl: string;
  // 입점 등록 때 등록한 대표 메뉴 3개
  menus: StoreMenu[];
}

export const getMyStore = async (): Promise<ApiResult<MyStore>> => {
  await mockDelay();

  return { ok: true, data: structuredClone(mockStore) };
};
