import { request } from './client';
import { mockDelay } from './mocks/delay';
import {
  MOCK_LEDGER_FAILS,
  type MockLedgerEntry,
  mockPointLedger,
} from './mocks/points';
import type { ApiResult } from './types';

// 점주 포인트 잔액과 내역 (docs/requirements-owner.md "잔액 및 내역 조회").
// 잔액은 정산만 가지므로 캠페인 API와 분리한다. 캠페인 화면은 잔액 부족 안내를 위해 따로 불러온다
// 잔액은 서버 API를 쓰고, 내역과 충전은 아직 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export interface PointBalance {
  // 포인트 원장 합계 (1원 = 1포인트)
  balance: number;
  // 오늘 예약했지만 아직 쓰지 않은 포인트. 잔액과 따로 보여준다
  reservedPoints: number;
}

// 원장 유형. 관리자 앱(billing)의 유형에 무효 노출 환급(REFUND_INVALID)을 더한다.
// REFUND_INVALID는 관리자 앱에 없어 백엔드 확인이 필요하다
export type PointHistoryType =
  | 'CHARGE'
  | 'RESERVE'
  | 'DEDUCT'
  | 'RELEASE'
  | 'REFUND_INVALID'
  | 'REFUND'
  | 'ADJUST';

// 조회 기간. 최근 7일, 30일, 3개월이고 오늘을 포함한다
export type PointHistoryPeriod = '7D' | '30D' | '3M';

export interface PointHistoryFilter {
  period: PointHistoryPeriod;
  // 없으면 모든 내역. 있으면 그 캠페인의 내역만 (충전처럼 캠페인이 없는 내역은 빠진다)
  campaignId: string | null;
}

export interface PointHistoryEntry {
  id: string;
  type: PointHistoryType;
  // 보여줄 증감(+/−). 소진은 예약 중 포인트에서 빠진 양이라 잔액은 그대로다
  amount: number;
  // 이 내역이 반영된 뒤의 잔액
  balanceAfter: number;
  // 소진은 캠페인별·일별 합계라 그날 마지막 차감 시각
  occurredAt: string;
  campaignId: string | null;
  // 조정 사유
  memo: string | null;
}

// 최소 충전 금액(원). 명세에 값이 없어 임시로 둔다. 기획 확인 후 바꾼다
export const MIN_CHARGE_AMOUNT = 10000;

const BELOW_MIN_CHARGE_MESSAGE = `${MIN_CHARGE_AMOUNT.toLocaleString('ko-KR')}원부터 충전할 수 있습니다.`;
const LEDGER_FAILED_MESSAGE = '포인트 원장을 불러오지 못했습니다.';

// 서버 잔액 응답 (GET /v1/owner/points/balance). 잔액은 원장 합계로 계산한 값이다
interface PointBalanceResponse {
  balance: number;
  reservedPoint: number;
  // 화면에서 쓰지 않는다 (무엇을 합한 값인지 백엔드 확인 필요)
  unspentTotal: number;
  businessDate: string;
}

// 결제 충전 연동 전까지 mock으로 충전한 금액의 합. 서버 잔액은 바꿀 수 없어 앱 안에서만 더해 보여준다.
// 새로고침하면 사라진다. 개발 중 잔액 부족 → 충전 → 진행 흐름을 확인하려고 둔다
let mockChargedTotal = 0;

// 원장을 읽지 못했거나(503 BILLING-006) 응답을 받지 못하면 조회 실패로 돌려준다. 이전 잔액으로 대신 보여주지 않는다
export const getPointBalance = async (): Promise<ApiResult<PointBalance>> => {
  try {
    const data = await request<PointBalanceResponse>(
      '/v1/owner/points/balance',
    );

    return {
      ok: true,
      data: {
        balance: data.balance + mockChargedTotal,
        reservedPoints: data.reservedPoint,
      },
    };
  } catch {
    return { ok: false, message: LEDGER_FAILED_MESSAGE };
  }
};

// 한국은 서머타임이 없어 UTC와 늘 9시간 차이다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 조회 기간 첫날의 한국 시간 00:00. 브라우저 시간대와 상관없이 한국 날짜로 기간을 자른다.
// 한국 시각에 9시간을 더해 UTC 날짜 계산으로 다룬 뒤 다시 뺀다
const getPeriodStart = (period: PointHistoryPeriod) => {
  const start = new Date(Date.now() + KST_OFFSET_MS);

  start.setUTCHours(0, 0, 0, 0);

  if (period === '3M') {
    start.setUTCMonth(start.getUTCMonth() - 3);
  } else {
    start.setUTCDate(start.getUTCDate() - (period === '7D' ? 6 : 29));
  }

  return new Date(start.getTime() - KST_OFFSET_MS);
};

const toHistoryEntry = (
  {
    balanceDelta,
    campaignId,
    id,
    memo,
    occurredAt,
    reservedDelta,
    type,
  }: MockLedgerEntry,
  balanceAfter: number,
): PointHistoryEntry => ({
  id,
  type,
  amount: type === 'DEDUCT' ? reservedDelta : balanceDelta,
  balanceAfter,
  occurredAt,
  campaignId,
  memo,
});

// 포인트 내역. 최신순이고, 그 시점 잔액은 기간·캠페인으로 거르기 전 전체 원장으로 계산한다
export const getPointHistory = async ({
  campaignId,
  period,
}: PointHistoryFilter): Promise<ApiResult<PointHistoryEntry[]>> => {
  await mockDelay();

  if (MOCK_LEDGER_FAILS) {
    return { ok: false, message: LEDGER_FAILED_MESSAGE };
  }

  const periodStart = getPeriodStart(period);
  let balance = 0;

  const entries = [...mockPointLedger]
    .sort(
      (a, b) =>
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    )
    .map((entry) => {
      balance += entry.balanceDelta;

      return toHistoryEntry(entry, balance);
    });

  return {
    ok: true,
    data: entries
      .filter(
        (entry) =>
          new Date(entry.occurredAt) >= periodStart &&
          (campaignId === null || entry.campaignId === campaignId),
      )
      .reverse(),
  };
};

// 포인트 충전 (docs/requirements-owner.md "포인트 결제"). 1원 = 1포인트로 잔액에 더하고 원장에 충전을 남긴 뒤 바뀐 잔액을 돌려준다
// 실제 결제는 결제대행사 화면을 거친다. mock은 테스트 결제라 바로 충전되고, 서버 잔액에 충전 금액을 더해 돌려준다
export const chargePoints = async (
  amount: number,
): Promise<ApiResult<PointBalance>> => {
  await mockDelay();

  if (!Number.isInteger(amount) || amount < MIN_CHARGE_AMOUNT) {
    return { ok: false, message: BELOW_MIN_CHARGE_MESSAGE };
  }

  // 바뀐 잔액을 받지 못하면 충전하지 않은 것으로 둔다
  const balanceResult = await getPointBalance();

  if (!balanceResult.ok) {
    return balanceResult;
  }

  mockChargedTotal += amount;
  mockPointLedger.push({
    id: `ledger-${mockPointLedger.length + 1}`,
    type: 'CHARGE',
    occurredAt: new Date().toISOString(),
    balanceDelta: amount,
    reservedDelta: 0,
    campaignId: null,
    memo: null,
  });

  return {
    ok: true,
    data: {
      ...balanceResult.data,
      balance: balanceResult.data.balance + amount,
    },
  };
};
