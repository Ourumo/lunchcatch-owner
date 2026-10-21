import { ApiError, request } from './client';
import { type ImageValue, toSavedImage } from './imageUpload';
import { mockDelay } from './mocks/delay';
import { mockStorePlaces } from './mocks/places';
import { mockOwnerTerms } from './mocks/terms';
import type { ApiResult } from './types';

// 입점 신청부터 가게 최종 등록까지 회원가입 플로우의 단계별 입력값과 단계 저장 (docs/requirements-owner.md)

export type TermsId = 'service' | 'paidService' | 'privacy' | 'location';

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
}

// API 연동 전까지 mock 약관 목록을 쓴다. 연동하면 서버에서 버전과 함께 받아온다
export const ownerTerms: TermsItem[] = mockOwnerTerms;

export const hasAgreedRequiredTerms = (terms: TermsStepValues) =>
  ownerTerms.every((item) => !item.required || terms[item.id]);

// 단계 저장 응답에 공통으로 오는 입점 진행 버전. 다음 단계를 저장할 때 그대로 보낸다
interface OnboardingSaveResponse {
  version: number;
}

// 단계 저장 실패. 화면이 이유별로 안내하고 진행 상태를 다시 불러올 수 있게 서버가 거절한 이유(code)를 함께 돌려준다.
// 응답을 받지 못했거나 본문이 없으면 code 없이 돌려준다
const toSaveFailure = (error: unknown) => ({
  ok: false as const,
  code: error instanceof ApiError ? (error.code ?? undefined) : undefined,
});

// 약관 동의 저장. 약관은 모두 필수라 화면에서 모두 동의해야 부를 수 있고,
// 서버가 동의 시점과 약관 버전을 남기므로 본문은 비워 보낸다. 성공하면 입점 진행 버전을 돌려준다
export const saveTermsStep = async (): Promise<ApiResult<number>> => {
  try {
    const data = await request<OnboardingSaveResponse>(
      '/v1/owner/terms-agreements',
      { method: 'PUT', body: {} },
    );

    return { ok: true, data: data.version };
  } catch (error) {
    return toSaveFailure(error);
  }
};

// 카카오맵 장소 검색에서 선택한 가게 위치 정보.
// 서버는 장소 ID, 도로명 주소, 좌표만 저장해, 서버에서 불러온 위치는 상호명·지번 주소·전화번호가 빈 문자열이다
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

// 매장 위치 저장. 장소를 고르지 않으면 "다음"이 막혀 있어 부르지 않는다.
// 검색 결과의 상호명, 지번 주소, 전화번호는 화면에 보여주기만 하고 보내지 않는다
export const saveLocationStep = async (
  { place }: LocationStepValues,
  version: number,
): Promise<ApiResult<number>> => {
  if (!place) {
    return { ok: false };
  }

  try {
    const data = await request<OnboardingSaveResponse>(
      '/v1/owner/store/location',
      {
        method: 'PUT',
        body: {
          version,
          kakaoPlaceId: place.kakaoPlaceId,
          roadAddress: place.roadAddress,
          latitude: place.latitude,
          longitude: place.longitude,
        },
      },
    );

    return { ok: true, data: data.version };
  } catch (error) {
    return toSaveFailure(error);
  }
};

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

// 가게 기본 정보 저장. 처음 저장하면 서버가 가게 초안을 만들고, 다시 저장하면 덮어쓴다.
// 전화번호와 사업자등록번호는 입력할 때부터 하이픈 없는 숫자만 받으므로 그대로 보낸다
export const saveStoreStep = async (
  { category, name, ownerName, phone }: StoreStepValues,
  { registrationNumber }: BusinessStepValues,
  version: number,
): Promise<ApiResult<number>> => {
  try {
    const data = await request<OnboardingSaveResponse>(
      '/v1/owner/store/basic',
      {
        method: 'PUT',
        body: {
          version,
          name: name.trim(),
          categoryCode: category,
          representativeName: ownerName.trim(),
          businessRegistrationNumber: registrationNumber,
          phone,
        },
      },
    );

    return { ok: true, data: data.version };
  } catch (error) {
    return toSaveFailure(error);
  }
};

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

