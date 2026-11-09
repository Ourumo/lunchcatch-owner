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

// 서버 가게 정보 (GET /v1/owner/store)
export interface MockStore {
  storeId: number;
  name: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
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
}

export const MOCK_DB_VERSION = 1;

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
      isLoggedIn: false,
      tutorialViewed: false,
    },
    store: {
      storeId: MOCK_STORE_ID,
      name: '런치캐치 시연 한식당',
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
    },
    campaigns: createCampaigns(today),
    points: {
      balance: 152000,
      reservedPoint: 20000,
    },
  };
};
