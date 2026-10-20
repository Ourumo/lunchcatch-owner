import { ApiError, request } from './client';
import { mockCampaigns } from './mocks/campaigns';
import { mockDelay } from './mocks/delay';
import { mockPlatformSettings } from './mocks/platform';
import type { PlatformSettings } from './platform';
import { type CampaignPoster, isPosterComplete } from './poster';
import type { ApiResult } from './types';

// 점주 캠페인 등록과 조회 (docs/requirements-owner.md "캠페인 관리", docs/requirements-common.md "캠페인 상태")
// 목록과 상세 조회는 서버 API를 쓰고, 나머지는 API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export type CampaignStatus =
  'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED';

// ADMIN 관리자 중단, OWNER 점주 중단, NO_POINTS 그날 예약한 포인트가 노출 단가보다 적어 시스템이 중단
export type PausedReason = 'ADMIN' | 'OWNER' | 'NO_POINTS';

// 사용 가능 시간의 플랫폼 허용 범위(HH:mm). 공통 명세상 관리자 설정값이므로 연동하면 서버에서 받는다
export const USABLE_TIME_START = '11:30';
export const USABLE_TIME_END = '15:00';
export const USABLE_TIME_STEP_MINUTES = 30;
export const MIN_USABLE_MINUTES = 60;
// 선착순 오픈 시각. 플랫폼 고정이라 점주가 입력하지 않고 안내만 한다
export const ISSUE_OPEN_TIME = '11:00';
// 피드에 캠페인이 노출되는 서빙 시간대. 노출 대상의 시간대는 점심으로 고정이라 고르지 않는다
export const SERVING_TIME_START = '10:00';
export const SERVING_TIME_END = '12:59';

export type DiscountTarget = 'ALL' | 'MENU';
export type DiscountType = 'PERCENT' | 'AMOUNT';

// 등록 1단계 쿠폰 조건.
// DRAFT는 일부만 채운 채 저장되므로 아직 입력하지 않은 숫자는 null로 둔다
export interface CouponStepValues {
  discountTarget: DiscountTarget;
  // 할인 대상이 특정 메뉴(MENU)일 때 고른 대표 메뉴
  menuId: string | null;
  discountType: DiscountType;
  // 퍼센트 할인이면 %, 금액 할인이면 원
  discountValue: number | null;
  // 하루 선착순 발급 수량. 수량은 매일 00:00에 초기화된다
  issueLimit: number | null;
  // HH:mm, 30분 단위
  usableFrom: string;
  usableUntil: string;
}

// 반경 단위는 m
export type ExposureRadius = 500 | 1000 | 2000 | 3000;
export type TargetGender = 'ALL' | 'MALE' | 'FEMALE';
export type AgeGroup = 'TWENTIES' | 'THIRTIES' | 'FORTIES' | 'FIFTIES_PLUS';

// 등록 3단계 노출 대상. 시간대는 점심 고정이라 고르지 않는다
export interface TargetStepValues {
  radius: ExposureRadius;
  gender: TargetGender;
  // 비어 있으면 전체 연령대. 전체를 어떻게 보낼지는 API 연동 때 백엔드와 맞춘다
  ageGroups: AgeGroup[];
}

// 선택지에 이 순서대로 보여준다
export const exposureRadiusOptions: { value: ExposureRadius; label: string }[] =
  [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 3000, label: '3km' },
  ];

export const targetGenderOptions: { value: TargetGender; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
];

export const ageGroupOptions: { value: AgeGroup; label: string }[] = [
  { value: 'TWENTIES', label: '20대' },
  { value: 'THIRTIES', label: '30대' },
  { value: 'FORTIES', label: '40대' },
  { value: 'FIFTIES_PLUS', label: '50대 이상' },
];

// 등록 4단계 하루 예산과 집행 기간.
// 날짜는 YYYY-MM-DD이고, 고르지 않았으면 빈 문자열이다(DateRangePicker 값과 같은 형태)
export interface BudgetStepValues {
  // 포인트 (1원 = 1포인트)
  dailyBudget: number | null;
  startDate: string;
  endDate: string;
}