// 두 시간을 모두 입력한 뒤에만 순서를 검사한다. 입점 등록과 가게 관리가 같은 문구를 쓴다
export const getTimeRangeError = (openTime: string, closeTime: string) =>
  openTime && closeTime && !isValidTimeRange(openTime, closeTime)
    ? '시작 시간보다 늦어야 해요'
    : undefined;

export const isHoursStepComplete = ({
  openDays,
  openTime,
  closeTime,
}: HoursStepValues) =>
  openDays.length > 0 &&
  openTime !== '' &&
  closeTime !== '' &&
  isValidTimeRange(openTime, closeTime);

const serverWeekdays: Record<Weekday, string> = {
  MON: 'MONDAY',
  TUE: 'TUESDAY',
  WED: 'WEDNESDAY',
  THU: 'THURSDAY',
  FRI: 'FRIDAY',
  SAT: 'SATURDAY',
  SUN: 'SUNDAY',
};

// 화면은 HH:mm, 서버는 HH:mm:ss만 받는다
const toServerTime = (time: string) => `${time}:00`;

// 영업시간 저장. 서버는 요일마다 시간을 받으므로 영업 요일마다 같은 시간을 월~일 순서로 보낸다.
// 보내지 않은 요일은 서버가 휴무로 저장한다
export const saveHoursStep = async (
  { openDays, openTime, closeTime }: HoursStepValues,
  version: number,
): Promise<ApiResult<number>> => {
  try {
    const data = await request<OnboardingSaveResponse>(
      '/v1/owner/store/hours',
      {
        method: 'PUT',
        body: {
          version,
          businessHours: weekdays
            .filter(({ value }) => openDays.includes(value))
            .map(({ value }) => ({
              dayOfWeek: serverWeekdays[value],
              openTime: toServerTime(openTime),
              closeTime: toServerTime(closeTime),
            })),
        },
      },
    );

    return { ok: true, data: data.version };
  } catch (error) {
    return toSaveFailure(error);
  }
};

// 서버가 주는 요일별 영업시간. 시각은 HH:mm:ss로 온다
export interface ServerBusinessHour {
  dayOfWeek: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean | null;
}

const toTime = (time: string | null) => time?.slice(0, 5) ?? '';

// 서버는 요일마다 시간을 따로 두지만, 화면은 영업일마다 같은 시간을 쓴다. 입점 신청과 가게 관리가 같이 쓴다.
// 휴무가 아니고 시간이 있는 요일을 영업 요일로 보고, 시간은 첫 영업 요일 값을 쓴다
export const toHoursStepValues = (
  hours: ServerBusinessHour[],
): HoursStepValues => {
  const openHours = weekdays.flatMap(({ value }) => {
    const day = hours.find(
      (hour) =>
        hour.dayOfWeek === serverWeekdays[value] &&
        !hour.isClosed &&
        hour.openTime &&
        hour.closeTime,
    );

    return day ? [{ ...day, weekday: value }] : [];
  });

  return {
    openDays: openHours.map(({ weekday }) => weekday),
    openTime: toTime(openHours[0]?.openTime ?? null),
    closeTime: toTime(openHours[0]?.closeTime ?? null),
  };
};

export const MAX_MENUS = 3;
export const MENU_NAME_MAX_LENGTH = 20;
export const MENU_PRICE_MIN = 100;
export const MENU_PRICE_MAX = 1_000_000;

// 입력 검사를 통과해 목록에 들어간 대표 메뉴. 사진, 메뉴명, 가격 모두 필수.
// 서버에서 불러온 메뉴는 등록한 메뉴 ID가 있고, 사진을 올리기 전이면 사진이 없을 수 있다
export interface MenuItemValues {
  id?: string | null;
  image: ImageValue | null;
  name: string;
  // 쉼표 없는 숫자
  price: string;
}

// 바텀시트에서 입력 중인 대표 메뉴. 저장 전이라 비어 있을 수 있다
export interface MenuDraft {
  image: ImageValue | null;
  name: string;
  price: string;
}

