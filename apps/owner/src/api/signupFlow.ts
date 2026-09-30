import { mockDelay } from './mocks/delay';
import type { ApiResult } from './types';

// 입점 신청부터 가게 최종 등록까지 회원가입 플로우의 단계별 입력값 (docs/requirements-owner.md)

export interface TermsStepValues {
  requiredAgreed: boolean;
  optionalAgreed: boolean;
}

// 카카오맵 장소 검색에서 선택한 가게 위치 정보
export interface StorePlace {
  kakaoPlaceId: string;
  roadAddress: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export interface StoreStepValues {
  name: string;
  category: string;
  ownerName: string;
  place: StorePlace | null;
}

export interface BusinessStepValues {
  // 하이픈 없는 숫자 10자리
  registrationNumber: string;
}

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface DailyBusinessHours {
  day: Weekday;
  isClosed: boolean;
  // HH:mm
  openTime: string;
  closeTime: string;
}

export interface HoursStepValues {
  businessHours: DailyBusinessHours[];
}

export interface MenuItemValues {
  image: File | null;
  name: string;
  price: string;
  description: string;
}

export interface MenuStepValues {
  logoImage: File | null;
  // 최대 3개
  interiorImages: File[];
  // 대표 메뉴 3개
  menus: MenuItemValues[];
}

export interface SignupFlowValues {
  terms: TermsStepValues;
  store: StoreStepValues;
  business: BusinessStepValues;
  hours: HoursStepValues;
  menu: MenuStepValues;
}

// 모든 단계의 입력값을 한 번에 받아 가게 최종 등록까지 처리한다.
// 실제 API는 단계마다 저장하므로(가게 기본 정보 저장 시 가게 ID 생성 등) 연동할 때 이 함수 내부를 단계별 호출로 바꾼다
export const submitSignupFlow = async (
  values: SignupFlowValues,
): Promise<ApiResult<null>> => {
  await mockDelay();

  if (!values.terms.requiredAgreed) {
    return { ok: false, message: '필수 약관에 동의해주세요.' };
  }

  return { ok: true, data: null };
};