// 등록 단계별 입력값. 등록 화면은 이 값을 단계마다 저장하고, 상세 화면은 같은 값을 보여준다
export interface CampaignValues {
  coupon: CouponStepValues;
  // 등록 2단계. 포스터를 만들기 전에는 null
  poster: CampaignPoster | null;
  target: TargetStepValues;
  budget: BudgetStepValues;
}

export type CampaignStepKey = keyof CampaignValues;

export interface CampaignTodayPerformance {
  issuedCount: number;
  redeemedCount: number;
  // 그날 적용 하루 예산(00:00 예약액). 잔액이 모자라면 설정한 하루 예산보다 적다
  reservedPoints: number;
  spentPoints: number;
}

export interface CampaignTotalPerformance {
  savedCount: number;
  issuedCount: number;
  redeemedCount: number;
  spentPoints: number;
}

export interface CampaignPerformance {
  // 오늘 집행 대상이 아니면 null
  today: CampaignTodayPerformance | null;
  // 집행 시작일부터 누적
  total: CampaignTotalPerformance;
}

export interface Campaign extends CampaignValues {
  id: string;
  status: CampaignStatus;
  // PAUSED일 때만 값이 있다
  pausedReason: PausedReason | null;
  // ISO 8601
  createdAt: string;
  // 마지막 자동 검수가 FAIL이면 그 사유. 통과했거나 검수 전이면 빈 배열
  reviewFailReasons: string[];
  // 한 번도 집행되지 않은 DRAFT, SCHEDULED는 null
  performance: CampaignPerformance | null;
}

// 준비 중(작성 중 + 시작 대기) 캠페인은 가게당 1건만 둔다.
// 새 캠페인이 진행 중이 되면 기존 진행 중 캠페인은 종료되고(docs/requirements-common.md "캠페인 상태 정의"),
// 집행 기간은 활성화 뒤에 바꿀 수 없어 준비 중인 캠페인끼리 날짜가 겹치면 앞 캠페인이 예고 없이 일찍 끝난다.
// 그래서 "지금 1개 + 다음 1개"로 둔다. 명세에 없는 정책이라 서버 검증과 함께 확인이 필요하다
export const MAX_UPCOMING_CAMPAIGNS = 1;

// 준비 중 캠페인 제한으로 새 캠페인을 만들지 못했을 때의 실패 구분 값. 다시 시도해도 같은 결과라 화면이 다르게 안내한다
export const UPCOMING_LIMIT_ERROR = 'UPCOMING_LIMIT';

export const isUpcomingCampaign = ({ status }: Pick<Campaign, 'status'>) =>
  status === 'DRAFT' || status === 'SCHEDULED';

// 지금 집행 중인 캠페인(진행 중 또는 중단). 가게당 1건이고, 다음 캠페인이 시작되는 날 종료된다
export const isCurrentCampaign = ({ status }: Pick<Campaign, 'status'>) =>
  status === 'ACTIVE' || status === 'PAUSED';

// 새 캠페인의 시작일이 진행 중 캠페인의 종료일과 같거나 그보다 앞이면, 진행 중 캠페인은 그 시작일에 일찍 종료된다.
// 날짜는 YYYY-MM-DD라 문자열로 비교한다. 시작일을 고르기 전이면 겹치지 않는 것으로 본다
export const endsCurrentCampaignEarly = (
  startDate: string,
  currentCampaign: Pick<Campaign, 'budget'>,
) => Boolean(startDate) && startDate <= currentCampaign.budget.endDate;

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// 사용 가능 시간으로 고를 수 있는 시각. 허용 범위 안의 30분 단위 (11:30, 12:00, ... 15:00)
export const getUsableTimeSlots = () => {
  const slots: string[] = [];

  for (
    let minutes = toMinutes(USABLE_TIME_START);
    minutes <= toMinutes(USABLE_TIME_END);
    minutes += USABLE_TIME_STEP_MINUTES
  ) {
    slots.push(toTime(minutes));
  }

  return slots;
};

export const getUsableMinutes = (from: string, until: string) =>
  toMinutes(until) - toMinutes(from);

// 허용 범위 안의 30분 단위 연속 구간 1개이고, 최소 1시간이어야 한다
export const isValidUsableTime = (from: string, until: string) => {
  const slots = getUsableTimeSlots();

  return (
    slots.includes(from) &&
    slots.includes(until) &&
    getUsableMinutes(from, until) >= MIN_USABLE_MINUTES
  );
};