export type MenuField = keyof MenuDraft;

// 사진은 있는지만 본다. 가게 관리에서는 이미 올라간 사진도 넘긴다
export const getMenuErrors = ({
  image,
  name,
  price,
}: MenuDraft): Record<MenuField, string | undefined> => {
  const priceValue = Number(price);

  return {
    image: image ? undefined : '메뉴 사진을 등록해주세요',
    name: !name.trim()
      ? '메뉴명을 입력해주세요'
      : name.trim().length > MENU_NAME_MAX_LENGTH
        ? `메뉴명은 ${MENU_NAME_MAX_LENGTH}자 이내로 입력해주세요`
        : undefined,
    price: !price
      ? '가격을 입력해주세요'
      : priceValue < MENU_PRICE_MIN || priceValue > MENU_PRICE_MAX
        ? `가격은 ${MENU_PRICE_MIN.toLocaleString()}원 이상 ${MENU_PRICE_MAX.toLocaleString()}원 이하로 입력해주세요`
        : undefined,
  };
};

// 대표 메뉴 입력 화면(ui/MenuListFields)에 넘기는 규칙. 입점 등록과 가게 관리가 같은 값을 쓴다
export const menuInputRules = {
  nameMaxLength: MENU_NAME_MAX_LENGTH,
  priceMax: MENU_PRICE_MAX,
  getErrors: getMenuErrors,
};

export const MAX_INTERIOR_IMAGES = 3;

export interface ImagesStepValues {
  // 가게 대표 이미지(로고). 필수
  logoImage: ImageValue | null;
  // 매장 이미지. 선택, 최대 MAX_INTERIOR_IMAGES장
  interiorImages: ImageValue[];
}

// 서버의 현재 진행 단계와 완료를 요청한 단계가 다름 (409)
const STEP_MISMATCH_CODE = 'STORE-002';

// 그 단계를 이미 마쳤으면 지금 입점 진행 버전을, 아니면(불러오지 못한 경우 포함) null을 돌려준다
const getCompletedStepVersion = async (step: string) => {
  try {
    const { onboarding } =
      await request<Pick<SignupStoreResponse, 'onboarding'>>('/v1/owner/store');

    return onboarding.steps.some(
      (current) => current.step === step && current.completed,
    )
      ? onboarding.version
      : null;
  } catch {
    return null;
  }
};

// 사진·메뉴 단계 완료. 다시 보내면 덮어쓰는 다른 단계와 달리, 서버의 현재 단계가 그 단계일 때만 받는다.
// 이미 마친 단계로 돌아와 "다음"을 누르면 409 STORE-002로 거절하므로, 마친 단계면 지금 버전으로 그대로 넘어간다
const completeOnboardingStep = async (
  path: string,
  step: string,
  version: number,
): Promise<ApiResult<number>> => {
  try {
    const data = await request<OnboardingSaveResponse>(path, {
      method: 'POST',
      body: { version },
    });

    return { ok: true, data: data.version };
  } catch (error) {
    if (error instanceof ApiError && error.code === STEP_MISMATCH_CODE) {
      const completedVersion = await getCompletedStepVersion(step);

      if (completedVersion !== null) {
        return { ok: true, data: completedVersion };
      }
    }

    return toSaveFailure(error);
  }
};

// 사진 단계 완료. 사진은 고를 때 올리고 확인까지 마쳐 가게에 붙어 있으므로 단계 완료만 알린다.
// 대표 이미지가 없으면 서버가 409 STORE-010으로 거절한다
export const saveImagesStep = (version: number) =>
  completeOnboardingStep('/v1/owner/store-images:complete', 'IMAGES', version);

// 대표 메뉴 단계 완료. 메뉴는 추가할 때 등록하고 사진까지 올리므로 단계 완료만 알린다. 메뉴가 없어도 부른다.
// 사진이 없는 메뉴가 있으면 서버가 409 STORE-013으로 거절한다
export const saveMenuStep = (version: number) =>
  completeOnboardingStep('/v1/owner/store-menus:complete', 'MENU', version);

