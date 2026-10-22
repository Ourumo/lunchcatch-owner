import { request } from './client';
import type { ApiResult } from './types';

// 점주 포인트 잔액과 내역 (docs/requirements-owner.md "잔액 및 내역 조회").
// 잔액은 정산만 가지므로 캠페인 API와 분리한다. 캠페인 화면은 잔액 부족 안내를 위해 따로 불러온다
// 충전은 결제위젯을 거치므로 api/payments.ts에서 한다

export interface PointBalance {
  // 포인트 원장 합계 (1원 = 1포인트)
  balance: number;
  // 오늘 예약했지만 아직 쓰지 않은 포인트. 잔액과 따로 보여준다
  reservedPoints: number;
}

// 원장 유형. 서버 원장(GET /v1/owner/points/ledger)의 유형과 같다
export type PointHistoryType =
  'CHARGE' | 'RESERVE' | 'DEDUCT' | 'RELEASE' | 'REFUND' | 'ADJUST';

// 조회 기간. 최근 7일, 30일, 3개월이고 오늘을 포함한다
export type PointHistoryPeriod = '7D' | '30D' | '3M';

export interface PointHistoryFilter {
  period: PointHistoryPeriod;
  // 없으면 모든 내역. 있으면 그 캠페인의 내역만 (충전처럼 캠페인이 없는 내역은 빠진다)
  campaignId: string | null;
}

// 원장 한 줄. 노출마다 쌓이는 소진(DEDUCT)은 서버가 원장으로 내리지 않아 내역에 없다
export interface PointHistoryEntry {
  id: string;
  type: PointHistoryType;
  // 잔액의 증감(+/−)
  amount: number;
  occurredAt: string;
  // 예약과 예약 해제가 어느 날 몫인지(YYYY-MM-DD). 전날 몫의 예약 해제는 다음 날 00:00에 기록된다.
  // 충전, 환불, 조정은 null
  businessDate: string | null;
  campaignId: string | null;
}

export interface PointHistoryPage {
  entries: PointHistoryEntry[];
  // 다음 구간을 받을 때 넘기는 값. 마지막 구간이면 null
  nextCursor: string | null;
}

export const POINT_HISTORY_PAGE_SIZE = 20;

const LEDGER_FAILED_MESSAGE = '포인트 원장을 불러오지 못했습니다.';

// 충전 정책. 오늘 적용 중인 최소 충전 금액(원)과 충전 금액 선택지
export interface PointPolicy {
  minChargeAmount: number;
  chargeAmounts: number[];
}

// 서버 충전 정책 응답 (GET /v1/owner/point-policy)
interface PointPolicyResponse {
  minChargeAmount: number;
  chargeProducts: number[];
  effectiveDate: string;
}

// 실패 문구는 충전 시트가 정한다
export const getPointPolicy = async (): Promise<ApiResult<PointPolicy>> => {
  try {
    const data = await request<PointPolicyResponse>('/v1/owner/point-policy');

    return {
      ok: true,
      data: {
        minChargeAmount: data.minChargeAmount,
        chargeAmounts: data.chargeProducts,
      },
    };
  } catch {
    return { ok: false };
  }
};

// 서버 잔액 응답 (GET /v1/owner/points/balance). 잔액은 원장 합계로 계산한 값이다
interface PointBalanceResponse {
  balance: number;
  reservedPoint: number;
  // 화면에서 쓰지 않는다 (무엇을 합한 값인지 백엔드 확인 필요)
  unspentTotal: number;
  businessDate: string;
}

// 원장을 읽지 못했거나(503 BILLING-006) 응답을 받지 못하면 조회 실패로 돌려준다. 이전 잔액으로 대신 보여주지 않는다
export const getPointBalance = async (): Promise<ApiResult<PointBalance>> => {
  try {
    const data = await request<PointBalanceResponse>(
      '/v1/owner/points/balance',
    );

    return {
      ok: true,
      data: {
        balance: data.balance,
        reservedPoints: data.reservedPoint,
      },
    };
  } catch {
    return { ok: false, message: LEDGER_FAILED_MESSAGE };
  }
};

// 한국은 서머타임이 없어 UTC와 늘 9시간 차이다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 한국 날짜(YYYY-MM-DD). UTC 시각에 9시간을 더한 뒤 UTC 날짜를 읽는다
export const toKstDate = (date: Date) =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

// 조회 기간 첫날의 한국 날짜. 브라우저 시간대와 상관없이 한국 날짜로 기간을 자른다
export const getPeriodStartDate = (period: PointHistoryPeriod) => {
  const start = new Date(Date.now() + KST_OFFSET_MS);

  if (period === '3M') {
    // 그 달에 없는 날(5월 31일의 3개월 전인 2월 31일 등)이 다음 달로 넘어가지 않게 그 달 말일로 맞춘다
    const day = start.getUTCDate();

    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() - 3);

    const lastDay = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
    ).getUTCDate();

    start.setUTCDate(Math.min(day, lastDay));
  } else {
    start.setUTCDate(start.getUTCDate() - (period === '7D' ? 6 : 29));
  }

  return start.toISOString().slice(0, 10);
};

