import { ApiError, request } from './client';
import type { PlatformSettings } from './platform';
import { type CampaignPoster, isPosterComplete } from './poster';
import { getKstToday, splitPeriod } from './report';
import { getMyStore } from './store';
import type { ApiResult } from './types';

// 점주 캠페인 등록과 조회 (docs/requirements-owner.md "캠페인 관리", docs/requirements-common.md "캠페인 상태")
// 목록·상세 조회, 쿠폰 조건·포스터·노출 대상·하루 예산과 집행 기간 저장, 상태 변경(취소·중단·재개·종료)은 서버 API를 쓰고, 나머지는 API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

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
  // 선택 입력. 이 금액(원) 이상 주문해야 쿠폰을 쓸 수 있다. 입력하지 않으면 null
  minOrderAmount: number | null;
  // 선택 입력. NOTICE_MAX_LENGTH자 이하. 입력하지 않으면 빈 문자열
  notice: string;
}

export const NOTICE_MAX_LENGTH = 500;

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
}

// 지금 집행 중인 캠페인(진행 중 또는 일시중지). 실적이 쌓이는 캠페인이다
export const isCurrentCampaign = ({ status }: Pick<Campaign, 'status'>) =>
  status === 'ACTIVE' || status === 'PAUSED';

// 끝나지 않은 캠페인(작성 중, 대기 중, 진행 중, 일시중지). 가게당 1건만 있을 수 있다
export const isUnfinishedCampaign = ({ status }: Pick<Campaign, 'status'>) =>
  status !== 'ENDED';

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

// 시작일은 내일 이후, 종료일은 시작일 다음 날 이후(양 끝 포함 최소 2일).
// 서버가 시작일과 종료일이 같으면 422 CAMPAIGN-008로 거절한다
export const isValidPeriod = ({
  endDate,
  startDate,
}: Pick<BudgetStepValues, 'endDate' | 'startDate'>) =>
  Boolean(startDate && endDate) &&
  startDate >= getDateValueFromToday(1) &&
  endDate > startDate;

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
const NOT_ACTIVE_OWNER_MESSAGE =
  '입점을 마친 점주만 캠페인을 만들 수 있습니다.';
const POSTER_REQUIRED_MESSAGE = '포스터를 먼저 만들어 주세요.';
const NOT_ACTIVE_OWNER_ACTION_MESSAGE =
  '입점을 마친 점주만 캠페인을 관리할 수 있습니다.';
const CAMPAIGN_LIMIT_MESSAGE =
  '캠페인은 한 번에 하나만 운영할 수 있습니다. 지금 캠페인이 끝난 뒤에 새로 만들어 주세요.';

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
    minOrderAmount: null,
    notice: '',
  },
  poster: null,
  target: { radius: 1000, gender: 'ALL', ageGroups: [] },
  budget: { dailyBudget: null, startDate: '', endDate: '' },
});

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

// 포스터는 함께 받지 않는다. 포스터 조회가 실패해도 캠페인 목록과 상세는 보여줄 수 있게,
// 포스터가 필요한 화면(등록 화면의 이어서 작성, 캠페인 상세의 완성 포스터)이 따로 불러온다
const fetchCampaignDetail = async (id: string): Promise<Campaign> =>
  toCampaign(
    await request<CampaignDetailResponse>(
      `/v1/owner/campaigns/${encodeURIComponent(id)}`,
    ),
  );

// 목록 항목에는 중단 사유, 할인 메뉴, 발급 수량, 사용 가능 시간, 노출 대상이 없다.
// 이 값을 보여주는 현재 캠페인은 상세로 다시 채우고, 지난 캠페인은 제목·기간·상태만 쓰므로 비워 둔다
const toListedCampaign = (item: CampaignListItemResponse): Campaign => ({
  id: String(item.campaignId),
  status: item.status,
  pausedReason: null,
  createdAt: item.createdAt,
  poster: null,
  coupon: {
    discountTarget: item.discountTargetType,
    menuId: null,
    discountType: item.discountType,
    discountValue: item.discountValue,
    issueLimit: null,
    usableFrom: '',
    usableUntil: '',
    minOrderAmount: null,
    notice: '',
  },
  target: createInitialCampaignValues().target,
  budget: {
    dailyBudget: item.dailyBudget,
    startDate: item.startDate ?? '',
    endDate: item.endDate ?? '',
  },
});