// 전체 메뉴는 금액 할인만 쓸 수 있다. 전체 메뉴 퍼센트 할인은 주문 금액 없이 할인 금액을 정할 수 없어 막는다.
// 서버도 이 조합을 거절하지만, 예전에 저장된 DRAFT에 남아 있을 수 있어 화면에서도 막는다
export const isAllowedDiscount = ({
  discountTarget,
  discountType,
}: Pick<CouponStepValues, 'discountTarget' | 'discountType'>) =>
  discountTarget === 'MENU' || discountType === 'AMOUNT';

// 퍼센트 할인은 1~100%, 금액 할인은 1원 이상의 정수
export const isValidDiscountValue = ({
  discountType,
  discountValue,
}: Pick<CouponStepValues, 'discountType' | 'discountValue'>) =>
  discountValue !== null &&
  Number.isInteger(discountValue) &&
  discountValue >= 1 &&
  (discountType === 'AMOUNT' || discountValue <= 100);

export const isValidIssueLimit = (issueLimit: number | null) =>
  issueLimit !== null && Number.isInteger(issueLimit) && issueLimit >= 1;

// 쿠폰 조건 필수 항목별 입력 완료 여부 (할인 대상, 할인 값, 발급 수량, 사용 가능 시간).
// 할인 대상과 할인 유형의 조합 검사는 할인 대상 항목에 합친다
export const getCouponRequiredChecks = (coupon: CouponStepValues) => [
  isAllowedDiscount(coupon) &&
    (coupon.discountTarget === 'ALL' || coupon.menuId !== null),
  isValidDiscountValue(coupon),
  isValidIssueLimit(coupon.issueLimit),
  isValidUsableTime(coupon.usableFrom, coupon.usableUntil),
];

export const isCouponStepComplete = (coupon: CouponStepValues) =>
  getCouponRequiredChecks(coupon).every(Boolean);

// 반경, 성별, 연령대가 모두 정해진 선택지 안에 있어야 한다
export const isValidTarget = ({
  ageGroups,
  gender,
  radius,
}: TargetStepValues) =>
  exposureRadiusOptions.some(({ value }) => value === radius) &&
  targetGenderOptions.some(({ value }) => value === gender) &&
  ageGroups.every((ageGroup) =>
    ageGroupOptions.some(({ value }) => value === ageGroup),
  );

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// 오늘 기준 며칠 뒤 날짜(YYYY-MM-DD). 집행 시작일은 등록일 다음 날부터 고를 수 있다
export const getDateValueFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return toDateValue(date);
};

export const isValidDailyBudget = (
  dailyBudget: number | null,
  { minDailyBudget }: Pick<PlatformSettings, 'minDailyBudget'>,
) =>
  dailyBudget !== null &&
  Number.isInteger(dailyBudget) &&
  dailyBudget >= minDailyBudget;

// 시작일은 내일 이후, 종료일은 시작일 이후(시작일과 같으면 1일)
export const isValidPeriod = ({
  endDate,
  startDate,
}: Pick<BudgetStepValues, 'endDate' | 'startDate'>) =>
  Boolean(startDate && endDate) &&
  startDate >= getDateValueFromToday(1) &&
  endDate >= startDate;

// 하루 예산과 집행 기간 필수 항목별 입력 완료 여부.
// 잔액 부족은 저장을 막지 않으므로 검사하지 않는다
export const getBudgetRequiredChecks = (
  budget: BudgetStepValues,
  settings: Pick<PlatformSettings, 'minDailyBudget'>,
) => [isValidDailyBudget(budget.dailyBudget, settings), isValidPeriod(budget)];

export const isBudgetStepComplete = (
  budget: BudgetStepValues,
  settings: Pick<PlatformSettings, 'minDailyBudget'>,
) => getBudgetRequiredChecks(budget, settings).every(Boolean);

