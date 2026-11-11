import { http } from 'msw/http';

import { getKstTime, getKstToday, toKstDateTime } from '@owner/mocks/date';
import { getDb, updateDb } from '@owner/mocks/db';
import { getBalance } from '@owner/mocks/ledger';
import { fail, ok, paginate, unauthenticated } from '@owner/mocks/response';
import type { MockDb } from '@owner/mocks/seed';

// 포인트 환불 요청 (api/refund.ts)
// 잔액 전액만 환불할 수 있고 관리자가 승인해야 처리된다. 시연에는 관리자가 없어 요청은 "처리 대기"로 남는다

// 명세에 수수료 기준이 없어 시연 데이터는 0원으로 둔다
const REFUND_FEE = 0;

// 지금 환불을 요청할 수 없는 이유. 없으면 null
const getBlockedReason = (db: MockDb) => {
  if (
    db.campaigns.some(
      ({ status }) => status === 'ACTIVE' || status === 'PAUSED',
    )
  ) {
    return 'ACTIVE_CAMPAIGN' as const;
  }

  if (db.refunds.some(({ status }) => status === 'REQUESTED')) {
    return 'PENDING_REQUEST' as const;
  }

  return getBalance(db) <= 0 ? ('NO_BALANCE' as const) : null;
};

// 막힌 이유별 서버 거절 코드
const BLOCKED_CODES = {
  ACTIVE_CAMPAIGN: 'BILLING-010',
  PENDING_REQUEST: 'BILLING-011',
  NO_BALANCE: 'BILLING-012',
} as const;

export const refundHandlers = [
  // 환불 미리보기. 잔액에는 오늘 예약한 포인트가 이미 빠져 있어 그대로 환불 대상이다
  http.get('*/v1/owner/refund-requests/preview', () => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const refundablePoint = Math.max(getBalance(db), 0);
    const blockedReason = getBlockedReason(db);

    return ok({
      refundablePoint,
      fee: REFUND_FEE,
      expectedRefundAmount: Math.max(refundablePoint - REFUND_FEE, 0),
      canRequest: blockedReason === null,
      blockedReason,
    });
  }),

  // 환불 요청. 미리보기를 본 뒤 상태가 바뀌었으면 막힌 이유의 코드로 거절한다
  http.post<never, { reason?: string }>(
    '*/v1/owner/refund-requests',
    async ({ request }) => {
      const db = getDb();

      if (!db.owner.isLoggedIn) return unauthenticated();

      const blockedReason = getBlockedReason(db);

      if (blockedReason) {
        return fail(
          409,
          BLOCKED_CODES[blockedReason],
          '지금은 환불을 요청할 수 없습니다.',
        );
      }

      const { reason } = await request.json();
      const refundRequestId = db.nextId;
      const amount = getBalance(db);

      updateDb((current) => {
        current.nextId += 1;
        current.refunds.push({
          refundRequestId,
          amount,
          fee: REFUND_FEE,
          status: 'REQUESTED',
          reason: reason ?? null,
          rejectReason: null,
          requestedAt: toKstDateTime(getKstToday(), getKstTime()),
          processedAt: null,
        });
      });

      return ok({
        refundRequestId,
        amount,
        fee: REFUND_FEE,
        status: 'REQUESTED',
      });
    },
  ),

  // 내 환불 요청. 요청 시각 최신순
  http.get('*/v1/owner/refund-requests', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const items = [...db.refunds].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt),
    );

    return ok(paginate(items, request));
  }),
];