// 최근 생성 순. 가게당 하나인 현재 캠페인은 가장 최근에 만든 캠페인이라 첫 페이지에 들어 있다
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
  // 입력하지 않았으면 null
  minOrderAmount: number | null;
  notice: string | null;
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

// 서버는 연령대를 1개 이상 받으므로, 화면의 전체(빈 배열)는 네 값으로 보낸다
const toServerAgeGroups = (ageGroups: AgeGroup[]) =>
  Object.entries(serverAgeGroups)
    .filter(([, group]) => ageGroups.length === 0 || ageGroups.includes(group))
    .map(([serverGroup]) => serverGroup);

// 상세 응답에는 포스터와 성과가 없어 비워 둔다. 포스터가 필요한 화면은 따로 불러온다
const toCampaign = (data: CampaignDetailResponse): Campaign => ({
  id: String(data.campaignId),
  status: data.status,
  pausedReason: data.pausedReason,
  createdAt: data.createdAt,
  poster: null,
  coupon: {
    discountTarget: data.discountTargetType,
    menuId: data.targetMenuId === null ? null : String(data.targetMenuId),
    discountType: data.discountType,
    discountValue: data.discountValue,
    issueLimit: data.issueQuantity,
    usableFrom: data.usableStartTime.slice(0, 5),
    usableUntil: data.usableEndTime.slice(0, 5),
    minOrderAmount: data.minOrderAmount,
    notice: data.notice ?? '',
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

// 없는 캠페인과 다른 점주의 캠페인을 서버가 같은 코드로 거절한다
const toCampaignFailure = (error: unknown) =>
  error instanceof ApiError && error.code === 'CAMPAIGN-005'
    ? { ok: false as const, message: NOT_FOUND_MESSAGE }
    : { ok: false as const };

export const getCampaign = async (id: string): Promise<ApiResult<Campaign>> => {
  try {
    return { ok: true, data: await fetchCampaignDetail(id) };
  } catch (error) {
    return toCampaignFailure(error);
  }
};

// 성과 조회, 쿠폰 수량, 소진 집계는 한 번에 최대 31일까지 조회한다
const PERFORMANCE_MAX_DAYS = 31;

interface PerformancePeriod {
  // YYYY-MM-DD, 한국 날짜 기준 양 끝 포함
  from: string;
  to: string;
}

// 성과 조회. 이벤트 기록이라 늦거나 빠질 수 있어 찜만 쓰고, 발급·사용은 쿠폰 수량을 쓴다
interface CampaignFunnelResponse {
  // 피드 스와이프 찜만 센다. 가게 상세에서 누른 찜은 빠진다
  wishCount: number;
}

// 쿠폰 수량. 기간 안의 회차 기준이라 기간을 나눠 받아 더해도 겹치지 않는다
interface CouponSummaryResponse {
  issuedCount: number;
  usedCount: number;
}

interface SpendSummaryResponse {
  items: { campaignId: number; spentPoint: number; reservedPoint: number }[];
}

const fetchCampaignFunnel = (id: string, period: PerformancePeriod) =>
  request<CampaignFunnelResponse>(
    `/v1/owner/campaigns/${encodeURIComponent(id)}/analytics/funnel?${new URLSearchParams({ ...period })}`,
  );

const fetchCouponSummary = (id: string, period: PerformancePeriod) =>
  request<CouponSummaryResponse>(
    `/v1/owner/campaigns/${encodeURIComponent(id)}/coupons/summary?${new URLSearchParams({ ...period })}`,
  );

// 기간 안의 이 캠페인 소진·예약 포인트. 소진이 없으면 줄이 오지 않아 0으로 본다
const fetchSpendSummary = async (id: string, period: PerformancePeriod) => {
  const params = new URLSearchParams({
    ...period,
    groupBy: 'CAMPAIGN',
    campaignId: id,
  });
  const { items } = await request<SpendSummaryResponse>(
    `/v1/owner/points/spend-summary?${params}`,
  );
  const item = items.find(({ campaignId }) => String(campaignId) === id);

  return {
    spentPoint: item?.spentPoint ?? 0,
    reservedPoint: item?.reservedPoint ?? 0,
  };
};

const sumBy = <T>(items: T[], getValue: (item: T) => number) =>
  items.reduce((sum, item) => sum + getValue(item), 0);

// 오늘 실적. 진행 중·일시중지이고 오늘이 집행 기간 안일 때만 있고, 아니면 null
export const getCampaignTodayPerformance = async (
  campaign: Pick<Campaign, 'id' | 'status' | 'budget'>,
): Promise<ApiResult<CampaignTodayPerformance | null>> => {
  const today = getKstToday();
  const { budget, id } = campaign;

  if (
    !isCurrentCampaign(campaign) ||
    !budget.startDate ||
    today < budget.startDate ||
    (budget.endDate && today > budget.endDate)
  ) {
    return { ok: true, data: null };
  }

  const period = { from: today, to: today };

  try {
    const [coupons, spend] = await Promise.all([
      fetchCouponSummary(id, period),
      fetchSpendSummary(id, period),
    ]);

    return {
      ok: true,
      data: {
        issuedCount: coupons.issuedCount,
        redeemedCount: coupons.usedCount,
        reservedPoints: spend.reservedPoint,
        spentPoints: spend.spentPoint,
      },
    };
  } catch {
    return { ok: false };
  }
};

// 집행 시작일부터 오늘(끝난 캠페인은 종료일)까지의 누적. 31일씩 나눠 받아 더한다.
// 아직 집행 전(작성 중, 대기 중)이면 null. 시작일이 지나도 서버가 진행 중으로 바꾸기 전에는 집행 전이다
export const getCampaignTotalPerformance = async ({
  budget,
  id,
  status,
}: Pick<Campaign, 'id' | 'status' | 'budget'>): Promise<
  ApiResult<CampaignTotalPerformance | null>
> => {
  const today = getKstToday();
  const to = budget.endDate && budget.endDate < today ? budget.endDate : today;

  if (
    status === 'DRAFT' ||
    status === 'SCHEDULED' ||
    !budget.startDate ||
    budget.startDate > to
  ) {
    return { ok: true, data: null };
  }

  const periods = splitPeriod(budget.startDate, to, PERFORMANCE_MAX_DAYS);

  try {
    // 긴 캠페인이나 지난 캠페인 카드가 여럿일 때 요청이 한꺼번에 몰리지 않게 구간은 차례로 받고,
    // 한 구간 안의 세 API만 함께 보낸다
    const results = [];

    for (const period of periods) {
      const [funnel, coupon, spend] = await Promise.all([
        fetchCampaignFunnel(id, period),
        fetchCouponSummary(id, period),
        fetchSpendSummary(id, period),
      ]);

      results.push({ funnel, coupon, spend });
    }

    return {
      ok: true,
      data: {
        savedCount: sumBy(results, ({ funnel }) => funnel.wishCount),
        issuedCount: sumBy(results, ({ coupon }) => coupon.issuedCount),
        redeemedCount: sumBy(results, ({ coupon }) => coupon.usedCount),
        spentPoints: sumBy(results, ({ spend }) => spend.spentPoint),
      },
    };
  } catch {
    return { ok: false };
  }
};

// 오늘과 누적 성과를 함께 받는다. 아직 시작하지 않았으면 null
export const getCampaignPerformance = async (
  campaign: Pick<Campaign, 'id' | 'status' | 'budget'>,
): Promise<ApiResult<CampaignPerformance | null>> => {
  const [today, total] = await Promise.all([
    getCampaignTodayPerformance(campaign),
    getCampaignTotalPerformance(campaign),
  ]);

  if (!today.ok) {
    return today;
  }

  if (!total.ok) {
    return total;
  }

  return {
    ok: true,
    data: total.data && { today: today.data, total: total.data },
  };
};

interface CouponSaveResponse {
  campaignId: number;
  status: CampaignStatus;
}

// 화면은 HH:mm, 서버는 상세 응답과 같은 HH:mm:ss로 주고받는다
const toServerTime = (time: string) => `${time}:00`;

// 등록 1단계 쿠폰 조건 저장. 서버는 그 가게에 DRAFT가 없으면 새로 만들고(201), 있으면 쿠폰 조건만 덮어쓴다(200).
// 그래서 캠페인 ID 없이 보내고, 저장된 DRAFT의 ID를 돌려준다
export const saveCouponStep = async (
  coupon: CouponStepValues,
): Promise<ApiResult<string>> => {
  const storeResult = await getMyStore();

  if (!storeResult.ok) {
    return { ok: false };
  }

  try {
    const data = await request<CouponSaveResponse>('/v1/owner/campaigns', {
      method: 'POST',
      body: {
        storeId: Number(storeResult.data.id),
        discountTargetType: coupon.discountTarget,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        ...(coupon.discountTarget === 'MENU' && coupon.menuId !== null
          ? { targetMenuId: Number(coupon.menuId) }
          : {}),
        issueQuantity: coupon.issueLimit,
        usableStartTime: toServerTime(coupon.usableFrom),
        usableEndTime: toServerTime(coupon.usableUntil),
        // 선택 입력은 비우면 보내지 않는다
        ...(coupon.minOrderAmount !== null
          ? { minOrderAmount: coupon.minOrderAmount }
          : {}),
        ...(coupon.notice.trim() ? { notice: coupon.notice.trim() } : {}),
      },
    });

    return { ok: true, data: String(data.campaignId) };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      return { ok: false };
    }

    if (error.code === 'CAMPAIGN-001') {
      return { ok: false, message: NOT_ACTIVE_OWNER_MESSAGE };
    }

    // 끝나지 않은 캠페인(대기 중, 진행 중, 일시중지)이 있으면 새 캠페인을 만들 수 없다. Swagger에는 아직 없는 코드다
    if (error.code === 'CAMPAIGN-010') {
      return { ok: false, message: CAMPAIGN_LIMIT_MESSAGE };
    }

    // CAMPAIGN-002(할인율 100 초과), 003(발급 수량 0 이하), 004(사용 가능 시간 오류)는 화면 검사로 미리 막는다.
    // 그래도 거절되면 서버 문구로 이유를 보여준다
    if (error.status === 422 && error.message) {
      return { ok: false, message: error.message };
    }

    return error.status === 400
      ? { ok: false, message: INVALID_COUPON_MESSAGE }
      : { ok: false };
  }
};

// 3·4단계 저장 응답. 저장한 뒤의 현재 값이다
interface CampaignUpdateResponse {
  campaignId: number;
  targetRadius: number;
  targetGender: TargetGender;
  targetAgeGroups: string[];
  dailyBudget: number | null;
  startDate: string | null;
  endDate: string | null;
}

const patchCampaign = (id: string, body: object) =>
  request<CampaignUpdateResponse>(
    `/v1/owner/campaigns/${encodeURIComponent(id)}`,
    { method: 'PATCH', body },
  );

// 3·4단계 저장 실패. 화면 검사로 미리 막는 값을 서버가 거절하면(400) 그 단계의 확인 안내를 보여준다
const toCampaignUpdateFailure = (error: unknown, invalidMessage: string) => {
  if (!(error instanceof ApiError)) {
    return { ok: false as const };
  }

  switch (error.code) {
    case 'CAMPAIGN-001':
      return { ok: false as const, message: NOT_ACTIVE_OWNER_MESSAGE };
    case 'CAMPAIGN-005':
      return { ok: false as const, message: NOT_FOUND_MESSAGE };
    // DRAFT가 아니면 노출 대상, 집행 기간을 바꿀 수 없다
    case 'CAMPAIGN-006':
      return { ok: false as const, message: NOT_EDITABLE_MESSAGE };
  }

  // CAMPAIGN-007(최소 하루 예산 미만), 008(집행 기간 1일 미만, 종료일이 시작일보다 이름), 009(시작일이 내일보다 이름)는
  // 화면 검사로 미리 막는다. 그래도 거절되면 서버 문구로 이유를 보여준다
  if (error.status === 422 && error.message) {
    return { ok: false as const, message: error.message };
  }

  return error.status === 400
    ? { ok: false as const, message: invalidMessage }
    : { ok: false as const };
};

// 등록 3단계 노출 대상 저장. 반경, 성별, 연령대는 함께 보내야 한다
export const saveTargetStep = async (
  id: string,
  target: TargetStepValues,
): Promise<ApiResult<TargetStepValues>> => {
  try {
    const data = await patchCampaign(id, {
      targetRadius: target.radius,
      targetGender: target.gender,
      targetAgeGroups: toServerAgeGroups(target.ageGroups),
    });

    return {
      ok: true,
      data: {
        radius: data.targetRadius as ExposureRadius,
        gender: data.targetGender,
        ageGroups: toAgeGroups(data.targetAgeGroups),
      },
    };
  } catch (error) {
    return toCampaignUpdateFailure(error, INVALID_TARGET_MESSAGE);
  }
};

// 등록 4단계 하루 예산과 집행 기간 저장. 세 값은 함께 보내야 하고 DRAFT에서만 바꿀 수 있다
export const saveBudgetStep = async (
  id: string,
  budget: BudgetStepValues,
): Promise<ApiResult<BudgetStepValues>> => {
  try {
    const data = await patchCampaign(id, {
      dailyBudget: budget.dailyBudget,
      startDate: budget.startDate,
      endDate: budget.endDate,
    });

    return {
      ok: true,
      data: {
        dailyBudget: data.dailyBudget,
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
      },
    };
  } catch (error) {
    return toCampaignUpdateFailure(error, INVALID_BUDGET_MESSAGE);
  }
};

// 포스터 생성 응답. 슬롯이 모두 채워진 완성 HTML이다
interface PosterCreateResponse {
  posterId: number;
  campaignId: number;
  templateId: number;
  // "{가게명} - {템플릿 이름}"
  title: string;
  html: string;
}

// 포스터 생성 요청 본문. 글은 서버가 가게명, 쿠폰 조건, 집행 기간으로 채워 템플릿과 이미지만 보낸다
const toPosterCreateRequest = ({
  imageObjectKey,
  templateId,
}: CampaignPoster) => ({
  templateId: Number(templateId),
  objectKey: imageObjectKey,
});

// 등록 2단계 포스터 저장. 캠페인당 포스터는 1건이라, 이미 있으면 서버가 덮어쓴다.
// 등록 화면이 DRAFT인지 확인한 뒤에 부른다
export const savePosterStep = async (
  id: string,
  poster: CampaignPoster | null,
): Promise<ApiResult<null>> => {
  // 템플릿이나 이미지가 없으면 포스터를 만들지 않는다
  if (!poster || !isPosterComplete(poster)) {
    return { ok: false, message: INVALID_POSTER_MESSAGE };
  }

  try {
    await request<PosterCreateResponse>(
      `/v1/owner/campaigns/${encodeURIComponent(id)}/poster`,
      { method: 'POST', body: toPosterCreateRequest(poster) },
    );

    return { ok: true, data: null };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      return { ok: false };
    }

    switch (error.code) {
      case 'CAMPAIGN-001':
        return { ok: false, message: NOT_ACTIVE_OWNER_MESSAGE };
      case 'CAMPAIGN-005':
        return { ok: false, message: NOT_FOUND_MESSAGE };
      case 'CAMPAIGN-006':
        return { ok: false, message: NOT_EDITABLE_MESSAGE };
    }

    // 템플릿이 그사이 내려갔거나 이미지를 찾을 수 없는 등은 오류 코드가 정해지지 않아 서버 문구를 보여준다
    return error.code && error.status >= 400 && error.status < 500
      ? { ok: false, message: error.message }
      : { ok: false };
  }
};

// 상태를 바꾸는 점주 처리. 요청 본문 없이 보내고, 이미 바뀐 상태면 서버가 다시 성공으로 돌려준다
type CampaignAction = 'activate' | 'cancel' | 'pause' | 'resume' | 'end';

// 처리 응답. 처리 뒤의 상태다
interface CampaignStatusResponse {
  campaignId: number;
  status: CampaignStatus;
  // 활성화만 온다. 자동 검수 실패 사유 코드이고, 통과했으면 빈 배열이다
  reasons?: string[];
}

// 409 CAMPAIGN-006. 그사이 상태가 바뀌어 지금 상태에서는 할 수 없다
const STATUS_CHANGED_MESSAGES: Record<CampaignAction, string> = {
  activate:
    '캠페인 상태가 바뀌어 활성화할 수 없습니다. 작성 중인 캠페인만 활성화할 수 있습니다.',
  cancel:
    '캠페인 상태가 바뀌어 취소할 수 없습니다. 집행이 시작됐거나 끝났습니다.',
  pause:
    '캠페인 상태가 바뀌어 중단할 수 없습니다. 진행 중인 캠페인만 중단할 수 있습니다.',
  resume:
    '캠페인 상태가 바뀌어 다시 시작할 수 없습니다. 직접 중단한 캠페인만 다시 시작할 수 있습니다.',
  end: '캠페인 상태가 바뀌어 종료할 수 없습니다. 일시중지한 캠페인만 종료할 수 있습니다.',
};

const requestCampaignAction = async (
  id: string,
  action: CampaignAction,
): Promise<ApiResult<CampaignStatusResponse>> => {
  try {
    const data = await request<CampaignStatusResponse>(
      `/v1/owner/campaigns/${encodeURIComponent(id)}:${action}`,
      { method: 'POST' },
    );

    return { ok: true, data };
  } catch (error) {
    if (!(error instanceof ApiError)) {
      return { ok: false };
    }

    switch (error.code) {
      // 상태가 바뀌었거나(006) 캠페인을 찾을 수 없다(005). 화면이 code를 보고 목록을 다시 불러온다
      case 'CAMPAIGN-006':
        return {
          ok: false,
          code: error.code,
          message: STATUS_CHANGED_MESSAGES[action],
        };
      case 'CAMPAIGN-005':
        return { ok: false, code: error.code, message: NOT_FOUND_MESSAGE };
      case 'CAMPAIGN-001':
        return { ok: false, message: NOT_ACTIVE_OWNER_ACTION_MESSAGE };
      // 활성화할 때 저장된 포스터가 없다. 화면이 code를 보고 포스터 단계로 보낸다
      case 'POSTER-020':
        return {
          ok: false,
          code: error.code,
          message: POSTER_REQUIRED_MESSAGE,
        };
    }

    // 재개 거절(집행 기간이 끝남, 오늘 남은 예산이 노출 단가보다 적음)은 오류 코드가 정해지지 않아 서버 문구를 보여준다
    if (error.code && error.status >= 400 && error.status < 500) {
      return { ok: false, message: error.message };
    }

    return { ok: false };
  }
};

// 포스터 자동 검수 실패 사유. 서버가 포스터 글과 사진을 검사한다
type ModerationFailReason =
  // 포스터 글이나 사진 속 글자에 금지 표현이 있음
  | 'FORBIDDEN_EXPRESSION'
  | 'IMAGE_UNREADABLE'
  // 사진이 200×200보다 작음
  | 'RESOLUTION_TOO_LOW'
  // 사진에서 글자 영역이 절반을 넘음
  | 'TEXT_RATIO_EXCEEDED'
  // 검수 도구 장애나 시간 초과. 사진을 바꾸지 않고 다시 요청하면 된다
  | 'MODERATION_TOOL_FAILURE';

const MODERATION_FAIL_MESSAGES: Record<ModerationFailReason, string> = {
  RESOLUTION_TOO_LOW:
    '포스터 사진이 너무 작아요. 200×200 이상인 사진으로 바꿔 주세요.',
  TEXT_RATIO_EXCEEDED:
    '사진에 글자가 너무 많아요. 글자가 적은 사진으로 바꿔 주세요.',
  FORBIDDEN_EXPRESSION:
    '사진이나 포스터 문구에 쓸 수 없는 표현이 있어요. 다른 사진으로 바꿔 주세요.',
  IMAGE_UNREADABLE: '사진을 읽지 못했어요. 다른 jpg, png 사진으로 바꿔 주세요.',
  MODERATION_TOOL_FAILURE:
    '검수를 마치지 못했어요. 잠시 후 다시 시도해 주세요.',
};

// 자동 검수 실패. 사진을 바꿔야 통과하면 화면이 포스터 단계로 보내고,
// 검수 도구 장애처럼 다시 요청하면 되는 실패는 확인 단계에 남긴다
export type ActivationFailureCode =
  'MODERATION_FIX_POSTER' | 'MODERATION_RETRY';

const isModerationFailReason = (
  reason: string,
): reason is ModerationFailReason => reason in MODERATION_FAIL_MESSAGES;

// 작성 중(DRAFT) 캠페인 활성화 요청. 자동 검수를 통과하면 대기 중(SCHEDULED)이 되고,
// 실패하면 작성 중으로 남아 서버가 사유를 돌려준다. 사유는 이 응답에만 있어 다시 조회할 수 없다.
// 잔액은 검사하지 않고, 모자라면 첫 서빙일 00:00 예약에서 PAUSED(NO_POINTS)가 된다
export const requestCampaignActivation = async (
  id: string,
): Promise<ApiResult<CampaignStatus>> => {
  const result = await requestCampaignAction(id, 'activate');

  if (!result.ok) {
    return result;
  }

  const { reasons = [], status } = result.data;

  if (status === 'SCHEDULED') {
    return { ok: true, data: status };
  }

  // 모르는 사유는 문구 없이 다시 시도하게 한다
  const knownReasons = reasons.filter(isModerationFailReason);
  const needsPosterFix = knownReasons.some(
    (reason) => reason !== 'MODERATION_TOOL_FAILURE',
  );

  return {
    ok: false,
    code: (needsPosterFix
      ? 'MODERATION_FIX_POSTER'
      : 'MODERATION_RETRY') satisfies ActivationFailureCode,
    message:
      knownReasons.length > 0
        ? knownReasons
            .map((reason) => MODERATION_FAIL_MESSAGES[reason])
            .join(' ')
        : undefined,
  };
};

// 대기 중(SCHEDULED) 취소. 지우지 않고 작성 중으로 되돌려 입력값은 그대로 둔다.
// 다시 노출하려면 활성화를 다시 요청해야 하고, 시작일 전날 23:59까지 SCHEDULED여야 시작일부터 노출된다
export const cancelScheduledCampaign = (id: string) =>
  requestCampaignAction(id, 'cancel');

// 진행 중(ACTIVE) 캠페인 중단. PAUSED(사유 OWNER)가 되고 다음 피드 요청부터 노출되지 않는다.
// 오늘 이미 쓴 포인트는 돌려주지 않는다
export const pauseCampaign = (id: string) => requestCampaignAction(id, 'pause');

// 점주가 직접 중단한(PAUSED, 사유 OWNER) 캠페인 재개. ACTIVE가 되고 바로 다시 노출된다
export const resumeCampaign = (id: string) =>
  requestCampaignAction(id, 'resume');

// 일시중지(PAUSED) 캠페인 종료. ENDED가 되고 되돌릴 수 없다. 진행 중이면 먼저 중단해야 한다.
// 종료하면 새 캠페인을 등록할 수 있다
export const endCampaign = (id: string) => requestCampaignAction(id, 'end');
