import { useEffect, useRef, useState } from 'react';

import { getCampaigns } from '@owner/api/campaign';
import {
  getPointBalance,
  getPointHistoryPage,
  getTodaySpentPoints,
  type PointBalance,
  type PointHistoryEntry,
  type PointHistoryFilter,
} from '@owner/api/points';
import { getMyStore } from '@owner/api/store';
import { formatPeriod, getCampaignTitle } from '@owner/ui/campaignFormat';

type BalanceState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; balance: PointBalance };

// 이어서 불러오기 상태. 처음 불러오기와 따로 두어 실패해도 이미 불러온 내역은 그대로 둔다
export type LoadMoreStatus = 'idle' | 'loading' | 'error';

type HistoryState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success';
      entries: PointHistoryEntry[];
      // 다음 구간을 받을 커서. 마지막까지 받았으면 null
      nextCursor: string | null;
      // 오늘 캠페인별 소진 포인트. 받지 못했으면 null
      todaySpent: Record<string, number> | null;
      loadMore: LoadMoreStatus;
    };

interface CampaignFilterOption {
  id: string;
  label: string;
}

// 쿠폰 조건이 같은 캠페인은 이름이 겹치므로 집행 기간을 붙인다
const formatCampaignOption = (
  title: string,
  startDate: string,
  endDate: string,
) => `${title} · ${formatPeriod(startDate, endDate)}`;

