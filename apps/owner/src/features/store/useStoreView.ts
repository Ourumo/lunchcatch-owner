import { useEffect, useState } from 'react';

import { getMyStore, type MyStore } from '@owner/api/store';
import { useGoBack } from '@owner/hooks/useGoBack';

import { STORE_PATH } from './storePaths';

type StoreLoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; store: MyStore };

// 매장 사진, 대표 메뉴 보기 화면이 같이 쓰는 상태. 가게 정보를 불러오기만 하고 고치지 않는다
export const useStoreView = () => {
  const goBack = useGoBack(STORE_PATH);
  const [state, setState] = useState<StoreLoadState>({ status: 'loading' });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore) {
        setState(
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
  }, [requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { goBack, retry, state };
};

export type StoreView = ReturnType<typeof useStoreView>;
