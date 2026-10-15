import { useEffect, useRef, useState } from 'react';

import { type Campaign, getEndedCampaignPage } from '@owner/api/campaign';
import { getMyStore, type StoreMenu } from '@owner/api/store';

// 이어서 불러오기 상태. 처음 불러오기와 따로 두어 실패해도 이미 불러온 목록은 그대로 둔다
export type LoadMoreStatus = 'idle' | 'loading' | 'error';

export type EndedCampaignListState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success';
      campaigns: Campaign[];
      // 특정 메뉴 할인의 메뉴 이름을 보여주기 위한 가게 메뉴
      menus: StoreMenu[];
      // 다음 구간을 받을 커서. 마지막까지 받았으면 null
      nextCursor: string | null;
      loadMore: LoadMoreStatus;
    };

// 지난 캠페인 전체 목록을 20건씩 나눠 불러온다. 처음 구간과 가게 메뉴를 함께 받고, 그다음은 loadMore로 이어 붙인다
export const useEndedCampaignList = () => {
  const [state, setState] = useState<EndedCampaignListState>({
    status: 'loading',
  });
  // 값이 바뀌면 처음부터 다시 불러온다
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

    Promise.all([getEndedCampaignPage(), getMyStore()]).then(
      ([pageResult, storeResult]) => {
        if (ignore) {
          return;
        }

        if (!pageResult.ok || !storeResult.ok) {
          setState({ status: 'error' });
          return;
        }

        setState({
          status: 'success',
          campaigns: pageResult.data.campaigns,
          menus: storeResult.data.menus,
          nextCursor: pageResult.data.nextCursor,
          loadMore: 'idle',
        });
      },
    );

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

    getEndedCampaignPage({ cursor: state.nextCursor }).then((result) => {
      isLoadingMoreRef.current = false;

      if (ignoreRef.current) {
        return;
      }

      setState((prev) => {
        if (prev.status !== 'success') {
          return prev;
        }

        if (!result.ok) {
          return { ...prev, loadMore: 'error' };
        }

        // 커서로 받아 겹치지 않지만, 혹시 같은 캠페인이 다시 와도 두 번 보이지 않게 거른다
        const loadedIds = new Set(prev.campaigns.map(({ id }) => id));

        return {
          ...prev,
          campaigns: [
            ...prev.campaigns,
            ...result.data.campaigns.filter(({ id }) => !loadedIds.has(id)),
          ],
          nextCursor: result.data.nextCursor,
          loadMore: 'idle',
        };
      });
    });
  };

  return { loadMore, retry, state };
};
