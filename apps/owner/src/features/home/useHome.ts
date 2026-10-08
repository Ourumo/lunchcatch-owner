import { useEffect, useState } from 'react';

import { getPointBalance } from '@owner/api/points';
import { getMyStore, type MyStore } from '@owner/api/store';

type HomeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; store: MyStore; balance: number };

// 홈 대시보드에 필요한 가게 정보와 포인트 잔액을 함께 불러온다
export const useHome = () => {
  const [state, setState] = useState<HomeState>({ status: 'loading' });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getMyStore(), getPointBalance()]).then(
      ([storeResult, balanceResult]) => {
        if (ignore) {
          return;
        }

        if (!storeResult.ok || !balanceResult.ok) {
          setState({ status: 'error' });
          return;
        }

        setState({
          status: 'success',
          store: storeResult.data,
          balance: balanceResult.data.balance,
        });
      },
    );

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  // 충전하면 다시 불러오지 않고 결제 응답의 잔액으로 바로 바꾼다
  const updateBalance = (balance: number) => {
    setState((prev) =>
      prev.status === 'success' ? { ...prev, balance } : prev,
    );
  };

  return { retry, state, updateBalance };
};
