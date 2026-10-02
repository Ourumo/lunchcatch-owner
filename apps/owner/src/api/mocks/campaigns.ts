import type {
  AgeGroup,
  Campaign,
  ExposureRadius,
  TargetGender,
} from '@owner/api/campaign';

import { mockStore } from './store';

// 운영의 플랫폼 설정값. 노출 1회당 차감 포인트는 아직 정해지지 않아 임시 값을 쓴다
export const mockPlatformSettings = {
  impressionUnitPrice: 10,
  minDailyBudget: 5000,
  bootstrapDailyBudget: 10000,
};

// 하루 예산 추천에 쓰는 반경별 최근 7일 점심 접속 사용자 수와 성별, 연령대 비율
export const mockAudienceRules: {
  usersByRadius: Record<ExposureRadius, number>;
  competingByRadius: Record<ExposureRadius, number>;
  genderRatio: Record<TargetGender, number>;
  ageRatio: Record<AgeGroup, number>;
} = {
  usersByRadius: { 500: 320, 1000: 1100, 2000: 3400, 3000: 6800 },
  competingByRadius: { 500: 2, 1000: 5, 2000: 11, 3000: 18 },
  genderRatio: { ALL: 1, MALE: 0.55, FEMALE: 0.45 },
  ageRatio: { TWENTIES: 0.32, THIRTIES: 0.38, FORTIES: 0.2, FIFTIES_PLUS: 0.1 },
};

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

// 오늘 기준 며칠 뒤(음수면 며칠 전) 날짜. 언제 열어도 캠페인 상태와 집행 기간이 어긋나지 않게 한다
const daysFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return toDateValue(date);
};

const createdDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString();
};

const [cheeseKatsu, rosuKatsu, soba] = mockStore.menus;

