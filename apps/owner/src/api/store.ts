import { mockDelay } from './mocks/delay';
import { mockStore } from './mocks/store';
import {
  type HoursStepValues,
  isHoursStepComplete,
  MAX_INTERIOR_IMAGES,
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

// 새로 고른 사진은 File, 이미 올라간 사진은 주소
export type StoreImage = File | string;

export interface StoreImagesValues {
  // 가게 대표 이미지(로고). 필수
  logoImage: StoreImage;
  // 매장 이미지. 선택, 최대 MAX_INTERIOR_IMAGES장
  interiorImages: StoreImage[];
}

const INVALID_BUSINESS_HOURS_MESSAGE = '영업 요일과 시간을 다시 확인해 주세요.';
const INVALID_STORE_IMAGES_MESSAGE =
  '대표 이미지와 매장 이미지를 다시 확인해 주세요.';

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

// mock 업로드. 새로 고른 파일에 브라우저 임시 주소를 만들어 올라간 사진 주소로 쓴다
const uploadMockImage = (image: StoreImage) =>
  typeof image === 'string' ? image : URL.createObjectURL(image);

// 매장 사진 수정 (docs/requirements-owner.md "가게 이미지 및 대표 메뉴 등록/수정").
// 대표 이미지가 없거나 매장 이미지가 MAX_INTERIOR_IMAGES장을 넘으면 받지 않는다. 형식(jpg, png)과 용량(10MB)은 사진 칸에서 거른다.
// 이미 올라간 사진은 주소를 그대로 두고 새로 고른 파일만 올린다. 실제 연동 때는 새 파일만 사전 서명 URL로 올린 뒤
// 기존 주소와 새로 올린 사진을 순서대로 함께 저장 요청에 보낸다
export const updateStoreImages = async ({
  interiorImages,
  logoImage,
}: StoreImagesValues): Promise<
  ApiResult<Pick<MyStore, 'logoImageUrl' | 'interiorImageUrls'>>
> => {
  await mockDelay();

  if (!logoImage || interiorImages.length > MAX_INTERIOR_IMAGES) {
    return { ok: false, message: INVALID_STORE_IMAGES_MESSAGE };
  }

  mockStore.logoImageUrl = uploadMockImage(logoImage);
  mockStore.interiorImageUrls = interiorImages.map(uploadMockImage);

  return {
    ok: true,
    data: {
      logoImageUrl: mockStore.logoImageUrl,
      interiorImageUrls: [...mockStore.interiorImageUrls],
    },
  };
};
