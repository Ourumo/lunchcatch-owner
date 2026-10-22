import { ApiError, request } from './client';
import type { ApiResult } from './types';

// 포인트 충전 결제 (docs/requirements-owner.md "포인트 결제"). 1원 = 1포인트
// 주문 생성 → 결제위젯으로 결제 → 성공 주소로 돌아오면 승인 확정 순서로 부른다.
// 금액은 서버가 주문 때 저장한 값으로만 승인하고, 같은 주문으로 다시 승인 확정해도 충전은 한 번이다

// 화면에 보여줄 결제 상태. 서버의 status 대신 이 값을 쓴다
export type PaymentDisplayStatus =
  // 결제창에서 결제 중이거나 승인 확정 전
  | 'IN_PROGRESS'
  // 승인 결과를 아직 확정하지 못함. 결제 상태 조회로 다시 확인한다
  | 'CONFIRMING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// 충전 주문 생성 거절 사유
// 최소 충전 금액보다 적음
export const BELOW_MIN_CHARGE_CODE = 'BILLING-001';
// 충전 상품에 없는 금액
export const NOT_CHARGE_PRODUCT_CODE = 'BILLING-002';
// 확인 중인 결제가 있어 새로 주문할 수 없음
export const PAYMENT_CONFIRMING_CODE = 'BILLING-008';

// 승인 확정 거절 사유
// 결제가 실패했거나 승인 전에 만료됨. 충전되지 않았다
export const PAYMENT_FAILED_CODE = 'BILLING-003';
// 내 결제 중에 없음
export const PAYMENT_NOT_FOUND_CODE = 'BILLING-004';
// 승인 요청이 결제대행사에 가지 않음. 결제 상태 조회로 다시 확인한다
export const PAYMENT_GATEWAY_UNREACHED_CODE = 'BILLING-007';
// 이미 취소된 주문. 다시 충전하려면 새로 주문한다
export const PAYMENT_CANCELLED_CODE = 'BILLING-009';
// 주문 번호가 다르거나 결제 키가 다른 결제에 이미 쓰임
export const PAYMENT_MISMATCH_CODE = 'BILLING-017';

export interface ChargeOrder {
  paymentId: string;
  // 결제위젯에 넘기는 주문 번호
  orderId: string;
  amount: number;
}

export interface ChargeConfirmation {
  displayStatus: PaymentDisplayStatus;
  amount: number;
  // 충전된 포인트. 확정 전(CONFIRMING)에는 0이다
  chargedPoints: number;
}

export interface Payment {
  paymentId: string;
  displayStatus: PaymentDisplayStatus;
  amount: number;
}

type PaymentStatus =
  'REQUESTED' | 'APPROVED' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

// 서버 충전 주문 응답 (POST /v1/owner/payments)
interface PaymentOrderResponse {
  paymentId: number;
  orderId: string;
  amount: number;
}

// 서버 승인 확정 응답 (POST /v1/owner/payments/{paymentId}:confirm).
// 200이면 승인과 충전 완료(또는 이미 승인됨), 202면 아직 확정하지 못함(displayStatus CONFIRMING)
interface PaymentConfirmResponse {
  paymentId: number;
  status: PaymentStatus;
  displayStatus: PaymentDisplayStatus;
  amount: number;
  chargedPoint: number;
}

// 서버 결제 상태 응답 (GET /v1/owner/payments/{paymentId})
interface PaymentDetailResponse {
  paymentId: number;
  orderId: string;
  status: PaymentStatus;
  displayStatus: PaymentDisplayStatus;
  amount: number;
  requestedAt: string;
  approvedAt: string | null;
}

// 서버가 거절했으면 사유 코드를 넘긴다. 응답을 받지 못했으면 code가 없다.
// 안내 문구는 화면이 사유 코드로 정한다
const toFailure = (error: unknown) => ({
  ok: false as const,
  code: error instanceof ApiError ? (error.code ?? undefined) : undefined,
});

// 금액 때문에 거절하면 서버 문구를 그대로 보여준다. 화면에서 충전 상품만 고르게 해 막으므로
// 정책이 바뀐 사이에 주문한 경우처럼 드물게만 온다
const AMOUNT_REJECTED_CODES = [BELOW_MIN_CHARGE_CODE, NOT_CHARGE_PRODUCT_CODE];

// 결제위젯을 열기 전에 충전 주문을 만든다. 받은 orderId와 amount로 결제위젯을 연다
export const createChargeOrder = async (
  amount: number,
): Promise<ApiResult<ChargeOrder>> => {
  try {
    const data = await request<PaymentOrderResponse>('/v1/owner/payments', {
      method: 'POST',
      body: { amount },
    });

    return {
      ok: true,
      data: {
        paymentId: String(data.paymentId),
        orderId: data.orderId,
        amount: data.amount,
      },
    };
  } catch (error) {
    const failure = toFailure(error);

    return error instanceof ApiError &&
      AMOUNT_REJECTED_CODES.includes(failure.code ?? '')
      ? { ...failure, message: error.message }
      : failure;
  }
};

// 결제위젯의 성공 주소로 돌아오면 받은 paymentKey를 pgTid로 승인을 확정한다.
// 결제대행사에 요청이 가지 않았거나(503 BILLING-007) 응답을 받지 못하면 다시 보내지 않고 결제 상태 조회로 확인한다
export const confirmCharge = async (
  paymentId: string,
  { orderId, paymentKey }: { orderId: string; paymentKey: string },
): Promise<ApiResult<ChargeConfirmation>> => {
  try {
    const data = await request<PaymentConfirmResponse>(
      `/v1/owner/payments/${encodeURIComponent(paymentId)}:confirm`,
      { method: 'POST', body: { orderId, pgTid: paymentKey } },
    );

    return {
      ok: true,
      data: {
        displayStatus: data.displayStatus,
        amount: data.amount,
        chargedPoints: data.chargedPoint,
      },
    };
  } catch (error) {
    return toFailure(error);
  }
};

// 결제 한 건의 상태. 승인 확정이 확정 전(CONFIRMING)이거나 응답을 받지 못했을 때 확정될 때까지 다시 확인한다
export const getPayment = async (
  paymentId: string,
): Promise<ApiResult<Payment>> => {
  try {
    const data = await request<PaymentDetailResponse>(
      `/v1/owner/payments/${encodeURIComponent(paymentId)}`,
    );

    return {
      ok: true,
      data: {
        paymentId: String(data.paymentId),
        displayStatus: data.displayStatus,
        amount: data.amount,
      },
    };
  } catch (error) {
    return toFailure(error);
  }
};
