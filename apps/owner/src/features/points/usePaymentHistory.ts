import { useEffect, useState } from 'react';

import {
  getPaymentHistoryPage,
  type PaymentHistoryItem,
} from '@owner/api/payments';

type PaymentHistoryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: PaymentHistoryItem[] };

// 결제 내역을 최근 순으로 불러온다
export const usePaymentHistory = () => {
  const [state, setState] = useState<PaymentHistoryState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getPaymentHistoryPage().then((result) => {
      if (ignore) {
        return;
      }

      setState(
        result.ok
          ? { status: 'success', items: result.data.items }
          : { status: 'error' },
      );
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { retry, state };
};
