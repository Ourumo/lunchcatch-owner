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

// 현재 캠페인(끝나지 않은 캠페인 1건)으로 목록에 넣을 캠페인. 바꾸면 캠페인 탭과 홈에서 상태별 화면을 확인할 수 있다
type MockCurrentCampaign = 'ACTIVE' | 'SCHEDULED' | 'DRAFT' | 'NONE';

const MOCK_CURRENT_CAMPAIGN: MockCurrentCampaign = 'ACTIVE';

// 끝나지 않은 캠페인은 가게당 1건이라 상태마다 하나씩 두고 그중 하나만 목록에 넣는다.
// 일시중지 화면을 확인하려면 ACTIVE의 status를 PAUSED로, pausedReason을 OWNER, NO_POINTS, ADMIN 중 하나로 바꾼다
const mockCurrentCampaigns: Record<
  Exclude<MockCurrentCampaign, 'NONE'>,
  Campaign
> = {
  ACTIVE: {
    id: 'campaign-active',
    status: 'ACTIVE',
    pausedReason: null,
    createdAt: createdDaysAgo(5),
    coupon: {
      discountTarget: 'ALL',
      menuId: null,
      discountType: 'AMOUNT',
      discountValue: 2000,
      issueLimit: 50,
      usableFrom: '11:30',
      usableUntil: '15:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-active',
      templateId: 'template-orange-modern',
      imageObjectKey: null,
      imageUrl: cheeseKatsu.imageUrl,
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
  },
  SCHEDULED: {
    id: 'campaign-scheduled',
    status: 'SCHEDULED',
    pausedReason: null,
    createdAt: createdDaysAgo(1),
    coupon: {
      discountTarget: 'MENU',
      menuId: cheeseKatsu.id,
      discountType: 'AMOUNT',
      discountValue: 3000,
      issueLimit: 30,
      usableFrom: '11:30',
      usableUntil: '14:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-scheduled',
      templateId: 'template-retro-pop',
      imageObjectKey: null,
      imageUrl: cheeseKatsu.imageUrl,
    },
    target: { radius: 500, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget: 8000,
      startDate: daysFromToday(5),
      endDate: daysFromToday(11),
    },
  },
  DRAFT: {
    // 쿠폰 조건만 일부 채우고 나간 캠페인. 이어서 작성할 때 확인한다.
    // 지금은 막힌 전체 메뉴 퍼센트 할인으로 두어, 예전에 저장된 DRAFT가 1단계에서 막히는지도 확인한다
    id: 'campaign-draft',
    status: 'DRAFT',
    pausedReason: null,
    createdAt: createdDaysAgo(0),
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
  },
};

const getMockCurrentCampaigns = (kind: MockCurrentCampaign) =>
  kind === 'NONE' ? [] : [mockCurrentCampaigns[kind]];

// 지난 캠페인 전체 목록의 무한 스크롤을 확인하기 위한 오래된 지난 캠페인.
// 아래 mockCampaigns의 지난 캠페인 4건보다 앞선 기간으로, 쿠폰 조건과 성과를 조금씩 바꿔 41건을 만든다
const ARCHIVED_CAMPAIGN_COUNT = 41;

const archivedCoupons: {
  menu: (typeof mockStore.menus)[number] | null;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
}[] = [
  { menu: null, discountType: 'AMOUNT', discountValue: 1500 },
  { menu: cheeseKatsu, discountType: 'PERCENT', discountValue: 20 },
  { menu: null, discountType: 'AMOUNT', discountValue: 1000 },
  { menu: rosuKatsu, discountType: 'AMOUNT', discountValue: 2000 },
  { menu: soba, discountType: 'PERCENT', discountValue: 15 },
];

const archivedTemplateIds = [
  'template-orange-modern',
  'template-retro-pop',
  'template-classic-wood',
];

const createArchivedCampaign = (index: number): Campaign => {
  const coupon = archivedCoupons[index % archivedCoupons.length];
  // 9일 간격으로 7일씩 집행한다. 5건마다 앞 캠페인과 종료일을 같게 두어 같은 종료일의 정렬(ID순)을 확인한다
  const endDaysAgo = 80 + (index - Math.floor(index / 5)) * 9;
  const dailyBudget = 5000 + (index % 4) * 1000;
  const number = String(index + 1).padStart(2, '0');

  return {
    id: `campaign-archived-${number}`,
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(endDaysAgo + 9),
    coupon: {
      discountTarget: coupon.menu ? 'MENU' : 'ALL',
      menuId: coupon.menu?.id ?? null,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      issueLimit: 30 + (index % 3) * 10,
      usableFrom: '11:30',
      usableUntil: '14:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: `poster-archived-${number}`,
      templateId: archivedTemplateIds[index % archivedTemplateIds.length],
      imageObjectKey: null,
      imageUrl: (coupon.menu ?? cheeseKatsu).imageUrl,
    },
    target: { radius: 1000, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget,
      startDate: daysFromToday(-endDaysAgo - 6),
      endDate: daysFromToday(-endDaysAgo),
    },
  };
};

// 점주 계정 하나의 캠페인 목록이라고 가정한다. 끝나지 않은 캠페인은 1건만 있을 수 있다.
// 현재 캠페인(진행 중, 대기 중, 검수 실패, 작성 중, 없음)은 위의 MOCK_CURRENT_CAMPAIGN으로 고른다
// 지난 캠페인은 캠페인 탭의 미리보기 개수(2건)보다 많게 두어 "전체 보기"를 확인할 수 있게 하고,
// 오래된 지난 캠페인을 더해 전체 목록의 무한 스크롤(20건씩)을 확인할 수 있게 45건을 둔다
export const mockCampaigns: Campaign[] = [
  ...getMockCurrentCampaigns(MOCK_CURRENT_CAMPAIGN),
  {
    id: 'campaign-ended-1',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(22),
    coupon: {
      discountTarget: 'ALL',
      menuId: null,
      discountType: 'AMOUNT',
      discountValue: 3000,
      issueLimit: 50,
      usableFrom: '11:30',
      usableUntil: '15:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-ended-1',
      templateId: 'template-orange-modern',
      imageObjectKey: null,
      imageUrl: rosuKatsu.imageUrl,
    },
    target: { radius: 1000, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget: 12000,
      startDate: daysFromToday(-20),
      endDate: daysFromToday(-14),
    },
  },
  {
    id: 'campaign-ended-2',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(37),
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
      imageObjectKey: null,
      imageUrl: rosuKatsu.imageUrl,
    },
    target: { radius: 500, gender: 'MALE', ageGroups: ['THIRTIES'] },
    budget: {
      dailyBudget: 5000,
      startDate: daysFromToday(-35),
      endDate: daysFromToday(-29),
    },
  },
  {
    id: 'campaign-ended-3',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(58),
    coupon: {
      discountTarget: 'MENU',
      menuId: soba.id,
      discountType: 'AMOUNT',
      discountValue: 2000,
      issueLimit: 40,
      usableFrom: '11:30',
      usableUntil: '14:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-ended-3',
      templateId: 'template-classic-wood',
      imageObjectKey: null,
      imageUrl: soba.imageUrl,
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
  },
  {
    id: 'campaign-ended-4',
    status: 'ENDED',
    pausedReason: null,
    createdAt: createdDaysAgo(79),
    coupon: {
      discountTarget: 'MENU',
      menuId: cheeseKatsu.id,
      discountType: 'PERCENT',
      discountValue: 25,
      issueLimit: 30,
      usableFrom: '11:30',
      usableUntil: '15:00',
      minOrderAmount: null,
      notice: '',
    },
    poster: {
      posterId: 'poster-ended-4',
      templateId: 'template-retro-pop',
      imageObjectKey: null,
      imageUrl: cheeseKatsu.imageUrl,
    },
    target: { radius: 500, gender: 'ALL', ageGroups: [] },
    budget: {
      dailyBudget: 6000,
      startDate: daysFromToday(-77),
      endDate: daysFromToday(-71),
    },
  },
  ...Array.from({ length: ARCHIVED_CAMPAIGN_COUNT }, (_, index) =>
    createArchivedCampaign(index),
  ),
];