// 포인트 내역 화면에 필요한 잔액, 내역, 캠페인 이름을 따로 불러온다.
// 잔액과 내역은 실패해도 서로의 화면을 막지 않도록 상태를 나눈다
export const usePointHistory = (initialFilter: PointHistoryFilter) => {
  const [filter, setFilter] = useState(initialFilter);
  const [balanceState, setBalanceState] = useState<BalanceState>({
    status: 'loading',
  });
  const [historyState, setHistoryState] = useState<HistoryState>({
    status: 'loading',
  });
  // 캠페인 ID별 이름. 캠페인 이름은 따로 저장하지 않아 쿠폰 조건과 가게 메뉴로 만든다.
  // 불러오지 못해도 내역은 보여주고 이름 자리에 "캠페인"을 쓴다
  const [campaignTitles, setCampaignTitles] = useState<Record<string, string>>(
    {},
  );
  // 캠페인 필터의 선택지. 집행된 적 있는 캠페인(진행 중, 중단, 종료)만 내역이 있어 이것만 둔다
  const [campaignOptions, setCampaignOptions] = useState<
    CampaignFilterOption[]
  >([]);
  // 값이 바뀌면 다시 불러온다
  const [balanceRequestId, setBalanceRequestId] = useState(0);
  const [historyRequestId, setHistoryRequestId] = useState(0);
  // 처음 불러오기를 할 때마다 바뀐다. 이어서 불러온 응답이 그 사이 바뀐 조건의 목록에 붙지 않게 한다
  const historyGenerationRef = useRef(0);
  // 이어서 불러오는 요청이 겹치지 않게 막는다. 상태는 다음 렌더링에 바뀌므로 그 사이에 온 요청도 막도록 ref로 둔다
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    let ignore = false;

    getPointBalance().then((result) => {
      if (!ignore) {
        setBalanceState(
          result.ok
            ? { status: 'success', balance: result.data }
            : { status: 'error' },
        );
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [balanceRequestId]);

  const { campaignId, period } = filter;

  // 내역 첫 구간과 오늘 소진 집계를 함께 받는다. 소진 집계는 받지 못해도 내역은 보여준다
  useEffect(() => {
    let ignore = false;

    historyGenerationRef.current += 1;
    isLoadingMoreRef.current = false;

    Promise.all([
      getPointHistoryPage({ campaignId, period }),
      getTodaySpentPoints(campaignId),
    ]).then(([pageResult, spentResult]) => {
      if (ignore) {
        return;
      }

      setHistoryState(
        pageResult.ok
          ? {
              status: 'success',
              entries: pageResult.data.entries,
              nextCursor: pageResult.data.nextCursor,
              todaySpent: spentResult.ok ? spentResult.data : null,
              loadMore: 'idle',
            }
          : { status: 'error' },
      );
    });

    return () => {
      ignore = true;
    };
  }, [campaignId, period, historyRequestId]);

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaigns(), getMyStore()]).then(
      ([campaignsResult, storeResult]) => {
        if (ignore || !campaignsResult.ok || !storeResult.ok) {
          return;
        }

        const campaigns = campaignsResult.data.map((campaign) => ({
          ...campaign,
          title: getCampaignTitle(campaign.coupon, storeResult.data.menus),
        }));

        setCampaignTitles(
          Object.fromEntries(campaigns.map(({ id, title }) => [id, title])),
        );
        setCampaignOptions(
          campaigns
            .filter(
              ({ status }) => status !== 'DRAFT' && status !== 'SCHEDULED',
            )
            .map(({ budget, id, title }) => ({
              id,
              label: formatCampaignOption(
                title,
                budget.startDate,
                budget.endDate,
              ),
            })),
        );
      },
    );

    return () => {
      ignore = true;
    };
  }, []);

  // 원장 조회 실패 뒤 다시 시도할 때는 이전 잔액을 보여주지 않고 불러오는 중으로 바꾼다
  const retryBalance = () => {
    setBalanceState({ status: 'loading' });
    setBalanceRequestId((id) => id + 1);
  };

  // 필터를 바꾸면 이전 조건의 목록을 지우고 새 조건으로 불러온다.
  // 같은 값을 다시 고르면 다시 불러오지 않으므로 불러오는 중으로 바꾸지 않는다
  const changeFilter = (patch: Partial<PointHistoryFilter>) => {
    const nextFilter = { ...filter, ...patch };

    if (
      nextFilter.campaignId === filter.campaignId &&
      nextFilter.period === filter.period
    ) {
      return;
    }

    setHistoryState({ status: 'loading' });
    setFilter(nextFilter);
  };

  const retryHistory = () => {
    setHistoryState({ status: 'loading' });
    setHistoryRequestId((id) => id + 1);
  };

  // 다음 구간을 이어 붙인다. 같은 날 예약과 예약 해제가 두 구간에 걸치면 화면이 이어 붙인 목록으로 다시 묶는다
  const loadMoreHistory = () => {
    if (
      historyState.status !== 'success' ||
      !historyState.nextCursor ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    const generation = historyGenerationRef.current;
    const cursor = historyState.nextCursor;

    isLoadingMoreRef.current = true;
    setHistoryState({ ...historyState, loadMore: 'loading' });

    getPointHistoryPage({
      campaignId,
      cursor,
      period,
    }).then((result) => {
      if (generation !== historyGenerationRef.current) {
        return;
      }

      isLoadingMoreRef.current = false;
      setHistoryState((prev) => {
        if (prev.status !== 'success') {
          return prev;
        }

        // 요청한 커서가 그대로 돌아오면 같은 구간을 계속 부르게 되므로 실패로 보고 멈춘다
        if (!result.ok || result.data.nextCursor === cursor) {
          return { ...prev, loadMore: 'error' };
        }

        // 커서로 받아 겹치지 않지만, 혹시 같은 내역이 다시 와도 두 번 보이지 않게 거른다
        const loadedIds = new Set(prev.entries.map(({ id }) => id));

        return {
          ...prev,
          entries: [
            ...prev.entries,
            ...result.data.entries.filter(({ id }) => !loadedIds.has(id)),
          ],
          nextCursor: result.data.nextCursor,
          loadMore: 'idle',
        };
      });
    });
  };

  return {
    balanceState,
    campaignOptions,
    campaignTitles,
    changeFilter,
    filter,
    historyState,
    loadMoreHistory,
    retryBalance,
    retryHistory,
  };
};
