import type { CampaignStatus } from './campaign';
import { request } from './client';
import { type ImageValue, isSameImage, toSavedImage } from './imageUpload';
import { mockCampaigns } from './mocks/campaigns';
import { mockDelay } from './mocks/delay';
import { mockStore } from './mocks/store';
import {
  getMenuErrors,
  type HoursStepValues,
  isHoursStepComplete,
  MAX_INTERIOR_IMAGES,
  MAX_MENUS,
  type ServerBusinessHour,
  toHoursStepValues,
  weekdays,
} from './signupFlow';
import type { ApiResult } from './types';

// 로그인한 점주의 가게 정보. 점주 계정 1개에 가게 1개만 등록된다
// 조회는 서버 API를 쓰고, 수정은 API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

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

export interface StoreImagesValues {
  // 가게 대표 이미지(로고). 필수지만 서버에 아직 없으면 null로 시작한다
  logoImage: ImageValue | null;
  // 매장 이미지. 선택, 최대 MAX_INTERIOR_IMAGES장
  interiorImages: ImageValue[];
}

// 대표 메뉴 저장 요청의 메뉴 한 개. 새로 추가한 메뉴는 아직 id가 없다
export interface StoreMenuValues {
  id: string | null;
  name: string;
  price: number;
  description: string;
  // 서버에서 불러온 메뉴는 사진이 없을 수 있다. 저장할 때 사진이 없으면 거절한다
  image: ImageValue | null;
}

const INVALID_BUSINESS_HOURS_MESSAGE = '영업 요일과 시간을 다시 확인해 주세요.';
const INVALID_STORE_IMAGES_MESSAGE =
  '대표 이미지와 매장 이미지를 다시 확인해 주세요.';
const INVALID_STORE_MENUS_MESSAGE = '대표 메뉴를 다시 확인해 주세요.';
const MENU_IN_USE_MESSAGE =
  '할인 중인 캠페인에 쓰이는 메뉴는 수정하거나 삭제할 수 없어요.';

// 이 상태의 "특정 메뉴 할인" 캠페인이 쓰는 메뉴는 고치거나 지울 수 없다.
// 고치면 할인 중인 캠페인의 메뉴가 바뀌고, 지우면 캠페인이 없는 메뉴를 가리키게 된다.
// 작성 중 캠페인은 막지 않고, 이어서 작성할 때 메뉴를 다시 고르게 한다
const MENU_LOCKING_STATUSES: CampaignStatus[] = [
  'ACTIVE',
  'PAUSED',
  'SCHEDULED',
];

// mock에서 새로 추가한 메뉴에 붙일 ID 번호
let nextMockMenuNumber = mockStore.menus.length + 1;

const createMockMenuId = () => {
  const id = `menu-${nextMockMenuNumber}`;
  nextMockMenuNumber += 1;

  return id;
};

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

// mock 업로드. 새로 고른 파일에 브라우저 임시 주소를 만들어 올라간 사진 주소로 쓴다
const uploadMockImage = (image: ImageValue) =>
  image.status === 'saved' ? image.url : URL.createObjectURL(image.file);

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

const findMenuIdsInUse = () =>
  new Set(
    mockCampaigns.flatMap(({ coupon, status }) =>
      MENU_LOCKING_STATUSES.includes(status) &&
      coupon.discountTarget === 'MENU' &&
      coupon.menuId
        ? [coupon.menuId]
        : [],
    ),
  );

// 진행 중·중단·시작 대기 캠페인의 "특정 메뉴 할인"이 쓰는 메뉴 ID. 대표 메뉴 수정에서 수정과 삭제를 막는 데 쓴다
export const getMenuIdsInUse = async (): Promise<ApiResult<string[]>> => {
  await mockDelay();

  return { ok: true, data: [...findMenuIdsInUse()] };
};

// 대표 메뉴 수정 (docs/requirements-owner.md "가게 이미지 및 대표 메뉴 등록/수정"). 선택, 최대 MAX_MENUS개
// 메뉴명·가격·사진·설명 규칙은 입점 등록과 같다. 캠페인이 쓰는 메뉴를 고치거나 빼는 요청은 받지 않는다.
// 기존 메뉴는 ID를 그대로 두어 캠페인의 할인 대상이 유지되고, 새로 추가한 메뉴만 새 ID를 받는다.
// 사진은 매장 사진과 같이 새로 고른 파일만 올린다
export const updateStoreMenus = async (
  menus: StoreMenuValues[],
): Promise<ApiResult<StoreMenu[]>> => {
  await mockDelay();

  // 가격은 원 단위 정수만 받는다. NaN은 문자열로 바꾸면 범위 검사를 통과하므로 먼저 거른다
  const hasInvalidMenu =
    menus.length > MAX_MENUS ||
    menus.some(
      ({ image, name, price }) =>
        !Number.isInteger(price) ||
        Object.values(
          getMenuErrors({ image, name, price: String(price) }),
        ).some(Boolean),
    );

  // 고치는 메뉴의 ID는 지금 가게 메뉴에 있어야 하고 한 번씩만 와야 한다.
  // 없는 ID나 같은 ID가 두 번 오면 캠페인이 가리키는 메뉴가 엉키므로 받지 않는다
  const currentIds = new Set(mockStore.menus.map(({ id }) => id));
  // 새 메뉴는 null로만 구분한다. 빈 문자열도 기존 ID로 보고 검사한다
  const requestedIds = menus.flatMap(({ id }) => (id !== null ? [id] : []));
  const hasInvalidId =
    requestedIds.some((id) => !currentIds.has(id)) ||
    new Set(requestedIds).size !== requestedIds.length;

  if (hasInvalidMenu || hasInvalidId) {
    return { ok: false, message: INVALID_STORE_MENUS_MESSAGE };
  }

  const keptIds = new Set(requestedIds);

  // 쓰이는 메뉴는 빠지지 않고, 이름·가격·설명·사진도 지금 값 그대로 와야 한다. 새로 고른 사진은 파일로 오므로 바뀐 것으로 본다
  const isInUseMenuChanged = [...findMenuIdsInUse()].some((id) => {
    const current = mockStore.menus.find((menu) => menu.id === id);
    const requested = menus.find((menu) => menu.id === id);

    return (
      !requested ||
      (current !== undefined &&
        (requested.name.trim() !== current.name ||
          requested.price !== current.price ||
          requested.description.trim() !== current.description ||
          !isSameImage(
            requested.image,
            current.imageUrl === null ? null : toSavedImage(current.imageUrl),
          )))
    );
  });

  if (isInUseMenuChanged) {
    return { ok: false, message: MENU_IN_USE_MESSAGE };
  }

  // 지운 메뉴를 쓰던 작성 중 캠페인은 할인 메뉴를 비워, 이어서 작성할 때 다시 고르게 한다
  mockCampaigns.forEach(({ coupon, status }) => {
    if (status === 'DRAFT' && coupon.menuId && !keptIds.has(coupon.menuId)) {
      coupon.menuId = null;
    }
  });

  mockStore.menus = menus.map(({ description, id, image, name, price }) => ({
    id: id ?? createMockMenuId(),
    name: name.trim(),
    price,
    description: description.trim(),
    // 사진이 없는 메뉴는 위 검사(hasInvalidMenu)에서 거절되지만, 타입으로는 남아 있어 그대로 넘긴다
    imageUrl: image && uploadMockImage(image),
  }));

  return { ok: true, data: structuredClone(mockStore.menus) };
};
