import { useEffect, useState } from 'react';

import { getPointPolicy } from '@owner/api/points';
import type { ChargePolicy } from '@owner/components/PointChargeSheet/PointChargeSheet';

type PolicyState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; minChargeAmount: number; chargeAmounts: number[] };

// 충전 시트에 넘길 충전 정책(최소 충전 금액, 금액 선택지). 충전 시트를 여는 화면이 함께 쓴다.
// 시트를 바로 열 수 있도록 화면을 열 때 불러온다
export const useChargePolicy = (): ChargePolicy => {
  const [state, setState] = useState<PolicyState>({ status: 'loading' });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getPointPolicy().then((result) => {
      if (!ignore) {
        setState(
          result.ok
            ? { status: 'success', ...result.data }
            : { status: 'error' },
        );
      }
    });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  if (state.status !== 'error') {
    return state;
  }

  return {
    status: 'error',
    onRetry: () => {
      setState({ status: 'loading' });
      setRequestId((id) => id + 1);
    },
  };
};
