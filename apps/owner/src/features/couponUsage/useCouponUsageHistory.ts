import { useEffect, useRef, useState } from 'react';

import {
  type CouponUsage,
  type CouponUsagePage,
  getCouponUsagePage,
} from '@owner/api/couponUsage';
import type { PointHistoryPeriod } from '@owner/api/points';
import { getMyStore } from '@owner/api/store';
import type { ApiResult } from '@owner/api/types';
import type { LoadMoreStatus } from '@owner/ui/LoadMoreFooter/LoadMoreFooter';

type CouponUsageHistoryState =
  | { status: 'loading' }
  // 조회 권한이 없으면(403) 다시 시도해도 같아 따로 둔다
  | { status: 'error'; isForbidden: boolean }
  | {
      status: 'success';
      usages: CouponUsage[];
      // 다음 구간을 받을 커서. 마지막까지 받았으면 null
      nextCursor: string | null;
      loadMore: LoadMoreStatus;
    };

// 가게의 쿠폰 사용 이력을 기간별로 20건씩 나눠 불러온다. 기간을 바꾸면 처음부터 다시 부르고, 그다음은 loadMore로 이어 붙인다.
// 가게 ID는 처음 한 번 받아 두고 기간을 바꿀 때는 다시 받지 않는다
export const useCouponUsageHistory = (initialPeriod: PointHistoryPeriod) => {
  const [period, setPeriod] = useState(initialPeriod);
  const [state, setState] = useState<CouponUsageHistoryState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);
  const storeIdRef = useRef<string | null>(null);
  // 처음 불러오기를 할 때마다 바뀐다. 이어서 불러온 응답이 그 사이 바뀐 기간의 목록에 붙지 않게 한다
  const generationRef = useRef(0);
  // 이어서 불러오는 요청이 겹치지 않게 막는다. 상태는 다음 렌더링에 바뀌므로 그 사이에 온 요청도 막도록 ref로 둔다
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    let ignore = false;

    generationRef.current += 1;
    isLoadingMoreRef.current = false;

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
          ? {
              status: 'success',
              usages: result.data.usages,
              nextCursor: result.data.nextCursor,
              loadMore: 'idle',
            }
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

  const loadMore = () => {
    if (
      state.status !== 'success' ||
      !state.nextCursor ||
      isLoadingMoreRef.current ||
      storeIdRef.current === null
    ) {
      return;
    }

    const generation = generationRef.current;
    const cursor = state.nextCursor;

    isLoadingMoreRef.current = true;
    setState({ ...state, loadMore: 'loading' });

    getCouponUsagePage({ cursor, period, storeId: storeIdRef.current }).then(
      (result) => {
        if (generation !== generationRef.current) {
          return;
        }

        isLoadingMoreRef.current = false;
        setState((prev) => {
          if (prev.status !== 'success') {
            return prev;
          }

          // 그 사이 조회 권한이 없어졌으면 다시 시도해도 같아 처음 불러오기와 같은 안내로 바꾼다
          if (!result.ok && result.code === 'FORBIDDEN') {
            return { status: 'error', isForbidden: true };
          }

          // 요청한 커서가 그대로 돌아오면 같은 구간을 계속 부르게 되므로 실패로 보고 멈춘다
          if (!result.ok || result.data.nextCursor === cursor) {
            return { ...prev, loadMore: 'error' };
          }

          // 커서로 받아 겹치지 않지만, 혹시 같은 이력이 다시 와도 두 번 보이지 않게 거른다
          const loadedIds = new Set(prev.usages.map(({ id }) => id));

          return {
            ...prev,
            usages: [
              ...prev.usages,
              ...result.data.usages.filter(({ id }) => !loadedIds.has(id)),
            ],
            nextCursor: result.data.nextCursor,
            loadMore: 'idle',
          };
        });
      },
    );
  };

  return { changePeriod, loadMore, period, retry, state };
};
