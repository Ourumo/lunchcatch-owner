import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Toast } from '@repo/ui';

import {
  type ChargeOrder,
  createChargeOrder,
  PAYMENT_CONFIRMING_CODE,
} from '@owner/api/payments';
import type { ApiResult } from '@owner/api/types';
import { useGoBack } from '@owner/hooks/useGoBack';
import {
  getReturnPath,
  POINT_CHARGE_FAIL_PATH,
  POINT_CHARGE_SUCCESS_PATH,
} from '@owner/hooks/usePointCharge';
import { formatNumber, formatPoints } from '@owner/ui/campaignFormat';
import { StepActionBar } from '@owner/ui/StepActionBar/StepActionBar';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import {
  PAYMENT_AGREEMENT_ELEMENT_ID,
  PAYMENT_METHOD_ELEMENT_ID,
  useTossPaymentWidget,
} from './useTossPaymentWidget';

const START_FAILED_MESSAGE = '잠시 후 다시 시도해 주세요.';

// 결제창에서 점주가 직접 닫은 경우. 안내 없이 결제 화면에 남는다
const USER_CANCEL_CODE = 'USER_CANCEL';

const getOrderErrorMessage = (
  result: Extract<ApiResult<ChargeOrder>, { ok: false }>,
) => {
  if (result.code === PAYMENT_CONFIRMING_CODE) {
    return '확인 중인 결제가 있어 지금은 충전할 수 없어요. 잠시 후 다시 충전해 주세요.';
  }

  // 금액 거절(BILLING-001, 002)은 서버 문구를 그대로 보여준다
  return result.message ?? START_FAILED_MESSAGE;
};

// 결제위젯이 결제창을 열기 전에 거절한 경우. 토스 문구가 점주에게 바로 보여줄 수 있는 문장이라 그대로 쓴다
const getWidgetError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return START_FAILED_MESSAGE;
  }

  if ('code' in error && error.code === USER_CANCEL_CODE) {
    return undefined;
  }

  return 'message' in error && typeof error.message === 'string'
    ? error.message
    : START_FAILED_MESSAGE;
};

// 주소의 금액. 정수가 아니면 충전 시트를 거치지 않고 들어온 것으로 보고 결제하지 않는다
const parseAmount = (value: string | null) => {
  const amount = Number(value);

  return Number.isSafeInteger(amount) && amount > 0 ? amount : undefined;
};

interface CheckoutProps {
  amount: number;
  returnTo: string;
  onBack: () => void;
}

const Checkout = ({ amount, onBack, returnTo }: CheckoutProps) => {
  const { retry, state } = useTossPaymentWidget(amount);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  // 결제창을 열기 직전에 충전 주문을 만든다. 결제 화면에서 나가기만 하면 주문이 남지 않는다.
  // 결제를 마치면 토스가 성공·실패 주소로 페이지를 옮기므로, 승인 확정에 쓸 주문과 돌아갈 화면을 주소에 담는다
  const handlePay = async () => {
    if (state.status !== 'ready' || isPaying) {
      return;
    }

    setIsPaying(true);
    setErrorMessage(undefined);

    const order = await createChargeOrder(amount);

    if (!order.ok) {
      setIsPaying(false);
      setErrorMessage(getOrderErrorMessage(order));
      return;
    }

    const params = new URLSearchParams({
      paymentId: order.data.paymentId,
      returnTo,
    });

    try {
      // 서버가 저장한 금액으로 승인하므로 결제창도 그 금액으로 연다
      if (order.data.amount !== amount) {
        await state.widgets.setAmount({
          currency: 'KRW',
          value: order.data.amount,
        });
      }

      await state.widgets.requestPayment({
        orderId: order.data.orderId,
        orderName: `런치캐치 포인트 ${formatPoints(order.data.amount)}`,
        successUrl: `${window.location.origin}${POINT_CHARGE_SUCCESS_PATH}?${params}`,
        failUrl: `${window.location.origin}${POINT_CHARGE_FAIL_PATH}?${params}`,
      });
      // 결제창이 페이지를 옮기므로 결제 중 상태를 풀지 않는다
    } catch (error) {
      setIsPaying(false);
      setErrorMessage(getWidgetError(error));
    }
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={onBack} title="포인트 충전" />
      </div>
      <main className="flex flex-1 flex-col gap-4 pt-5 pb-6">
        <dl className="mx-page flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-surface p-4 type-body-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">결제 금액</dt>
            <dd className="font-bold text-text-primary">
              {formatNumber(amount)}원
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">충전 포인트</dt>
            <dd className="font-bold text-text-primary">
              {formatPoints(amount)}
            </dd>
          </div>
          <p className="type-caption text-text-secondary">
            1원 = 1포인트로 충전돼요.
          </p>
        </dl>

        {state.status === 'loading' && (
          <p
            className="py-6 text-center type-body-sm text-text-secondary"
            role="status"
          >
            결제수단을 불러오는 중이에요
          </p>
        )}
        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="type-body-sm text-text-secondary">
              결제수단을 불러오지 못했어요
            </p>
            <Button onClick={retry} variant="secondary">
              다시 시도
            </Button>
          </div>
        )}
        {/* 결제위젯이 그려질 자리. 불러오는 동안에도 자리가 있어야 그릴 수 있어 늘 둔다 */}
        <section aria-label="결제수단" className="bg-bg-surface">
          <div id={PAYMENT_METHOD_ELEMENT_ID} />
          <div id={PAYMENT_AGREEMENT_ELEMENT_ID} />
        </section>

        {errorMessage && (
          <div className="px-page">
            <Toast
              description={errorMessage}
              style={{ maxWidth: 'none' }}
              title="결제를 시작하지 못했어요"
              variant="danger"
            />
          </div>
        )}
      </main>
      <StepActionBar
        hint={
          state.status === 'ready' && !state.hasAgreed
            ? '필수 약관에 동의하면 결제할 수 있어요'
            : undefined
        }
        isNextDisabled={state.status !== 'ready' || !state.hasAgreed}
        isNextLoading={isPaying}
        nextLabel={`${formatNumber(amount)}원 결제하기`}
        onNext={handlePay}
      />
    </>
  );
};

// 포인트 충전 결제 화면. 충전 시트에서 고른 금액으로 토스페이먼츠 결제위젯을 띄운다.
// 금액과 돌아갈 화면은 주소로 받는다 (hooks/usePointCharge)
export const PointCheckout = () => {
  const [searchParams] = useSearchParams();
  const amount = parseAmount(searchParams.get('amount'));
  const returnTo = getReturnPath(searchParams.get('returnTo'));
  // 충전 시트를 연 화면으로 돌아간다. 주소로 바로 들어왔으면 돌아갈 화면으로 간다
  const goBack = useGoBack(returnTo);

  if (amount === undefined) {
    return (
      <>
        <TopBar onBack={goBack} title="포인트 충전" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
          <p className="text-body-mobile font-bold text-text-primary">
            충전 금액을 확인하지 못했어요
          </p>
          <p className="text-body-sm-mobile text-text-secondary">
            충전할 금액을 다시 골라 주세요
          </p>
          <Button className="mt-2" onClick={goBack} variant="secondary">
            돌아가기
          </Button>
        </main>
      </>
    );
  }

  return <Checkout amount={amount} onBack={goBack} returnTo={returnTo} />;
};