export interface MenuStepValues {
  // 대표 메뉴. 선택, 최대 MAX_MENUS개
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

// 서버의 입점 단계 이름
const signupStepIds: Record<string, keyof SignupFlowValues> = {
  TERMS: 'terms',
  STORE_INFO: 'store',
  LOCATION: 'location',
  HOURS: 'hours',
  IMAGES: 'images',
  MENU: 'menu',
};

interface StoreImageResponse {
  url: string;
  sortOrder: number;
}

// 내 가게 조회(GET /v1/owner/store) 중 입점 신청 입력값을 되살리는 데 쓰는 값.
// 가게 기본 정보를 저장하기 전에는 가게 값이 모두 null이다
interface SignupStoreResponse {
  name: string | null;
  businessCategory: string | null;
  representativeName: string | null;
  businessRegistrationNumber: string | null;
  phone: string | null;
  kakaoPlaceId: string | null;
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
    sortOrder: number;
    image: StoreImageResponse | null;
  }[];
  onboarding: {
    // 최종 등록을 마쳤으면 null
    resumeStep: string | null;
    version: number;
    steps: { step: string; completed: boolean }[];
  };
}

export interface SignupProgress {
  values: SignupFlowValues;
  // 다음 단계 저장에 보낼 입점 진행 버전
  version: number;
  // 이어서 진행할 단계. 최종 등록을 마쳤으면 null
  resumeStep: keyof SignupFlowValues | null;
}

const bySortOrder = (a: { sortOrder: number }, b: { sortOrder: number }) =>
  a.sortOrder - b.sortOrder;

const isStoreCategory = (code: string | null): code is StoreCategory =>
  storeCategories.some(({ value }) => value === code);

// 입점 신청 중에 나갔다 다시 들어오면 서버에 저장한 값과 이어갈 단계를 불러온다.
// 내 가게 조회 하나에 저장한 값과 진행 상태가 함께 있어, 진행 상태 조회를 따로 부르지 않는다.
// 약관은 동의한 약관을 따로 주지 않아, 약관 단계가 끝났으면 모두 동의한 것으로 본다 (약관은 모두 필수)
export const getSignupProgress = async (): Promise<
  ApiResult<SignupProgress>
> => {
  try {
    const data = await request<SignupStoreResponse>('/v1/owner/store');
    const isTermsCompleted = data.onboarding.steps.some(
      ({ completed, step }) => step === 'TERMS' && completed,
    );
    const { kakaoPlaceId, latitude, longitude, roadAddress } = data;

    return {
      ok: true,
      data: {
        version: data.onboarding.version,
        resumeStep:
          data.onboarding.resumeStep === null
            ? null
            : (signupStepIds[data.onboarding.resumeStep] ?? null),
        values: {
          terms: {
            service: isTermsCompleted,
            paidService: isTermsCompleted,
            privacy: isTermsCompleted,
            location: isTermsCompleted,
          },
          store: {
            name: data.name ?? '',
            category: isStoreCategory(data.businessCategory)
              ? data.businessCategory
              : null,
            ownerName: data.representativeName ?? '',
            phone: data.phone ?? '',
          },
          location: {
            place:
              kakaoPlaceId !== null &&
              roadAddress !== null &&
              latitude !== null &&
              longitude !== null
                ? {
                    kakaoPlaceId,
                    placeName: '',
                    roadAddress,
                    address: '',
                    phone: '',
                    latitude,
                    longitude,
                  }
                : null,
          },
          business: {
            registrationNumber: data.businessRegistrationNumber ?? '',
          },
          hours: toHoursStepValues(data.businessHours),
          images: {
            logoImage: data.logoImage ? toSavedImage(data.logoImage.url) : null,
            interiorImages: [...data.interiorImages]
              .sort(bySortOrder)
              .map(({ url }) => toSavedImage(url)),
          },
          menu: {
            menus: [...data.menus].sort(bySortOrder).map((menu) => ({
              id: String(menu.menuId),
              name: menu.name,
              price: String(menu.price),
              image: menu.image ? toSavedImage(menu.image.url) : null,
            })),
          },
        },
      },
    };
  } catch {
    return { ok: false };
  }
};

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