// 서버 캠페인 ID는 숫자다. 캠페인 API 연동 전의 mock 캠페인 ID(예: campaign-active)는 서버 원장에 내역이 없다
const isServerCampaignId = (campaignId: string) => /^\d+$/.test(campaignId);

interface CursorPageResponse<T> {
  items: T[];
  // 비어 있으면 마지막 구간
  nextPageToken: string | null;
}

// 서버 원장 한 줄 (GET /v1/owner/points/ledger)
interface OwnerLedgerItem {
  ledgerId: number;
  entryType: PointHistoryType;
  amount: number;
  campaignId: number | null;
  businessDate: string | null;
  paymentId: number | null;
  createdAt: string;
}

// 잔액이 느는 유형과 주는 유형. 개발 서버 테스트 계정에 내역이 없어 amount의 부호를 확인하지 못해,
// 받은 부호와 상관없이 유형으로 부호를 정한다. 조정은 늘 수도 줄 수도 있어 받은 부호를 그대로 쓴다
const INCREASING_TYPES: PointHistoryType[] = ['CHARGE', 'RELEASE'];
const DECREASING_TYPES: PointHistoryType[] = ['RESERVE', 'DEDUCT', 'REFUND'];

const getSignedAmount = (type: PointHistoryType, amount: number) => {
  if (INCREASING_TYPES.includes(type)) {
    return Math.abs(amount);
  }

  return DECREASING_TYPES.includes(type) ? -Math.abs(amount) : amount;
};

const toHistoryEntry = ({
  amount,
  businessDate,
  campaignId,
  createdAt,
  entryType,
  ledgerId,
}: OwnerLedgerItem): PointHistoryEntry => ({
  id: String(ledgerId),
  type: entryType,
  amount: getSignedAmount(entryType, amount),
  occurredAt: createdAt,
  businessDate,
  campaignId: campaignId === null ? null : String(campaignId),
});

// 포인트 내역 한 구간. 최신순이고, 다음 구간은 받은 커서로 이어서 부른다
export const getPointHistoryPage = async ({
  campaignId,
  cursor,
  period,
}: PointHistoryFilter & { cursor?: string }): Promise<
  ApiResult<PointHistoryPage>
> => {
  if (campaignId !== null && !isServerCampaignId(campaignId)) {
    return { ok: true, data: { entries: [], nextCursor: null } };
  }

  const params = new URLSearchParams({
    from: getPeriodStartDate(period),
    to: toKstDate(new Date()),
    pageSize: String(POINT_HISTORY_PAGE_SIZE),
  });

  if (campaignId) {
    params.set('campaignId', campaignId);
  }

  if (cursor) {
    params.set('pageToken', cursor);
  }

  try {
    const data = await request<CursorPageResponse<OwnerLedgerItem>>(
      `/v1/owner/points/ledger?${params}`,
    );

    return {
      ok: true,
      data: {
        entries: data.items.map(toHistoryEntry),
        nextCursor: data.nextPageToken || null,
      },
    };
  } catch {
    return { ok: false, message: LEDGER_FAILED_MESSAGE };
  }
};

// 서버 소진 집계 한 줄 (GET /v1/owner/points/spend-summary)
interface SpendSummaryItem {
  date: string;
  campaignId: number;
  spentPoint: number;
  reservedPoint: number;
  impressionCount: number;
}

// 오늘 캠페인별 소진 포인트(캠페인 ID → 포인트). 예약 해제(13:30) 전에는 원장만으로 소진을 알 수 없어 소진 집계로 받는다.
// 지난날의 소진은 원장의 예약 − 예약 해제로 계산하므로 오늘만 부른다 (소진 집계는 최대 31일까지만 조회된다)
export const getTodaySpentPoints = async (
  campaignId: string | null,
): Promise<ApiResult<Record<string, number>>> => {
  if (campaignId !== null && !isServerCampaignId(campaignId)) {
    return { ok: true, data: {} };
  }

  const today = toKstDate(new Date());
  const params = new URLSearchParams({
    groupBy: 'DAY_CAMPAIGN',
    from: today,
    to: today,
  });

  if (campaignId) {
    params.set('campaignId', campaignId);
  }

  try {
    const data = await request<{ items: SpendSummaryItem[] }>(
      `/v1/owner/points/spend-summary?${params}`,
    );

    return {
      ok: true,
      data: Object.fromEntries(
        data.items.map((item) => [String(item.campaignId), item.spentPoint]),
      ),
    };
  } catch {
    return { ok: false };
  }
};
