import { useEffect, useState } from 'react';

import { getPointBalance } from '@owner/api/points';
import { getMyStore, type MyStore } from '@owner/api/store';

type StoreState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; store: MyStore };

type BalanceState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; balance: number };

// 가게 관리 화면에 필요한 가게 정보와 포인트 잔액을 따로 불러온다.
// 잔액만 실패해도 나머지 메뉴와 로그아웃은 쓸 수 있도록 잔액 실패는 잔액 줄에만 보여주고 따로 다시 부른다
export const useStoreManagement = () => {
  const [storeState, setStoreState] = useState<StoreState>({
    status: 'loading',
  });
  const [balanceState, setBalanceState] = useState<BalanceState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [storeRequestId, setStoreRequestId] = useState(0);
  const [balanceRequestId, setBalanceRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore) {
        setStoreState(
          result.ok
            ? { status: 'success', store: result.data }
            : { status: 'error' },
        );
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [storeRequestId]);

  useEffect(() => {
    let ignore = false;

    getPointBalance().then((result) => {
      if (!ignore) {
        setBalanceState(
          result.ok
            ? { status: 'success', balance: result.data.balance }
            : { status: 'error' },
        );
      }
    });

    return () => {
      ignore = true;
    };
  }, [balanceRequestId]);

  const retry = () => {
    setStoreState({ status: 'loading' });
    setStoreRequestId((id) => id + 1);
  };

  const retryBalance = () => {
    setBalanceState({ status: 'loading' });
    setBalanceRequestId((id) => id + 1);
  };

  return { balanceState, retry, retryBalance, storeState };
};
