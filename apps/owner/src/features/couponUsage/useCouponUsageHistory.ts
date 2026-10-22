import { useEffect, useRef, useState } from 'react';

import {
  type CouponUsage,
  type CouponUsagePage,
  getCouponUsagePage,
} from '@owner/api/couponUsage';
import type { PointHistoryPeriod } from '@owner/api/points';
import { getMyStore } from '@owner/api/store';
import type { ApiResult } from '@owner/api/types';

type CouponUsageHistoryState =
  | { status: 'loading' }
  // 조회 권한이 없으면(403) 다시 시도해도 같아 따로 둔다
  | { status: 'error'; isForbidden: boolean }
  | { status: 'success'; usages: CouponUsage[] };

// 가게의 쿠폰 사용 이력을 기간별로 불러온다. 기간을 바꾸면 처음부터 다시 부른다.
// 가게 ID는 처음 한 번 받아 두고 기간을 바꿀 때는 다시 받지 않는다
export const useCouponUsageHistory = (initialPeriod: PointHistoryPeriod) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [state, setState] = useState<CouponUsageHistoryState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);
  const storeIdRef = useRef<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const load = async (): Promise<ApiResult<CouponUsagePage>> => {
      if (storeIdRef.current === null) {
        const storeResult = await getMyStore();

        if (!storeResult.ok) {
          return { ok: false };
        }

        storeIdRef.current = storeResult.data.id;
      }

      return getCouponUsagePage({ storeId: storeIdRef.current, period });
    };

    load().then((result) => {
      if (ignore) {
        return;
      }

      setState(
        result.ok
          ? { status: 'success', usages: result.data.usages }
          : { status: 'error', isForbidden: result.code === 'FORBIDDEN' },
      );
    });

    // 응답 전에 화면을 벗어나거나 기간을 바꾸면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [period, requestId]);

  const changePeriod = (nextPeriod: PointHistoryPeriod) => {
    if (nextPeriod === period) {
      return;
    }

    setState({ status: 'loading' });
    setPeriod(nextPeriod);
  };

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { changePeriod, period, retry, state };
};
