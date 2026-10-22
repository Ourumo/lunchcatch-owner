import { useEffect, useState } from 'react';

import {
  getRefundRequestPage,
  type RefundRequestItem,
} from '@owner/api/refund';

export type RefundRequestsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: RefundRequestItem[] };

// 내 환불 요청을 최신순으로 불러온다. 새로 요청하면 reload로 처음부터 다시 받아 새 요청을 맨 위에 보여준다
export const useRefundRequests = () => {
  const [state, setState] = useState<RefundRequestsState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getRefundRequestPage().then((result) => {
      if (!ignore) {
        setState(
          result.ok
            ? { status: 'success', items: result.data.items }
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

  return { reload, state };
};