const NOT_FOUND_MESSAGE = '캠페인을 찾을 수 없습니다.';
const NOT_EDITABLE_MESSAGE = '작성 중인 캠페인만 수정할 수 있습니다.';
const INVALID_COUPON_MESSAGE = '쿠폰 조건을 다시 확인해 주세요.';
const INVALID_TARGET_MESSAGE = '노출 대상을 다시 확인해 주세요.';
const INVALID_BUDGET_MESSAGE = '하루 예산과 집행 기간을 다시 확인해 주세요.';
const INVALID_POSTER_MESSAGE = '포스터 내용을 다시 확인해 주세요.';
const NOT_DELETABLE_MESSAGE = '작성 중인 캠페인만 삭제할 수 있습니다.';
const NOT_CANCELABLE_MESSAGE = '시작 대기 중인 캠페인만 취소할 수 있습니다.';
const UPCOMING_LIMIT_MESSAGE =
  '다음 캠페인은 1개만 준비할 수 있습니다. 작성 중이거나 시작 대기인 캠페인을 정리한 뒤 만들어 주세요.';

// 새 캠페인의 기본값. 할인은 전체 메뉴 금액 할인, 사용 가능 시간은 허용 범위 전체, 노출 대상은 1km, 전체 성별, 전체 연령대
export const createInitialCampaignValues = (): CampaignValues => ({
  coupon: {
    discountTarget: 'ALL',
    menuId: null,
    discountType: 'AMOUNT',
    discountValue: null,
    issueLimit: null,
    usableFrom: USABLE_TIME_START,
    usableUntil: USABLE_TIME_END,
  },
  poster: null,
  target: { radius: 1000, gender: 'ALL', ageGroups: [] },
  budget: { dailyBudget: null, startDate: '', endDate: '' },
});

const findCampaign = (id: string) =>
  mockCampaigns.find((campaign) => campaign.id === id);