// 점주 계정 하나의 캠페인 목록이라고 가정한다. 가게당 ACTIVE(또는 PAUSED) 캠페인은 1건만 있을 수 있다.
// 중단 상태 화면을 확인하려면 첫 캠페인의 status를 PAUSED로, pausedReason을 OWNER, NO_POINTS, ADMIN 중 하나로 바꾼다
export const mockCampaigns: Campaign[] = [
  {
    id: 'campaign-active',
    status: 'ACTIVE',
    pausedReason: null,
    createdAt: createdDaysAgo(5),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'ALL',
      menuId: null,
      discountType: 'PERCENT',
      discountValue: 20,
      issueLimit: 50,
      usableFrom: '11:30',
      usableUntil: '15:00',
      minOrderAmount: null,
      notice: '1인 1매, 다른 쿠폰과 함께 쓸 수 없어요.',
    },
    poster: {
      posterId: 'poster-active',
      templateId: 'template-orange-modern',
      slots: {
        eventName: '오늘 점심 한정 특별 혜택!',
        discountText: '전 메뉴 20% 할인',
        period: '11:30 ~ 15:00',
        storeName: mockStore.name,
        imageUrl: cheeseKatsu.imageUrl,
      },
    },
    target: {
      radius: 1000,
      gender: 'ALL',
      ageGroups: ['THIRTIES', 'FORTIES'],
    },
    budget: {
      dailyBudget: 10000,
      startDate: daysFromToday(-3),
      endDate: daysFromToday(4),
    },
    performance: {
      today: {
        issuedCount: 24,
        redeemedCount: 12,
        reservedPoints: 10000,
        spentPoints: 2800,
      },
      total: {
        savedCount: 312,
        issuedCount: 158,
        redeemedCount: 96,
        spentPoints: 31200,
      },
    },
  },
  {
    id: 'campaign-scheduled',
    status: 'SCHEDULED',
    pausedReason: null,
    createdAt: createdDaysAgo(1),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'MENU',
      menuId: cheeseKatsu.id,
      discountType: 'AMOUNT',
      discountValue: 3000,
      issueLimit: 30,
      usableFrom: '11:30',
      usableUntil: '14:00',
      minOrderAmount: 10000,
      notice: '',
    },
    poster: {
      posterId: 'poster-scheduled',
      templateId: 'template-retro-pop',
      slots: {
        eventName: '치즈가 쭉 늘어나는 점심',
        discountText: `${cheeseKatsu.name} 3,000원 할인`,
        period: '11:30 ~ 14:00',
        storeName: mockStore.name,
        imageUrl: cheeseKatsu.imageUrl,
      },
    },
    target: { radius: 500, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget: 8000,
      startDate: daysFromToday(5),
      endDate: daysFromToday(11),
    },
    performance: null,
  },
  {
    id: 'campaign-review-failed',
    status: 'DRAFT',
    pausedReason: null,
    createdAt: createdDaysAgo(1),
    reviewFailReasons: [
      '포스터 문구에 금지 표현 "최고"가 들어 있어요.',
      '이미지 속 글자가 차지하는 비율이 기준보다 높아요.',
    ],
    coupon: {
      discountTarget: 'MENU',
      menuId: soba.id,
      discountType: 'PERCENT',
      discountValue: 15,
      issueLimit: 40,
      usableFrom: '12:00',
      usableUntil: '14:30',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-review-failed',
      templateId: 'template-classic-wood',
      slots: {
        eventName: '여름 최고의 한 그릇',
        discountText: `${soba.name} 15% 할인`,
        period: '12:00 ~ 14:30',
        storeName: mockStore.name,
        imageUrl: soba.imageUrl,
      },
    },
    target: { radius: 2000, gender: 'FEMALE', ageGroups: ['TWENTIES'] },
    budget: {
      dailyBudget: 6000,
      startDate: daysFromToday(2),
      endDate: daysFromToday(6),
    },
    performance: null,
  },
  {
    // 쿠폰 조건만 일부 채우고 나간 캠페인. 이어서 작성할 때 확인한다
    id: 'campaign-draft',
    status: 'DRAFT',
    pausedReason: null,
    createdAt: createdDaysAgo(0),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'ALL',
      menuId: null,
      discountType: 'PERCENT',
      discountValue: 10,
      issueLimit: null,
      usableFrom: '11:30',
      usableUntil: '15:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: null,
    target: { radius: 1000, gender: 'ALL', ageGroups: [] },
    budget: { dailyBudget: null, startDate: '', endDate: '' },
    performance: null,
  },
  {
    id: 'campaign-ended-1',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(22),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'ALL',
      menuId: null,
      discountType: 'PERCENT',
      discountValue: 30,
      issueLimit: 50,
      usableFrom: '11:30',
      usableUntil: '15:00',
      minOrderAmount: 12000,
      notice: '',
    },
    poster: {
      posterId: 'poster-ended-1',
      templateId: 'template-orange-modern',
      slots: {
        eventName: '오픈 기념 점심 할인',
        discountText: '전 메뉴 30% 할인',
        period: '11:30 ~ 15:00',
        storeName: mockStore.name,
        imageUrl: rosuKatsu.imageUrl,
      },
    },
    target: { radius: 1000, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget: 12000,
      startDate: daysFromToday(-20),
      endDate: daysFromToday(-14),
    },
    performance: {
      today: null,
      total: {
        savedCount: 420,
        issuedCount: 290,
        redeemedCount: 201,
        spentPoints: 70400,
      },
    },
  },
  {
    id: 'campaign-ended-2',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(37),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'MENU',
      menuId: rosuKatsu.id,
      discountType: 'PERCENT',
      discountValue: 40,
      issueLimit: 50,
      usableFrom: '11:30',
      usableUntil: '13:30',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-ended-2',
      templateId: 'template-retro-pop',
      slots: {
        eventName: '메뉴 한정 특가',
        discountText: `${rosuKatsu.name} 40% 할인`,
        period: '11:30 ~ 13:30',
        storeName: mockStore.name,
        imageUrl: rosuKatsu.imageUrl,
      },
    },
    target: { radius: 500, gender: 'MALE', ageGroups: ['THIRTIES'] },
    budget: {
      dailyBudget: 5000,
      startDate: daysFromToday(-35),
      endDate: daysFromToday(-29),
    },
    performance: {
      today: null,
      total: {
        savedCount: 188,
        issuedCount: 125,
        redeemedCount: 69,
        spentPoints: 33100,
      },
    },
  },
];
