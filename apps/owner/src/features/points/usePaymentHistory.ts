import { useEffect, useRef, useState } from 'react';

import {
  getPaymentHistoryPage,
  type PaymentHistoryItem,
} from '@owner/api/payments';
import type { LoadMoreStatus } from '@owner/ui/LoadMoreFooter/LoadMoreFooter';

type PaymentHistoryState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success';
      items: PaymentHistoryItem[];
      // 다음 구간을 받을 커서. 마지막까지 받았으면 null
      nextCursor: string | null;
      loadMore: LoadMoreStatus;
    };

// 결제 내역을 최근 순으로 20건씩 나눠 불러온다. 처음 구간을 받은 뒤 loadMore로 이어 붙인다
export const usePaymentHistory = () => {
  const [state, setState] = useState<PaymentHistoryState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);
  // 이어서 불러오는 요청이 겹치지 않게 막는다. 상태는 다음 렌더링에 바뀌므로 그 사이에 온 요청도 막도록 ref로 둔다
  const isLoadingMoreRef = useRef(false);
  // 화면을 벗어난 뒤 온 응답은 버린다
  const ignoreRef = useRef(false);

  useEffect(() => {
    ignoreRef.current = false;

    return () => {
      ignoreRef.current = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    getPaymentHistoryPage().then((result) => {
      if (ignore) {
        return;
      }

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

  const loadMore = () => {
    if (
      state.status !== 'success' ||
      !state.nextCursor ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    setState({ ...state, loadMore: 'loading' });

    getPaymentHistoryPage({ cursor: state.nextCursor }).then((result) => {
      isLoadingMoreRef.current = false;

      if (ignoreRef.current) {
        return;
      }

      setState((prev) => {
        if (prev.status !== 'success') {
          return prev;
        }

        // 이어서 불러오다 실패해도 이미 불러온 내역은 그대로 둔다
        if (!result.ok) {
          return { ...prev, loadMore: 'error' };
        }

        // 커서로 받아 겹치지 않지만, 그 사이 새 결제가 생겨 같은 결제가 다시 와도 두 번 보이지 않게 거른다
        const loadedIds = new Set(prev.items.map(({ paymentId }) => paymentId));

        return {
          ...prev,
          items: [
            ...prev.items,
            ...result.data.items.filter(
              ({ paymentId }) => !loadedIds.has(paymentId),
            ),
          ],
          nextCursor: result.data.nextCursor,
          loadMore: 'idle',
        };
      });
    });
  };

  return { loadMore, retry, state };
};
