import type { Campaign } from '@owner/api/campaign';

import { mockStore } from './store';

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

// 오늘 기준 며칠 뒤(음수면 며칠 전) 날짜. 언제 열어도 캠페인 상태와 집행 기간이 어긋나지 않게 한다
export const daysFromToday = (days: number) => {
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

// 다음 캠페인(준비 중 1건)으로 목록에 넣을 캠페인. 바꾸면 캠페인 탭과 홈에서 상태별 화면을 확인할 수 있다
type MockNextCampaign = 'SCHEDULED' | 'REVIEW_FAILED' | 'DRAFT' | 'NONE';

const MOCK_NEXT_CAMPAIGN: MockNextCampaign = 'SCHEDULED';

// 준비 중 캠페인은 가게당 1건이라(MAX_UPCOMING_CAMPAIGNS) 상태마다 하나씩 두고 그중 하나만 목록에 넣는다
const mockNextCampaigns: Record<Exclude<MockNextCampaign, 'NONE'>, Campaign> = {
  SCHEDULED: {
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
  REVIEW_FAILED: {
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
  DRAFT: {
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
    },
    poster: null,
    target: { radius: 1000, gender: 'ALL', ageGroups: [] },
    budget: { dailyBudget: null, startDate: '', endDate: '' },
    performance: null,
  },
};

const getMockNextCampaigns = (kind: MockNextCampaign) =>
  kind === 'NONE' ? [] : [mockNextCampaigns[kind]];

// 지난 캠페인 전체 목록의 무한 스크롤을 확인하기 위한 오래된 지난 캠페인.
// 아래 mockCampaigns의 지난 캠페인 4건보다 앞선 기간으로, 쿠폰 조건과 성과를 조금씩 바꿔 41건을 만든다
const ARCHIVED_CAMPAIGN_COUNT = 41;

const archivedCoupons: {
  menu: (typeof mockStore.menus)[number] | null;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
}[] = [
  { menu: null, discountType: 'PERCENT', discountValue: 10 },
  { menu: cheeseKatsu, discountType: 'PERCENT', discountValue: 20 },
  { menu: null, discountType: 'AMOUNT', discountValue: 1000 },
  { menu: rosuKatsu, discountType: 'AMOUNT', discountValue: 2000 },
  { menu: soba, discountType: 'PERCENT', discountValue: 15 },
];

const archivedEventNames = [
  '점심 한정 특가',
  '이번 주 점심 할인',
  '직장인 점심 응원',
  '든든한 점심 한 끼',
];

const archivedTemplateIds = [
  'template-orange-modern',
  'template-retro-pop',
  'template-classic-wood',
];

const createArchivedCampaign = (index: number): Campaign => {
  const coupon = archivedCoupons[index % archivedCoupons.length];
  const target = coupon.menu?.name ?? '전 메뉴';
  const value =
    coupon.discountType === 'PERCENT'
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue.toLocaleString('ko-KR')}원`;
  // 9일 간격으로 7일씩 집행한다. 5건마다 앞 캠페인과 종료일을 같게 두어 같은 종료일의 정렬(ID순)을 확인한다
  const endDaysAgo = 80 + (index - Math.floor(index / 5)) * 9;
  const issuedCount = 60 + ((index * 37) % 90);
  const dailyBudget = 5000 + (index % 4) * 1000;
  const number = String(index + 1).padStart(2, '0');

  return {
    id: `campaign-archived-${number}`,
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(endDaysAgo + 9),
    reviewFailReasons: [],
    coupon: {
      discountTarget: coupon.menu ? 'MENU' : 'ALL',
      menuId: coupon.menu?.id ?? null,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      issueLimit: 30 + (index % 3) * 10,
      usableFrom: '11:30',
      usableUntil: '14:00',
    },
    poster: {
      posterId: `poster-archived-${number}`,
      templateId: archivedTemplateIds[index % archivedTemplateIds.length],
      slots: {
        eventName: archivedEventNames[index % archivedEventNames.length],
        discountText: `${target} ${value} 할인`,
        period: '11:30 ~ 14:00',
        storeName: mockStore.name,
        imageUrl: (coupon.menu ?? cheeseKatsu).imageUrl,
      },
    },
    target: { radius: 1000, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget,
      startDate: daysFromToday(-endDaysAgo - 6),
      endDate: daysFromToday(-endDaysAgo),
    },
    performance: {
      today: null,
      total: {
        savedCount: issuedCount * 2,
        issuedCount,
        redeemedCount: Math.round(issuedCount * 0.6),
        spentPoints: dailyBudget * 6,
      },
    },
  };
};

// 점주 계정 하나의 캠페인 목록이라고 가정한다. 가게당 ACTIVE(또는 PAUSED) 캠페인은 1건만 있을 수 있다.
// 중단 상태 화면을 확인하려면 첫 캠페인의 status를 PAUSED로, pausedReason을 OWNER, NO_POINTS, ADMIN 중 하나로 바꾼다
// 다음 캠페인(시작 대기, 검수 실패, 작성 중, 없음)은 위의 MOCK_NEXT_CAMPAIGN으로 고른다
// 지난 캠페인은 캠페인 탭의 미리보기 개수(2건)보다 많게 두어 "전체 보기"를 확인할 수 있게 하고,
// 오래된 지난 캠페인을 더해 전체 목록의 무한 스크롤(20건씩)을 확인할 수 있게 45건을 둔다
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
  ...getMockNextCampaigns(MOCK_NEXT_CAMPAIGN),
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
  {
    id: 'campaign-ended-3',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(58),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'MENU',
      menuId: soba.id,
      discountType: 'AMOUNT',
      discountValue: 2000,
      issueLimit: 40,
      usableFrom: '11:30',
      usableUntil: '14:00',
    },
    poster: {
      posterId: 'poster-ended-3',
      templateId: 'template-classic-wood',
      slots: {
        eventName: '여름 한정 시원한 점심',
        discountText: `${soba.name} 2,000원 할인`,
        period: '11:30 ~ 14:00',
        storeName: mockStore.name,
        imageUrl: soba.imageUrl,
      },
    },
    target: {
      radius: 1000,
      gender: 'ALL',
      ageGroups: ['TWENTIES', 'THIRTIES'],
    },
    budget: {
      dailyBudget: 7000,
      startDate: daysFromToday(-56),
      endDate: daysFromToday(-50),
    },
    performance: {
      today: null,
      total: {
        savedCount: 260,
        issuedCount: 180,
        redeemedCount: 131,
        spentPoints: 44800,
      },
    },
  },
  {
    id: 'campaign-ended-4',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(79),
    reviewFailReasons: [],
    coupon: {
      discountTarget: 'MENU',
      menuId: cheeseKatsu.id,
      discountType: 'PERCENT',
      discountValue: 25,
      issueLimit: 30,
      usableFrom: '11:30',
      usableUntil: '15:00',
    },
    poster: {
      posterId: 'poster-ended-4',
      templateId: 'template-retro-pop',
      slots: {
        eventName: '첫 캠페인 기념',
        discountText: `${cheeseKatsu.name} 25% 할인`,
        period: '11:30 ~ 15:00',
        storeName: mockStore.name,
        imageUrl: cheeseKatsu.imageUrl,
      },
    },
    target: { radius: 500, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget: 6000,
      startDate: daysFromToday(-77),
      endDate: daysFromToday(-71),
    },
    performance: {
      today: null,
      total: {
        savedCount: 150,
        issuedCount: 98,
        redeemedCount: 52,
        spentPoints: 27300,
      },
    },
  },
  ...Array.from({ length: ARCHIVED_CAMPAIGN_COUNT }, (_, index) =>
    createArchivedCampaign(index),
  ),
];

// 이어서 불러오기 실패를 확인하려면 true로 바꾼다. 지난 캠페인 전체 목록의 다음 구간마다 첫 요청이 한 번 실패한다
export const MOCK_ENDED_NEXT_PAGE_FAILS_ONCE = false;
