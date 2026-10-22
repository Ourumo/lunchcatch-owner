import { useEffect, useRef, useState } from 'react';

import {
  getRefundRequestPage,
  type RefundRequestItem,
} from '@owner/api/refund';

import type { LoadMoreStatus } from './usePointHistory';

export type RefundRequestsState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success';
      items: RefundRequestItem[];
      // 다음 구간을 받을 커서. 마지막까지 받았으면 null
      nextCursor: string | null;
      loadMore: LoadMoreStatus;
    };

// 내 환불 요청을 최신순으로 20건씩 나눠 불러온다. 처음 구간을 받은 뒤 loadMore로 이어 붙인다.
// 새로 요청하면 reload로 처음부터 다시 받아 새 요청을 맨 위에 보여준다
export const useRefundRequests = () => {
  const [state, setState] = useState<RefundRequestsState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);
  // 처음 불러오기를 할 때마다 바뀐다. 이어서 불러온 응답이 그 사이 다시 받은 목록에 붙지 않게 한다
  const generationRef = useRef(0);
  // 이어서 불러오는 요청이 겹치지 않게 막는다. 상태는 다음 렌더링에 바뀌므로 그 사이에 온 요청도 막도록 ref로 둔다
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    let ignore = false;

    generationRef.current += 1;
    isLoadingMoreRef.current = false;

    getRefundRequestPage().then((result) => {
      if (!ignore) {
        setState(
          result.ok
            ? {
                status: 'success',
                items: result.data.items,
                nextCursor: result.data.nextCursor,
                loadMore: 'idle',
              }
            : { status: 'error' },
        );
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [requestId]);

  const reload = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  const loadMore = () => {
    if (
      state.status !== 'success' ||
      !state.nextCursor ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    const generation = generationRef.current;
    const cursor = state.nextCursor;

    isLoadingMoreRef.current = true;
    setState({ ...state, loadMore: 'loading' });

    getRefundRequestPage({ cursor }).then((result) => {
      if (generation !== generationRef.current) {
        return;
      }

      isLoadingMoreRef.current = false;
      setState((prev) => {
        if (prev.status !== 'success') {
          return prev;
        }

        // 요청한 커서가 그대로 돌아오면 같은 구간을 계속 부르게 되므로 실패로 보고 멈춘다
        if (!result.ok || result.data.nextCursor === cursor) {
          return { ...prev, loadMore: 'error' };
        }

        // 커서로 받아 겹치지 않지만, 그 사이 새 요청이 생겨 같은 요청이 다시 와도 두 번 보이지 않게 거른다
        const loadedIds = new Set(prev.items.map(({ id }) => id));

        return {
          ...prev,
          items: [
            ...prev.items,
            ...result.data.items.filter(({ id }) => !loadedIds.has(id)),
          ],
          nextCursor: result.data.nextCursor,
          loadMore: 'idle',
        };
      });
    });
  };

  return { loadMore, reload, state };
};
