import { useEffect, useState } from 'react';

import { type Campaign, getCampaigns } from '@owner/api/campaign';
import { getMyStore, type StoreMenu } from '@owner/api/store';

type CampaignListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; campaigns: Campaign[]; menus: StoreMenu[] };

// 캠페인 목록과, 특정 메뉴 할인의 메뉴 이름을 보여주기 위한 가게 메뉴를 함께 불러온다
export const useCampaignList = () => {
  const [state, setState] = useState<CampaignListState>({ status: 'loading' });
  // 값이 바뀌면 목록을 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaigns(), getMyStore()]).then(
      ([campaignsResult, storeResult]) => {
        if (ignore) {
          return;
        }

        if (!campaignsResult.ok || !storeResult.ok) {
          setState({ status: 'error' });
          return;
        }

        setState({
          status: 'success',
          campaigns: campaignsResult.data,
          menus: storeResult.data.menus,
        });
      },
    );

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { retry, state };
};
