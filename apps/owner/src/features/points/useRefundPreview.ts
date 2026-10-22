import { useEffect, useState } from 'react';

import { getRefundPreview, type RefundPreview } from '@owner/api/refund';

type RefundPreviewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; preview: RefundPreview };

// 환불 미리보기를 불러온다. 요청 뒤나 요청이 거절된 뒤에는 reload로 다시 받는다
export const useRefundPreview = () => {
  const [state, setState] = useState<RefundPreviewState>({
    status: 'loading',
  });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getRefundPreview().then((result) => {
      if (!ignore) {
        setState(
          result.ok
            ? { status: 'success', preview: result.data }
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
