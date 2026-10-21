import { useEffect, useState } from 'react';
import {
  ANONYMOUS,
  loadTossPayments,
  type TossPaymentsWidgets,
} from '@tosspayments/tosspayments-sdk';

// 결제위젯을 그릴 자리
export const PAYMENT_METHOD_ELEMENT_ID = 'payment-method';
export const PAYMENT_AGREEMENT_ELEMENT_ID = 'payment-agreement';

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY;

type WidgetState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      widgets: TossPaymentsWidgets;
      // 필수 약관에 모두 동의했는지. 동의하지 않으면 결제를 요청하지 않는다
      hasAgreed: boolean;
    };

// 위젯을 그리고 지우는 일이 겹치지 않도록 차례로 한다.
// 개발 모드(StrictMode)에서는 화면을 열자마자 한 번 지웠다 다시 그리므로, 지우기 전에 다시 그리면 같은 자리에 위젯이 둘이 된다
let widgetTask: Promise<unknown> = Promise.resolve();

const enqueue = <T>(task: () => Promise<T>) => {
  const next = widgetTask.then(task);

  widgetTask = next.catch(() => undefined);

  return next;
};

// 토스페이먼츠 결제위젯(결제수단, 약관)을 그린다. 금액이 바뀌면 다시 그린다.
// 비회원 결제(ANONYMOUS)로 연다. 점주별 결제수단 저장(브랜드페이)은 쓰지 않는다
export const useTossPaymentWidget = (amount: number) => {
  const [state, setState] = useState<WidgetState>({ status: 'loading' });
  // 값이 바뀌면 다시 그린다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;
    const destroyers: (() => Promise<void>)[] = [];
    const destroyAll = () =>
      Promise.allSettled(destroyers.map((destroy) => destroy()));

    enqueue(async () => {
      if (ignore) {
        return;
      }

      if (!CLIENT_KEY) {
        throw new Error('VITE_TOSS_CLIENT_KEY가 없습니다');
      }

      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });

      await widgets.setAmount({ currency: 'KRW', value: amount });

      const paymentMethod = await widgets.renderPaymentMethods({
        selector: `#${PAYMENT_METHOD_ELEMENT_ID}`,
        variantKey: 'DEFAULT',
      });
      destroyers.push(() => paymentMethod.destroy());

      const agreement = await widgets.renderAgreement({
        selector: `#${PAYMENT_AGREEMENT_ELEMENT_ID}`,
        variantKey: 'AGREEMENT',
      });
      destroyers.push(() => agreement.destroy());

      if (ignore) {
        await destroyAll();
        return;
      }

      agreement.on('agreementStatusChange', ({ agreedRequiredTerms }) => {
        setState((prev) =>
          prev.status === 'ready'
            ? { ...prev, hasAgreed: agreedRequiredTerms }
            : prev,
        );
      });
      // 약관은 처음에 모두 동의한 상태로 그려진다
      setState({ status: 'ready', widgets, hasAgreed: true });
    }).catch(async () => {
      await destroyAll();

      if (!ignore) {
        setState({ status: 'error' });
      }
    });

    return () => {
      ignore = true;
      enqueue(destroyAll);
    };
  }, [amount, requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { retry, state };
};
