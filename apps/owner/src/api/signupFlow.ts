import { mockDelay } from './mocks/delay';
import { mockStorePlaces } from './mocks/places';
import { mockOwnerTerms } from './mocks/terms';
import type { ApiResult } from './types';

// 입점 신청부터 가게 최종 등록까지 회원가입 플로우의 단계별 입력값 (docs/requirements-owner.md)

export type TermsId =
  'service' | 'paidService' | 'privacy' | 'location' | 'marketing';

export interface TermsSection {
  heading: string;
  items: string[];
}

export interface TermsItem {
  id: TermsId;
  title: string;
  required: boolean;
  // 동의 시점과 함께 저장하는 약관 버전
  version: string;
  // 약관 주요 내용. API 연동 시 서버에서 받은 전문으로 바꾼다
  sections: TermsSection[];
}

// 약관별 동의 여부
export interface TermsStepValues {
  service: boolean;
  paidService: boolean;
  privacy: boolean;
  location: boolean;
  marketing: boolean;
}

// API 연동 전까지 mock 약관 목록을 쓴다. 연동하면 서버에서 버전과 함께 받아온다
export const ownerTerms: TermsItem[] = mockOwnerTerms;

export const hasAgreedRequiredTerms = (terms: TermsStepValues) =>
  ownerTerms.every((item) => !item.required || terms[item.id]);

// 카카오맵 장소 검색에서 선택한 가게 위치 정보
export interface StorePlace {
  kakaoPlaceId: string;
  placeName: string;
  roadAddress: string;
  // 지번 주소. 도로명 주소 아래에 참고용으로 보여준다
  address: string;
  // 카카오맵에 등록된 형식(02-1234-5678) 그대로. 없으면 빈 문자열
  phone: string;
  latitude: number;
  longitude: number;
}

const normalizeSearchText = (text: string) => text.replace(/\s/g, '');

// 주소나 상호명으로 가게 위치를 찾는다. 검색어가 비어 있거나 결과가 없으면 빈 목록을 돌려준다.
// API 연동 전까지 mock 장소 목록에서 찾는다. 연동하면 카카오맵 장소 검색(키워드 검색)으로 바꾼다
export const searchStorePlaces = async (
  query: string,
): Promise<ApiResult<StorePlace[]>> => {
  await mockDelay();

  const keyword = normalizeSearchText(query);

  if (!keyword) {
    return { ok: true, data: [] };
  }

  const places = mockStorePlaces.filter((place) =>
    [place.placeName, place.roadAddress, place.address].some((text) =>
      normalizeSearchText(text).includes(keyword),
    ),
  );

  return { ok: true, data: structuredClone(places) };
};

export type StoreCategory =
  | 'KOREAN'
  | 'CHINESE'
  | 'JAPANESE'
  | 'WESTERN'
  | 'BUNSIK'
  | 'ASIAN'
  | 'FAST_FOOD'
  | 'CAFE_DESSERT'
  | 'OTHER';

// 업종 선택 칩에 이 순서대로 보여준다
export const storeCategories: { value: StoreCategory; label: string }[] = [
  { value: 'KOREAN', label: '한식' },
  { value: 'CHINESE', label: '중식' },
  { value: 'JAPANESE', label: '일식' },
  { value: 'WESTERN', label: '양식' },
  { value: 'BUNSIK', label: '분식' },
  { value: 'ASIAN', label: '아시안' },
  { value: 'FAST_FOOD', label: '패스트푸드' },
  { value: 'CAFE_DESSERT', label: '카페/디저트' },
  { value: 'OTHER', label: '기타' },
];

export interface StoreStepValues {
  name: string;
  category: StoreCategory | null;
  ownerName: string;
  // 하이픈 없는 숫자
  phone: string;
}

export interface LocationStepValues {
  place: StorePlace | null;
}

export interface BusinessStepValues {
  // 하이픈 없는 숫자 10자리
  registrationNumber: string;
}

// 0으로 시작하는 9~11자리 (02-123-4567, 010-1234-5678 등)
export const isValidPhone = (phone: string) => /^0\d{8,10}$/.test(phone);

export const isValidBusinessNumber = (registrationNumber: string) =>
  /^\d{10}$/.test(registrationNumber);

// 가게 기본 정보 필수 항목별 입력 완료 여부.
// 사업자등록번호는 가게 기본 정보 화면에서 함께 입력받는다
export const getStoreRequiredChecks = (
  store: StoreStepValues,
  business: BusinessStepValues,
) => [
  store.name.trim() !== '',
  store.ownerName.trim() !== '',
  isValidPhone(store.phone),
  store.category !== null,
  isValidBusinessNumber(business.registrationNumber),
];

export const isStoreStepComplete = (
  store: StoreStepValues,
  business: BusinessStepValues,
) => getStoreRequiredChecks(store, business).every(Boolean);

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

// 영업 요일 칩에 이 순서대로 보여준다
export const weekdays: { value: Weekday; label: string }[] = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
];

// 영업일마다 같은 시간을 쓴다. 고르지 않은 요일은 휴무
export interface HoursStepValues {
  openDays: Weekday[];
  // HH:mm. 입력 전에는 빈 문자열
  openTime: string;
  closeTime: string;
}

// 자정을 넘기는 영업은 받지 않으므로 종료 시간이 시작 시간보다 늦어야 한다
export const isValidTimeRange = (openTime: string, closeTime: string) =>
  openTime < closeTime;

export const isHoursStepComplete = ({
  openDays,
  openTime,
  closeTime,
}: HoursStepValues) =>
  openDays.length > 0 &&
  openTime !== '' &&
  closeTime !== '' &&
  isValidTimeRange(openTime, closeTime);

// API에 보내는 요일별 영업시간. 휴무일에 시각이 있으면 등록할 수 없어 null로 보낸다
export interface DailyBusinessHours {
  day: Weekday;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export const toDailyBusinessHours = ({
  openDays,
  openTime,
  closeTime,
}: HoursStepValues): DailyBusinessHours[] =>
  weekdays.map(({ value: day }) =>
    openDays.includes(day)
      ? { day, isClosed: false, openTime, closeTime }
      : { day, isClosed: true, openTime: null, closeTime: null },
  );

export interface MenuItemValues {
  image: File | null;
  name: string;
  price: string;
  description: string;
}

export interface ImagesStepValues {
  // 가게 대표 이미지(로고). 필수
  logoImage: File | null;
  // 매장 이미지. 선택, 최대 3장
  interiorImages: File[];
}

export interface MenuStepValues {
  // 대표 메뉴. 선택, 최대 3개
  menus: MenuItemValues[];
}

export interface SignupFlowValues {
  terms: TermsStepValues;
  store: StoreStepValues;
  location: LocationStepValues;
  // 별도 단계 없이 가게 기본 정보 화면에서 함께 입력받는다
  business: BusinessStepValues;
  hours: HoursStepValues;
  images: ImagesStepValues;
  menu: MenuStepValues;
}

// 모든 단계의 입력값을 한 번에 받아 가게 최종 등록까지 처리한다.
// 실제 API는 단계마다 저장하므로(가게 기본 정보 저장 시 가게 ID 생성 등) 연동할 때 이 함수 내부를 단계별 호출로 바꾼다
export const submitSignupFlow = async (
  values: SignupFlowValues,
): Promise<ApiResult<null>> => {
  await mockDelay();

  if (!hasAgreedRequiredTerms(values.terms)) {
    return { ok: false, message: '필수 약관에 동의해주세요.' };
  }

  return { ok: true, data: null };
};