// 점주 본인 가게의 캠페인만 내려온다. 등록 시각 최신순
interface CampaignListItemResponse {
  campaignId: number;
  status: CampaignStatus;
  discountTargetType: DiscountTarget;
  discountType: DiscountType;
  discountValue: number;
  dailyBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

interface CampaignListResponse {
  items: CampaignListItemResponse[];
  // 마지막 페이지면 null
  nextPageToken: string | null;
}

// 서버 목록 한 번에 받는 최대 개수
const CAMPAIGN_LIST_PAGE_SIZE = 100;

const fetchCampaignDetail = async (id: string) =>
  toCampaign(
    await request<CampaignDetailResponse>(
      `/v1/owner/campaigns/${encodeURIComponent(id)}`,
    ),
  );

// 목록 항목에는 중단 사유, 할인 메뉴, 발급 수량, 사용 가능 시간, 노출 대상이 없다.
// 이 값을 보여주는 진행 중·다음 캠페인은 상세로 다시 채우고, 지난 캠페인은 제목·기간·상태만 쓰므로 비워 둔다
const toListedCampaign = (item: CampaignListItemResponse): Campaign => ({
  id: String(item.campaignId),
  status: item.status,
  pausedReason: null,
  createdAt: item.createdAt,
  reviewFailReasons: [],
  performance: null,
  poster: null,
  coupon: {
    discountTarget: item.discountTargetType,
    menuId: null,
    discountType: item.discountType,
    discountValue: item.discountValue,
    issueLimit: null,
    usableFrom: '',
    usableUntil: '',
  },
  target: createInitialCampaignValues().target,
  budget: {
    dailyBudget: item.dailyBudget,
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
  },
});

// 최근 생성 순. 가게당 진행 중·다음 캠페인은 가장 최근에 만든 캠페인이라 첫 페이지에 들어 있다
export const getCampaigns = async (): Promise<ApiResult<Campaign[]>> => {
  try {
    const { items } = await request<CampaignListResponse>(
      `/v1/owner/campaigns?pageSize=${CAMPAIGN_LIST_PAGE_SIZE}`,
    );
    const campaigns = await Promise.all(
      items.map((item) =>
        item.status === 'ENDED'
          ? toListedCampaign(item)
          : fetchCampaignDetail(String(item.campaignId)),
      ),
    );

    return { ok: true, data: campaigns };
  } catch {
    return { ok: false };
  }
};

// 지난 캠페인 전체 목록을 나눠 받는 한 구간
export interface EndedCampaignPage {
  campaigns: Campaign[];
  // 다음 구간을 받을 때 넘기는 값. 마지막 구간이면 null
  nextCursor: string | null;
}

export const ENDED_CAMPAIGN_PAGE_SIZE = 20;

const ENDED_PAGE_FAILED_MESSAGE = '지난 캠페인을 불러오지 못했습니다.';

// 지난 캠페인 전체 목록을 커서 방식으로 나눠 받는다. 처음엔 커서 없이 부르고, 응답의 nextCursor로 다음 구간을 받는다.
// 서버 목록은 상태 필터 없이 최근 생성 순이라 종료된 캠페인만 남긴다. 한 구간에 종료된 캠페인이 없으면
// 빈 구간을 돌려주지 않도록 다음 구간을 이어서 받는다
export const getEndedCampaignPage = async ({
  cursor = null,
  limit = ENDED_CAMPAIGN_PAGE_SIZE,
}: {
  cursor?: string | null;
  limit?: number;
} = {}): Promise<ApiResult<EndedCampaignPage>> => {
  try {
    const campaigns: Campaign[] = [];
    let nextCursor = cursor;

    do {
      const params = new URLSearchParams({ pageSize: String(limit) });

      if (nextCursor) {
        params.set('pageToken', nextCursor);
      }

      const data = await request<CampaignListResponse>(
        `/v1/owner/campaigns?${params}`,
      );

      campaigns.push(
        ...data.items
          .filter(({ status }) => status === 'ENDED')
          .map(toListedCampaign),
      );

      // 같은 토큰이 다시 오면 끝없이 같은 구간을 받게 되므로 실패로 본다
      if (data.nextPageToken && data.nextPageToken === nextCursor) {
        throw new Error('같은 pageToken이 반복됨');
      }

      nextCursor = data.nextPageToken;
    } while (campaigns.length === 0 && nextCursor);

    return { ok: true, data: { campaigns, nextCursor } };
  } catch {
    return { ok: false, message: ENDED_PAGE_FAILED_MESSAGE };
  }
};

// 등록 흐름(등록 화면, 활성화 완료 화면)이 쓰는 조회. 등록 시작과 저장이 아직 mock이라
// mock이 만든 캠페인을 찾을 수 있도록 mock으로 조회한다. 등록 API 연동(#181)에서 getCampaign으로 합친다
export const getRegistrationCampaign = async (
  id: string,
): Promise<ApiResult<Campaign>> => {
  await mockDelay();

  const campaign = findCampaign(id);

  if (!campaign) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  return { ok: true, data: structuredClone(campaign) };
};

interface CampaignDetailResponse {
  campaignId: number;
  status: CampaignStatus;
  pausedReason: PausedReason | null;
  discountTargetType: DiscountTarget;
  discountType: DiscountType;
  discountValue: number;
  targetMenuId: number | null;
  issueQuantity: number;
  // HH:mm:ss로 온다
  usableStartTime: string;
  usableEndTime: string;
  targetRadius: number;
  targetGender: TargetGender;
  targetAgeGroups: string[];
  // 아직 한 번도 설정하지 않았으면 null
  dailyBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

const serverAgeGroups: Record<string, AgeGroup> = {
  AGE_20S: 'TWENTIES',
  AGE_30S: 'THIRTIES',
  AGE_40S: 'FORTIES',
  AGE_50_PLUS: 'FIFTIES_PLUS',
};

// 서버는 전체 연령대를 네 값으로 보내고, 화면은 전체를 빈 배열로 둔다
const toAgeGroups = (ageGroups: string[]): AgeGroup[] => {
  const groups = ageGroups.flatMap((group) =>
    serverAgeGroups[group] ? [serverAgeGroups[group]] : [],
  );

  return groups.length === Object.keys(serverAgeGroups).length ? [] : groups;
};

// 상세 응답에는 포스터, 성과, 자동 검수 실패 사유가 없어 비워 둔다
const toCampaign = (data: CampaignDetailResponse): Campaign => ({
  id: String(data.campaignId),
  status: data.status,
  pausedReason: data.pausedReason,
  createdAt: data.createdAt,
  reviewFailReasons: [],
  performance: null,
  poster: null,
  coupon: {
    discountTarget: data.discountTargetType,
    menuId: data.targetMenuId === null ? null : String(data.targetMenuId),
    discountType: data.discountType,
    discountValue: data.discountValue,
    issueLimit: data.issueQuantity,
    usableFrom: data.usableStartTime.slice(0, 5),
    usableUntil: data.usableEndTime.slice(0, 5),
  },
  target: {
    radius: data.targetRadius as ExposureRadius,
    gender: data.targetGender,
    ageGroups: toAgeGroups(data.targetAgeGroups),
  },
  budget: {
    dailyBudget: data.dailyBudget,
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
  },
});

export const getCampaign = async (id: string): Promise<ApiResult<Campaign>> => {
  try {
    return { ok: true, data: await fetchCampaignDetail(id) };
  } catch (error) {
    // 없는 캠페인과 다른 점주의 캠페인을 서버가 같은 코드로 거절한다
    return error instanceof ApiError && error.code === 'CAMPAIGN-005'
      ? { ok: false, message: NOT_FOUND_MESSAGE }
      : { ok: false };
  }
};

// 등록을 시작하면 DRAFT를 먼저 만들고, 이후 단계는 이 캠페인 ID로 저장한다.
// 준비 중 캠페인이 이미 MAX_UPCOMING_CAMPAIGNS건이면 만들지 않는다
export const createCampaignDraft = async (): Promise<ApiResult<Campaign>> => {
  await mockDelay();

  if (
    mockCampaigns.filter(isUpcomingCampaign).length >= MAX_UPCOMING_CAMPAIGNS
  ) {
    return {
      ok: false,
      code: UPCOMING_LIMIT_ERROR,
      message: UPCOMING_LIMIT_MESSAGE,
    };
  }

  const campaign: Campaign = {
    ...createInitialCampaignValues(),
    id: `campaign-${Date.now()}`,
    status: 'DRAFT',
    pausedReason: null,
    createdAt: new Date().toISOString(),
    reviewFailReasons: [],
    performance: null,
  };

  // 메모리에만 추가한다. 새로고침하면 초기화된다
  mockCampaigns.push(campaign);

  return { ok: true, data: structuredClone(campaign) };
};

// 등록 단계 하나의 입력값을 DRAFT에 저장한다. 포스터는 연동할 때 포스터 생성/수정 API로 바꾼다
export const saveCampaignStep = async <TStepKey extends CampaignStepKey>(
  id: string,
  stepKey: TStepKey,
  values: CampaignValues[TStepKey],
): Promise<ApiResult<Campaign>> => {
  await mockDelay();

  const campaign = findCampaign(id);

  if (!campaign) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  if (campaign.status !== 'DRAFT') {
    return { ok: false, message: NOT_EDITABLE_MESSAGE };
  }

  // 서버도 전체 메뉴 퍼센트 할인, 할인율 100% 초과, 발급 수량 0 이하, 허용 범위 밖이거나 1시간 미만인 사용 시간은 저장하지 않는다
  if (
    stepKey === 'coupon' &&
    !isCouponStepComplete(values as CouponStepValues)
  ) {
    return { ok: false, message: INVALID_COUPON_MESSAGE };
  }

  if (stepKey === 'target' && !isValidTarget(values as TargetStepValues)) {
    return { ok: false, message: INVALID_TARGET_MESSAGE };
  }

  // 서버도 최소 하루 예산 미만, 내일 이전 시작일, 시작일보다 이른 종료일은 저장하지 않는다
  if (
    stepKey === 'budget' &&
    !isBudgetStepComplete(values as BudgetStepValues, mockPlatformSettings)
  ) {
    return { ok: false, message: INVALID_BUDGET_MESSAGE };
  }

  if (stepKey === 'poster') {
    const poster = values as CampaignPoster | null;

    // 템플릿과 할인 내용, 기간, 가게명이 없으면 포스터를 만들지 않는다
    if (!isPosterComplete(poster)) {
      return { ok: false, message: INVALID_POSTER_MESSAGE };
    }

    // 캠페인당 포스터는 1건이라, 이미 있으면 같은 포스터를 수정한 것으로 본다
    campaign.poster = {
      ...structuredClone(poster as CampaignPoster),
      posterId: campaign.poster?.posterId ?? `poster-${campaign.id}`,
    };

    return { ok: true, data: structuredClone(campaign) };
  }

  Object.assign(campaign, { [stepKey]: structuredClone(values) });

  return { ok: true, data: structuredClone(campaign) };
};

// 활성화 요청 결과. 자동 검수를 통과하면 SCHEDULED가 되고, 통과하지 못하면 DRAFT로 남고 사유를 돌려준다
export type ActivationResult =
  | { result: 'PASS'; campaign: Campaign }
  | { result: 'FAIL'; reasons: string[] };

// 관리자 "검수 기준 관리"의 금지 표현 사전을 흉내 낸 값. 연동하면 서버가 판정한다
const MOCK_FORBIDDEN_WORDS = ['최고', '1위', '최저가', '무료'];

const NOT_READY_MESSAGE =
  '아직 채우지 않은 단계가 있어 활성화를 요청할 수 없습니다.';

// 활성화 요청 시 (1) 포스터와 필수 입력값을 확인하고 (2) 포스터를 자동 검수한다.
// 잔액은 검사하지 않는다. 잔액이 모자라면 첫 서빙일 00:00 예약에서 PAUSED(NO_POINTS)가 된다
export const requestCampaignActivation = async (
  id: string,
): Promise<ApiResult<ActivationResult>> => {
  await mockDelay();

  const campaign = findCampaign(id);

  if (!campaign) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  if (campaign.status !== 'DRAFT') {
    return { ok: false, message: NOT_EDITABLE_MESSAGE };
  }

  if (
    !isCouponStepComplete(campaign.coupon) ||
    !isPosterComplete(campaign.poster) ||
    !isValidTarget(campaign.target) ||
    !isBudgetStepComplete(campaign.budget, mockPlatformSettings)
  ) {
    return { ok: false, message: NOT_READY_MESSAGE };
  }

  const { discountText, eventName, storeName } = (
    campaign.poster as CampaignPoster
  ).slots;
  const posterText = [discountText, eventName, storeName].join(' ');
  const reasons = MOCK_FORBIDDEN_WORDS.filter((word) =>
    posterText.includes(word),
  ).map((word) => `포스터 문구에 금지 표현 "${word}"가 들어 있어요.`);

  campaign.reviewFailReasons = reasons;

  if (reasons.length > 0) {
    return { ok: true, data: { result: 'FAIL', reasons } };
  }

  campaign.status = 'SCHEDULED';

  return {
    ok: true,
    data: { result: 'PASS', campaign: structuredClone(campaign) },
  };
};

// 작성 중(DRAFT) 캠페인 삭제. 다음 캠페인 자리를 비워 새 캠페인을 만들 수 있게 한다.
// 명세에 없는 기능이라 API 추가 요청이 필요하다
export const deleteCampaignDraft = async (
  id: string,
): Promise<ApiResult<null>> => {
  await mockDelay();

  const index = mockCampaigns.findIndex((campaign) => campaign.id === id);

  if (index === -1) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  if (mockCampaigns[index].status !== 'DRAFT') {
    return { ok: false, message: NOT_DELETABLE_MESSAGE };
  }

  mockCampaigns.splice(index, 1);

  return { ok: true, data: null };
};

// 시작 대기(SCHEDULED) 취소. 작성 중으로 되돌리고 입력값은 그대로 둔다
// (docs/requirements-common.md "캠페인 상태 정의"의 SCHEDULED 점주 액션 "취소(DRAFT로)").
// 다시 노출하려면 활성화를 다시 요청해야 하고, 시작일 전날 23:59까지 SCHEDULED여야 시작일부터 노출된다
export const cancelScheduledCampaign = async (
  id: string,
): Promise<ApiResult<Campaign>> => {
  await mockDelay();

  const campaign = findCampaign(id);

  if (!campaign) {
    return { ok: false, message: NOT_FOUND_MESSAGE };
  }

  if (campaign.status !== 'SCHEDULED') {
    return { ok: false, message: NOT_CANCELABLE_MESSAGE };
  }

  campaign.status = 'DRAFT';

  return { ok: true, data: structuredClone(campaign) };
};
