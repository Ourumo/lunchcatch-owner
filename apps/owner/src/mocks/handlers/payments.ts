import { http } from 'msw/http';

import { getKstTime, getKstToday, toKstDateTime } from '@owner/mocks/date';
import { getDb, updateDb } from '@owner/mocks/db';
import { fail, ok, paginate, unauthenticated } from '@owner/mocks/response';
import type { MockPayment } from '@owner/mocks/seed';

import { CHARGE_POLICY } from './points';

// 포인트 충전 결제 (api/payments.ts)
//
// 진짜 흐름: 주문 생성 → 토스 결제위젯에서 결제 → 성공 주소로 돌아오면 서버가 토스에 승인을 요청하고 포인트를 충전
// 목 흐름:   결제위젯은 토스 테스트 키로 실제로 뜨고(카드는 테스트 결제라 돈이 나가지 않는다),
//            성공 주소로 돌아온 뒤의 승인 확정만 목 서버가 받아 포인트를 충전한다

type PaymentParams = { paymentId: string };

interface ConfirmBody {
  orderId: string;
  pgTid: string;
}

const now = () => toKstDateTime(getKstToday(), getKstTime());

const findPayment = (paymentId: string) =>
  getDb().payments.find((payment) => String(payment.paymentId) === paymentId);

const paymentNotFound = () =>
  fail(404, 'BILLING-004', '결제를 찾을 수 없습니다.');

const toDetail = (payment: MockPayment) => ({
  paymentId: payment.paymentId,
  orderId: payment.orderId,
  status: payment.status,
  displayStatus: payment.displayStatus,
  amount: payment.amount,
  requestedAt: payment.requestedAt,
  approvedAt: payment.approvedAt,
});

export const paymentHandlers = [
  // 충전 주문 생성. 금액은 충전 정책의 상품 중 하나여야 한다
  http.post<never, { amount: number }>(
    '*/v1/owner/payments',
    async ({ request }) => {
      const db = getDb();

      if (!db.owner.isLoggedIn) return unauthenticated();

      const { amount } = await request.json();

      if (amount < CHARGE_POLICY.minChargeAmount) {
        return fail(
          422,
          'BILLING-001',
          `최소 ${CHARGE_POLICY.minChargeAmount.toLocaleString()}원부터 충전할 수 있습니다.`,
        );
      }

      if (!CHARGE_POLICY.chargeProducts.includes(amount)) {
        return fail(422, 'BILLING-002', '충전 상품에 없는 금액입니다.');
      }

      const paymentId = db.nextId;
      const payment: MockPayment = {
        paymentId,
        orderId: `mock-order-${paymentId}`,
        amount,
        status: 'REQUESTED',
        displayStatus: 'IN_PROGRESS',
        failureReason: null,
        requestedAt: now(),
        approvedAt: null,
        canceledAt: null,
      };

      updateDb((current) => {
        current.nextId += 1;
        current.payments.push(payment);
      });

      return ok({ paymentId, orderId: payment.orderId, amount });
    },
  ),

  // 승인 확정. 포인트를 충전하고 원장에 남긴다. 같은 주문을 다시 확정해도 충전은 한 번이다
  http.post<PaymentParams, ConfirmBody>(
    '*/v1/owner/payments/:paymentId\\:confirm',
    async ({ params, request }) => {
      if (!getDb().owner.isLoggedIn) return unauthenticated();

      const payment = findPayment(params.paymentId);

      if (!payment) return paymentNotFound();

      const { orderId } = await request.json();

      if (orderId !== payment.orderId) {
        return fail(409, 'BILLING-017', '주문 정보가 맞지 않습니다.');
      }

      if (payment.status === 'CANCELLED') {
        return fail(409, 'BILLING-009', '이미 취소된 주문입니다.');
      }

      if (payment.status !== 'APPROVED') {
        const approvedAt = now();

        updateDb((db) => {
          const saved = db.payments.find(
            (item) => item.paymentId === payment.paymentId,
          );

          if (!saved) return;

          saved.status = 'APPROVED';
          saved.displayStatus = 'COMPLETED';
          saved.approvedAt = approvedAt;
          db.ledger.push({
            ledgerId: db.nextId,
            entryType: 'CHARGE',
            amount: saved.amount,
            campaignId: null,
            businessDate: null,
            paymentId: saved.paymentId,
            createdAt: approvedAt,
          });
          db.nextId += 1;
        });
      }

      return ok({
        paymentId: payment.paymentId,
        status: 'APPROVED',
        displayStatus: 'COMPLETED',
        amount: payment.amount,
        chargedPoint: payment.amount,
      });
    },
  ),

  http.get<PaymentParams>('*/v1/owner/payments/:paymentId', ({ params }) => {
    if (!getDb().owner.isLoggedIn) return unauthenticated();

    const payment = findPayment(params.paymentId);

    return payment ? ok(toDetail(payment)) : paymentNotFound();
  }),

  // 결제 내역. 최근 순이고, 결제창에서 승인을 시도하기 전에 닫은 주문은 빠진다
  http.get('*/v1/owner/payments', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const items = db.payments
      .filter(({ status }) => status !== 'REQUESTED')
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
      .map((payment) => ({
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: payment.status,
        displayStatus: payment.displayStatus,
        failureReason: payment.failureReason,
        requestedAt: payment.requestedAt,
        approvedAt: payment.approvedAt,
        canceledAt: payment.canceledAt,
      }));

    return ok(paginate(items, request));
  }),
];
