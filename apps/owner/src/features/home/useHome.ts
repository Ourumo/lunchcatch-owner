import { useEffect, useState } from 'react';

import { type Campaign, getCampaigns } from '@owner/api/campaign';
import { getPointBalance } from '@owner/api/points';
import {
  getRecentServingDays,
  type ServingDayPerformance,
} from '@owner/api/report';
import { getMyStore, type MyStore } from '@owner/api/store';

type HomeState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success';
      store: MyStore;
      balance: number;
      campaigns: Campaign[];
      recentDays: ServingDayPerformance[];
    };

// 홈 대시보드에 필요한 가게 정보, 포인트 잔액, 캠페인 목록, 최근 집행일 실적을 불러온다.
// 최근 집행일 실적은 가게 ID와 캠페인 집행 기간이 있어야 해 나머지를 받은 뒤에 부른다
export const useHome = () => {
  const [state, setState] = useState<HomeState>({ status: 'loading' });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getMyStore(), getPointBalance(), getCampaigns()]).then(
      async ([storeResult, balanceResult, campaignsResult]) => {
        if (ignore) {
          return;
        }

        if (!storeResult.ok || !balanceResult.ok || !campaignsResult.ok) {
          setState({ status: 'error' });
          return;
        }

        const recentDaysResult = await getRecentServingDays({
          campaigns: campaignsResult.data,
          storeId: storeResult.data.id,
        });

        if (ignore) {
          return;
        }

        if (!recentDaysResult.ok) {
          setState({ status: 'error' });
          return;
        }

        setState({
          status: 'success',
          store: storeResult.data,
          balance: balanceResult.data.balance,
          campaigns: campaignsResult.data,
          recentDays: recentDaysResult.data,
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
