import { useEffect, useState } from 'react';

import {
  type ChargeConfirmation,
  confirmCharge,
  getPayment,
  PAYMENT_CANCELLED_CODE,
  PAYMENT_FAILED_CODE,
  PAYMENT_MISMATCH_CODE,
  PAYMENT_NOT_FOUND_CODE,
  type PaymentDisplayStatus,
} from '@owner/api/payments';
import type { ApiResult } from '@owner/api/types';

// 확정 전(202)이거나 응답을 받지 못했을 때 결제 상태를 다시 확인하는 간격과 횟수 (약 30초)
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_COUNT = 10;

export type ChargeConfirmationState =
  | { status: 'confirming' }
  // 결제 결과를 아직 확정하지 못해 결제 상태를 다시 확인하는 중
  | { status: 'checking' }
  // 다시 확인해도 확정되지 않음. 점주가 직접 다시 확인한다
  | { status: 'unresolved' }
  | { status: 'completed'; chargedPoints: number }
  // 결제 실패, 승인 전 만료, 취소된 주문. 포인트는 충전되지 않았다
  | { status: 'failed' }
  // 주문 번호나 결제 키가 맞지 않거나 내 결제가 아님
  | { status: 'unverifiable' };

export interface ChargePaymentParams {
  paymentId: string;
  orderId: string;
  paymentKey: string;
}

// 개발 모드(StrictMode)에서 화면을 열자마자 효과가 두 번 실행돼도 승인 확정은 한 번만 보낸다.
// 같은 주문으로 다시 보내도 충전은 한 번이지만, 점주가 누르지 않았는데 여러 번 보내지 않는다
const confirmations = new Map<string, Promise<ApiResult<ChargeConfirmation>>>();

const confirmOnce = (
  { orderId, paymentId, paymentKey }: ChargePaymentParams,
  isRetry: boolean,
) => {
  const saved = confirmations.get(paymentKey);

  if (saved && !isRetry) {
    return saved;
  }

  const confirmation = confirmCharge(paymentId, { orderId, paymentKey });

  confirmations.set(paymentKey, confirmation);

  return confirmation;
};

const toFinalState = (
  displayStatus: PaymentDisplayStatus,
  chargedPoints: number,
): ChargeConfirmationState | undefined => {
  if (displayStatus === 'COMPLETED') {
    return { status: 'completed', chargedPoints };
  }

  if (displayStatus === 'FAILED' || displayStatus === 'CANCELLED') {
    return { status: 'failed' };
  }

  return undefined;
};

const FAILED_CODES = [PAYMENT_FAILED_CODE, PAYMENT_CANCELLED_CODE];
const UNVERIFIABLE_CODES = [PAYMENT_MISMATCH_CODE, PAYMENT_NOT_FOUND_CODE];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 결제창의 성공 주소로 돌아오면 승인을 확정하고 충전 결과를 정한다.
// 확정 전(202, CONFIRMING), 결제대행사에 요청이 가지 않음(503 BILLING-007), 응답 없음이면
// 승인 확정을 다시 보내지 않고 결제 상태 조회로 확정될 때까지 확인한다
export const useChargeConfirmation = (params: ChargePaymentParams) => {
  const [state, setState] = useState<ChargeConfirmationState>({
    status: 'confirming',
  });
  // 0이면 처음 확정, 1부터는 점주가 다시 확인을 누른 것
  const [retryCount, setRetryCount] = useState(0);
  const { orderId, paymentId, paymentKey } = params;

  useEffect(() => {
    let ignore = false;

    const checkUntilSettled = async () => {
      setState({ status: 'checking' });

      for (let count = 0; count < MAX_POLL_COUNT; count += 1) {
        await wait(POLL_INTERVAL_MS);

        if (ignore) {
          return;
        }

        const result = await getPayment(paymentId);

        if (ignore) {
          return;
        }

        // 조회하지 못하면 다음 차례에 다시 확인한다
        const finalState =
          result.ok &&
          toFinalState(result.data.displayStatus, result.data.amount);

        if (finalState) {
          setState(finalState);
          return;
        }
      }

      setState({ status: 'unresolved' });
    };

    const confirm = async () => {
      const result = await confirmOnce(
        { orderId, paymentId, paymentKey },
        retryCount > 0,
      );

      if (ignore) {
        return;
      }

      if (result.ok) {
        const finalState = toFinalState(
          result.data.displayStatus,
          result.data.chargedPoints || result.data.amount,
        );

        if (finalState) {
          setState(finalState);
          return;
        }
      } else if (FAILED_CODES.includes(result.code ?? '')) {
        setState({ status: 'failed' });
        return;
      } else if (UNVERIFIABLE_CODES.includes(result.code ?? '')) {
        setState({ status: 'unverifiable' });
        return;
      }

      await checkUntilSettled();
    };

    confirm();

    // 화면을 벗어나면 결과를 버리고 다시 확인을 멈춘다
    return () => {
      ignore = true;
    };
  }, [orderId, paymentId, paymentKey, retryCount]);

  const retry = () => {
    setState({ status: 'confirming' });
    setRetryCount((count) => count + 1);
  };

  return { retry, state };
};
