import { request } from './client';
import { mockDelay } from './mocks/delay';
import { mockRecentServingDays } from './mocks/report';
import type { ApiResult } from './types';

// 점주 리포트 (docs/requirements-owner.md "리포트 > 광고주 노출 리포트")
// 캠페인별 날짜별 리포트는 서버 API를 쓴다. 홈의 가게 단위 쿠폰 사용 실적은 API 연동 전까지 mock 데이터로 동작한다

export interface ServingDayPerformance {
  // 캠페인이 집행된 날 (YYYY-MM-DD). 캠페인이 매일 열리지 않아 간격이 일정하지 않다
  date: string;
  // 그날 사용 처리된 쿠폰 수
  redeemedCount: number;
  // 일 1회 집계로 확정됐는지. 확정 전인 당일 값은 화면에 "집계 중"으로 표시한다
  isConfirmed: boolean;
}

// 가게 단위 쿠폰 사용 실적. 홈의 쿠폰 사용 추이에 쓴다.
// 캠페인별 리포트와 달리 여러 캠페인에 걸친 가게 단위 실적이라 응답 형태를 백엔드와 확인해야 한다
// 최근 집행일 5회. 오래된 날짜부터 온다
export const getRecentServingDays = async (): Promise<
  ApiResult<ServingDayPerformance[]>
> => {
  await mockDelay();

  return { ok: true, data: structuredClone(mockRecentServingDays) };
};

// 한 캠페인의 하루 리포트. 하루 한 번 집계해 오늘과 아직 집계되지 않은 날은 오지 않는다.
// 오지 않은 날을 실적 0으로 보지 않는다
export interface CampaignDayReport {
  // YYYY-MM-DD
  date: string;
  campaignId: string;
  // 그날 실제로 배정된 하루 예산. 잔액이 모자라면 설정한 하루 예산보다 적다
  dailyBudget: number;
  // 과금 노출 1회당 포인트
  impressionUnitCost: number;
  // 비용이 발생하지 않은 유효 노출도 포함한다
  validImpressionCount: number;
  // 포인트가 차감되지 않은 노출
  invalidImpressionCount: number;
  // 그날 생긴 찜 건수. 지금 찜한 사람 수와는 다르다
  wishCount: number;
  // 그날 쿠폰 회차에서 발급된 쿠폰 수
  issuedCount: number;
  // 그날 사용된 쿠폰 수 (방문)
  redeemCount: number;
  // 차감 포인트 − 잘못 차감되어 돌려받은 포인트. 돌려받은 포인트가 많으면 음수다
  spentPoints: number;
}

// 서버 리포트 한 줄 (GET /v1/owner/report)
interface OwnerReportItemResponse {
  businessDate: string;
  campaignId: number;
  dailyBudget: number;
  impressionUnitCost: number;
  validImpressionCount: number;
  invalidImpressionCount: number;
  wishCount: number;
  issuedCount: number;
  redeemCount: number;
  chargedAmount: number;
  refundedAmount: number;
  spentAmount: number;
}

interface OwnerReportResponse {
  from: string;
  to: string;
  totalSpentAmount: number;
  items: OwnerReportItemResponse[];
}

// 한 번에 조회할 수 있는 최대 일수 (시작일과 종료일 포함). 넘으면 400 ANALYTICS-001
const REPORT_MAX_DAYS = 30;

const REPORT_FAILED_MESSAGE = '리포트를 불러오지 못했습니다.';

const DAY_MS = 24 * 60 * 60 * 1000;

// 한국은 서머타임이 없어 UTC와 늘 9시간 차이다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 오늘 한국 날짜(YYYY-MM-DD). 브라우저 시간대와 상관없이 한국 날짜로 기간을 자른다
const getKstToday = () =>
  new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);

// YYYY-MM-DD에 일수를 더한다. 시간대 영향을 받지 않게 UTC 자정으로 계산한다
const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

// 서버 캠페인 ID는 숫자다. mock 캠페인 ID(예: campaign-active)는 서버 리포트에 없다
const isServerCampaignId = (campaignId: string) => /^\d+$/.test(campaignId);

const toCampaignDayReport = (
  item: OwnerReportItemResponse,
): CampaignDayReport => ({
  date: item.businessDate,
  campaignId: String(item.campaignId),
  dailyBudget: item.dailyBudget,
  impressionUnitCost: item.impressionUnitCost,
  validImpressionCount: item.validImpressionCount,
  invalidImpressionCount: item.invalidImpressionCount,
  wishCount: item.wishCount,
  issuedCount: item.issuedCount,
  redeemCount: item.redeemCount,
  spentPoints: item.spentAmount,
});

// 기간 안의 가게 전체 캠페인 리포트. 날짜, 캠페인 ID 오름차순으로 온다.
// 기간은 최대 REPORT_MAX_DAYS일이다. 더 긴 기간은 getCampaignReport로 나눠 받는다
export const getOwnerReport = async ({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<ApiResult<CampaignDayReport[]>> => {
  try {
    const params = new URLSearchParams({ from, to });
    const data = await request<OwnerReportResponse>(
      `/v1/owner/report?${params}`,
    );

    return { ok: true, data: data.items.map(toCampaignDayReport) };
  } catch {
    return { ok: false, message: REPORT_FAILED_MESSAGE };
  }
};

// 집행 기간을 최대 조회 일수씩 나눈 구간들. 마지막 구간은 짧을 수 있다
const splitReportPeriod = (from: string, to: string) => {
  const periods: { from: string; to: string }[] = [];

  for (let start = from; start <= to; start = addDays(start, REPORT_MAX_DAYS)) {
    const end = addDays(start, REPORT_MAX_DAYS - 1);
    periods.push({ from: start, to: end < to ? end : to });
  }

  return periods;
};

// 한 캠페인의 집행 기간 리포트. 집행 시작일부터 오늘과 집행 종료일 중 앞선 날까지 조회한다.
// 리포트는 가게의 모든 캠페인을 함께 주므로 기간을 나눠 받은 뒤 이 캠페인 것만 남긴다
export const getCampaignReport = async ({
  campaignId,
  startDate,
  endDate,
}: {
  campaignId: string;
  startDate: string;
  endDate: string;
}): Promise<ApiResult<CampaignDayReport[]>> => {
  const today = getKstToday();
  const to = endDate < today ? endDate : today;

  // 아직 시작하지 않은 캠페인이거나 mock 캠페인이면 받을 리포트가 없다
  if (!isServerCampaignId(campaignId) || startDate > to) {
    return { ok: true, data: [] };
  }

  const results = await Promise.all(
    splitReportPeriod(startDate, to).map((period) => getOwnerReport(period)),
  );
  const failed = results.find((result) => !result.ok);

  if (failed) {
    return failed;
  }

  return {
    ok: true,
    data: results
      .flatMap((result) => (result.ok ? result.data : []))
      .filter((item) => item.campaignId === campaignId),
  };
};
