import { useEffect, useState } from 'react';

import { getCampaigns } from '@owner/api/campaign';
import {
  chargePoints,
  getPointBalance,
  getPointHistory,
  type PointBalance,
  type PointHistoryEntry,
  type PointHistoryFilter,
} from '@owner/api/points';
import { getMyStore } from '@owner/api/store';
import {
  formatPeriod,
  getCampaignTitle,
} from '@owner/components/campaignFormat';

type BalanceState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; balance: PointBalance };

type HistoryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; entries: PointHistoryEntry[] };

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

  useEffect(() => {
    let ignore = false;

    getPointHistory({ campaignId, period }).then((result) => {
      if (!ignore) {
        setHistoryState(
          result.ok
            ? { status: 'success', entries: result.data }
            : { status: 'error' },
        );
      }
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

  // 충전하면 잔액은 결제 응답으로 바로 바꾸고, 내역은 지금 목록을 둔 채 다시 불러와 충전 건을 넣는다
  const charge = async (amount: number) => {
    const result = await chargePoints(amount);

    if (result.ok) {
      setBalanceState({ status: 'success', balance: result.data });
      setHistoryRequestId((id) => id + 1);
    }

    return result;
  };

  return {
    balanceState,
    campaignOptions,
    campaignTitles,
    changeFilter,
    charge,
    filter,
    historyState,
    retryBalance,
    retryHistory,
  };
};
