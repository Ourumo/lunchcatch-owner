import { addDays, getKstToday, toKstDateTime } from './date';

// 시연 데이터의 처음 상태. 로그아웃하거나 저장된 데이터가 없으면 이 값으로 시작한다 (db.ts).
// 모양은 서버 응답과 같게 둔다. 핸들러가 그대로 data에 담아 보내고, 화면의 api/*.ts가 서버 응답처럼 바꿔 쓴다.
// 서버 응답 타입은 api/*.ts 안에만 있어(내보내지 않음) 여기에 같은 모양을 다시 적는다

// 서버 영업시간 한 요일 (GET /v1/owner/store의 businessHours)
export interface MockBusinessHour {
  dayOfWeek: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  lastOrderTime: string | null;
}

export interface MockImage {
  objectKey: string;
  url: string;
  sortOrder: number;
}

// 입점 신청 단계. 서버가 이 순서로 진행한다
export const ONBOARDING_STEPS = [
  'TERMS',
  'STORE_INFO',
  'LOCATION',
  'HOURS',
  'IMAGES',
  'MENU',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

// 서버 가게 정보 (GET /v1/owner/store). 영업 중인 가게 화면(api/store.ts)과 입점 신청(api/signupFlow.ts)이 같은 응답을 읽는다.
// 입점 신청에서 가게 기본 정보를 저장하기 전에는 가게 값이 모두 null이다
export interface MockStore {
  storeId: number | null;
  name: string | null;
  businessCategory: string | null;
  representativeName: string | null;
  businessRegistrationNumber: string | null;
  phone: string | null;
  kakaoPlaceId: string | null;
  roadAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  businessHours: MockBusinessHour[];
  logoImage: MockImage | null;
  interiorImages: MockImage[];
  menus: {
    menuId: number;
    name: string;
    price: number;
    description: string | null;
    sortOrder: number;
    image: MockImage | null;
  }[];
  onboarding: {
    // 이어서 진행할 단계. 최종 등록을 마쳤으면 null
    resumeStep: OnboardingStep | null;
    // 단계를 저장할 때마다 1씩 오른다. 화면은 받은 값을 다음 저장에 보내고, 다르면 서버가 거절한다(다른 창에서 먼저 저장)
    version: number;
    steps: { step: OnboardingStep; completed: boolean }[];
  };
}

// 사진 업로드 한 건. 업로드 주소를 발급할 때 만들고, 사진을 받으면 url을 채우고, 확인하면 가게 · 메뉴에 붙인다
export interface MockUpload {
  target: 'LOGO' | 'INTERIOR' | 'MENU';
  // 메뉴 사진이면 어느 메뉴인지
  menuId: number | null;
  // 매장 사진 중 몇 번째인지. 발급할 때 자리를 잡는다
  sortOrder: number;
  // 받은 사진을 줄인 data URL. 아직 올리지 않았으면 null
  url: string | null;
  confirmed: boolean;
}

export type MockCampaignStatus =
  'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED';

// 서버 캠페인 상세 (GET /v1/owner/campaigns/{id}). 목록 응답은 이 값에서 골라 만든다
export interface MockCampaign {
  campaignId: number;
  status: MockCampaignStatus;
  pausedReason: 'ADMIN' | 'OWNER' | 'NO_POINTS' | null;
  discountTargetType: 'ALL' | 'MENU';
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  targetMenuId: number | null;
  issueQuantity: number;
  usableStartTime: string;
  usableEndTime: string;
  minOrderAmount: number | null;
  notice: string | null;
  targetRadius: number;
  targetGender: 'ALL' | 'MALE' | 'FEMALE';
  targetAgeGroups: string[];
  dailyBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// 목 서버 전체 상태. 쓰기 요청(로그인, 튜토리얼 완료 등)이 이 값을 바꾸고 db.ts가 저장한다
export interface MockDb {
  // 시연 데이터 모양이 바뀌면 올린다. 저장된 값과 다르면 버리고 처음 상태로 시작한다
  version: number;
  owner: {
    email: string;
    // ONBOARDING은 입점 신청 중, ACTIVE는 영업 중
    status: 'ONBOARDING' | 'ACTIVE';
    // 서버의 인증 쿠키 대신 쓴다. 로그인하면 true, 로그아웃하면 처음 상태로 돌아가 false
    isLoggedIn: boolean;
    // 첫 로그인 때 튜토리얼을 보여주도록 false로 시작한다
    tutorialViewed: boolean;
  };
  store: MockStore;
  campaigns: MockCampaign[];
  points: {
    // 원장 합계. 충전·환불·소진이 생기면 바뀐다
    balance: number;
    // 오늘 캠페인에 예약된 포인트
    reservedPoint: number;
  };
  // 업로드 ID → 업로드
  uploads: Record<string, MockUpload>;
  // 마지막으로 발급한 로고 업로드. 그보다 먼저 받은 로고 업로드는 확인할 수 없다 (다른 창에서 로고를 다시 올린 경우)
  latestLogoUploadId: string | null;
  // 새로 만드는 업로드 · 메뉴의 ID
  nextId: number;
}

export const MOCK_DB_VERSION = 2;

export const MOCK_OWNER_EMAIL = 'demo@lunchcatch.com';

export const MOCK_STORE_ID = 1;

const ALL_AGE_GROUPS = ['AGE_20S', 'AGE_30S', 'AGE_40S', 'AGE_50_PLUS'];

// 평일 11:00~21:00 영업, 브레이크타임 15:00~17:00, 주말 휴무
const createBusinessHours = (): MockBusinessHour[] =>
  [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ].map((dayOfWeek) => {
    const isClosed = dayOfWeek === 'SATURDAY' || dayOfWeek === 'SUNDAY';

    return {
      dayOfWeek,
      openTime: isClosed ? null : '11:00:00',
      closeTime: isClosed ? null : '21:00:00',
      isClosed,
      breakStartTime: isClosed ? null : '15:00:00',
      breakEndTime: isClosed ? null : '17:00:00',
      lastOrderTime: isClosed ? null : '20:30:00',
    };
  });

// 캠페인 날짜는 오늘 기준으로 계산한다.
// 진행 중 1개(6일 전 시작, 24일 뒤 종료)와 지난 캠페인 2개를 둔다. 가게당 현재 캠페인은 하나뿐이다
const createCampaigns = (today: string): MockCampaign[] => [
  {
    campaignId: 3,
    status: 'ACTIVE',
    pausedReason: null,
    discountTargetType: 'ALL',
    discountType: 'PERCENT',
    discountValue: 15,
    targetMenuId: null,
    issueQuantity: 30,
    usableStartTime: '11:30:00',
    usableEndTime: '14:00:00',
    minOrderAmount: 10000,
    notice: '포장 주문에도 쓸 수 있어요.',
    targetRadius: 1000,
    targetGender: 'ALL',
    targetAgeGroups: ALL_AGE_GROUPS,
    dailyBudget: 20000,
    startDate: addDays(today, -6),
    endDate: addDays(today, 24),
    createdAt: toKstDateTime(addDays(today, -8), '14:20:00'),
  },
  {
    campaignId: 2,
    status: 'ENDED',
    pausedReason: null,
    discountTargetType: 'MENU',
    discountType: 'AMOUNT',
    discountValue: 2000,
    targetMenuId: 102,
    issueQuantity: 20,
    usableStartTime: '11:30:00',
    usableEndTime: '13:30:00',
    minOrderAmount: null,
    notice: null,
    targetRadius: 500,
    targetGender: 'ALL',
    targetAgeGroups: ['AGE_20S', 'AGE_30S'],
    dailyBudget: 15000,
    startDate: addDays(today, -30),
    endDate: addDays(today, -16),
    createdAt: toKstDateTime(addDays(today, -32), '10:05:00'),
  },
  {
    campaignId: 1,
    status: 'ENDED',
    pausedReason: null,
    discountTargetType: 'ALL',
    discountType: 'AMOUNT',
    discountValue: 1000,
    targetMenuId: null,
    issueQuantity: 20,
    usableStartTime: '12:00:00',
    usableEndTime: '14:00:00',
    minOrderAmount: 8000,
    notice: null,
    targetRadius: 1000,
    targetGender: 'ALL',
    targetAgeGroups: ALL_AGE_GROUPS,
    dailyBudget: 10000,
    startDate: addDays(today, -62),
    endDate: addDays(today, -48),
    createdAt: toKstDateTime(addDays(today, -63), '16:40:00'),
  },
];

export const createSeed = (): MockDb => {
  const today = getKstToday();

  return {
    version: MOCK_DB_VERSION,
    owner: {
      email: MOCK_OWNER_EMAIL,
      status: 'ACTIVE',
      isLoggedIn: false,
      tutorialViewed: false,
    },
    store: {
      storeId: MOCK_STORE_ID,
      name: '런치캐치 시연 한식당',
      businessCategory: 'KOREAN',
      representativeName: '김런치',
      businessRegistrationNumber: '1234567890',
      phone: '0212345678',
      kakaoPlaceId: '1000000001',
      roadAddress: '서울 강남구 테헤란로 123',
      latitude: 37.5006,
      longitude: 127.0364,
      businessHours: createBusinessHours(),
      // 사진은 S3가 내려가 쓸 수 없어 비워 둔다. 화면은 사진이 없을 때의 모습으로 보여준다
      logoImage: null,
      interiorImages: [],
      menus: [
        {
          menuId: 101,
          name: '김치찌개',
          price: 9000,
          description: '국내산 돼지고기를 넣고 끓인 김치찌개',
          sortOrder: 0,
          image: null,
        },
        {
          menuId: 102,
          name: '제육볶음',
          price: 10000,
          description: '매콤한 양념에 볶은 제육과 쌈 채소',
          sortOrder: 1,
          image: null,
        },
        {
          menuId: 103,
          name: '된장찌개',
          price: 9000,
          description: null,
          sortOrder: 2,
          image: null,
        },
      ],
      // 입점 신청을 마친 가게
      onboarding: {
        resumeStep: null,
        version: ONBOARDING_STEPS.length + 1,
        steps: ONBOARDING_STEPS.map((step) => ({ step, completed: true })),
      },
    },
    campaigns: createCampaigns(today),
    points: {
      balance: 152000,
      reservedPoint: 20000,
    },
    uploads: {},
    latestLogoUploadId: null,
    nextId: 1000,
  };
};

// 회원가입으로 막 만든 점주. 입점 신청 전이라 가게 값이 비어 있고 캠페인 · 포인트도 없다.
// 같은 탭의 시연 데이터를 이 값으로 바꾸고, 로그아웃하면 다시 createSeed로 돌아간다
export const createOnboardingSeed = (email: string): MockDb => ({
  ...createSeed(),
  owner: {
    email,
    status: 'ONBOARDING',
    isLoggedIn: false,
    tutorialViewed: false,
  },
  store: {
    storeId: null,
    name: null,
    businessCategory: null,
    representativeName: null,
    businessRegistrationNumber: null,
    phone: null,
    kakaoPlaceId: null,
    roadAddress: null,
    latitude: null,
    longitude: null,
    businessHours: [],
    logoImage: null,
    interiorImages: [],
    menus: [],
    onboarding: {
      resumeStep: 'TERMS',
      version: 0,
      steps: ONBOARDING_STEPS.map((step) => ({ step, completed: false })),
    },
  },
  campaigns: [],
  points: { balance: 0, reservedPoint: 0 },
});
