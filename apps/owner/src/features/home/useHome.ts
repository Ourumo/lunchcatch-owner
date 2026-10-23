import { useEffect, useState } from 'react';

import { type Campaign, getCampaigns } from '@owner/api/campaign';
import { getPointBalance } from '@owner/api/points';
import {
  getRecentServingDays,
  type ServingDayPerformance,
} from '@owner/api/report';
import { getMyStore, type MyStore } from '@owner/api/store';
import type { ApiResult } from '@owner/api/types';

// 홈의 자리 하나를 불러오는 상태
type LoadState<T> =
  { status: 'loading' } | { status: 'error' } | { status: 'success'; data: T };

const toLoadState = <T>(result: ApiResult<T>): LoadState<T> =>
  result.ok ? { status: 'success', data: result.data } : { status: 'error' };

// 홈 대시보드에 필요한 가게 정보, 포인트 잔액, 캠페인 목록, 최근 집행일 실적을 자리마다 따로 불러온다.
// 하나가 실패해도 나머지 자리는 보여주고, 다시 시도는 실패한 자리만 다시 부른다.
// 최근 집행일 실적은 가게 ID와 캠페인 집행 기간이 있어야 해 둘을 받은 뒤에 부른다
export const useHome = () => {
  const [store, setStore] = useState<LoadState<MyStore>>({
    status: 'loading',
  });
  const [balance, setBalance] = useState<LoadState<number>>({
    status: 'loading',
  });
  const [campaigns, setCampaigns] = useState<LoadState<Campaign[]>>({
    status: 'loading',
  });
  const [recentDays, setRecentDays] = useState<
    LoadState<ServingDayPerformance[]>
  >({ status: 'loading' });
  // 값이 바뀌면 그 자리를 다시 불러온다
  const [storeRequestId, setStoreRequestId] = useState(0);
  const [balanceRequestId, setBalanceRequestId] = useState(0);
  const [campaignsRequestId, setCampaignsRequestId] = useState(0);
  const [recentDaysRequestId, setRecentDaysRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore) {
        setStore(toLoadState(result));
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [storeRequestId]);

  useEffect(() => {
    let ignore = false;

    getPointBalance().then((result) => {
      if (!ignore) {
        setBalance(
          result.ok
            ? { status: 'success', data: result.data.balance }
            : { status: 'error' },
        );
      }
    });

    return () => {
      ignore = true;
    };
  }, [balanceRequestId]);

  useEffect(() => {
    let ignore = false;

    getCampaigns().then((result) => {
      if (!ignore) {
        setCampaigns(toLoadState(result));
      }
    });

    return () => {
      ignore = true;
    };
  }, [campaignsRequestId]);

  const storeId = store.status === 'success' ? store.data.id : null;
  const campaignList = campaigns.status === 'success' ? campaigns.data : null;

  useEffect(() => {
    if (!storeId || !campaignList) {
      return;
    }

    let ignore = false;

    getRecentServingDays({ campaigns: campaignList, storeId }).then(
      (result) => {
        if (!ignore) {
          setRecentDays(toLoadState(result));
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [storeId, campaignList, recentDaysRequestId]);

  const retryBalance = () => {
    setBalance({ status: 'loading' });
    setBalanceRequestId((id) => id + 1);
  };

  // 최근 실적은 캠페인 목록을 받으면 이어서 다시 불러온다
  const retryCampaigns = () => {
    setCampaigns({ status: 'loading' });
    setRecentDays({ status: 'loading' });
    setCampaignsRequestId((id) => id + 1);
  };

  const retryRecentDays = () => {
    setRecentDays({ status: 'loading' });
    setRecentDaysRequestId((id) => id + 1);
  };

  // 가게 정보를 받지 못하면 화면 전체가 오류라, 다시 시도할 때 캠페인과 최근 실적도 다시 부른다.
  // 잔액은 실패했을 때만 다시 부른다
  const retry = () => {
    setStore({ status: 'loading' });
    setStoreRequestId((id) => id + 1);
    retryCampaigns();

    if (balance.status === 'error') {
      retryBalance();
    }
  };

  return {
    balance,
    campaigns,
    recentDays,
    retry,
    retryBalance,
    retryCampaigns,
    retryRecentDays,
    store,
  };
};
