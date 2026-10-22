import { useEffect, useState } from 'react';

import {
  type Campaign,
  getCampaignPerformance,
  getCampaignTodayPerformance,
  getCampaignTotalPerformance,
} from '@owner/api/campaign';
import type { ApiResult } from '@owner/api/types';
import type { TodayPerformanceState } from '@owner/ui/CurrentCampaignCard/CurrentCampaignCard';

type PerformanceTarget = Pick<Campaign, 'id' | 'status' | 'budget'>;

export type PerformanceState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  // 아직 집행 전이거나 오늘이 집행 대상이 아니면 data가 null이다
  | { status: 'success'; data: T };

// 캠페인 성과를 캠페인 조회와 따로 불러온다. 성과를 못 받아도 캠페인 정보는 그대로 보여주고,
// 성과 영역만 다시 시도할 수 있게 retry를 함께 돌려준다
const usePerformance = <T>(
  load: (campaign: PerformanceTarget) => Promise<ApiResult<T>>,
  campaign: PerformanceTarget,
) => {
  // 받은 결과를 어느 요청의 것인지와 함께 둔다
  const [result, setResult] = useState<{
    requestKey: string;
    state: PerformanceState<T>;
  }>();
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);
  const { id, status } = campaign;
  const { dailyBudget, endDate, startDate } = campaign.budget;
  // 캠페인 값이 바뀌거나 다시 시도하면 달라진다
  const requestKey = [id, status, dailyBudget, startDate, endDate, requestId]
    .map(String)
    .join('|');

  useEffect(() => {
    let ignore = false;

    load({ id, status, budget: { dailyBudget, endDate, startDate } }).then(
      (response) => {
        if (!ignore) {
          setResult({
            requestKey,
            state: response.ok
              ? { status: 'success', data: response.data }
              : { status: 'error' },
          });
        }
      },
    );

    // 응답 전에 화면을 벗어나거나 캠페인이 바뀌면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [load, id, status, dailyBudget, endDate, startDate, requestKey]);

  // 지금 요청의 결과가 오기 전에는 이전 캠페인이나 이전 시도의 결과를 보여주지 않는다
  const state: PerformanceState<T> =
    result?.requestKey === requestKey ? result.state : { status: 'loading' };

  const retry = () => setRequestId((value) => value + 1);

  return { retry, state };
};

// 캠페인 상세: 오늘과 누적
export const useCampaignPerformance = (campaign: PerformanceTarget) =>
  usePerformance(getCampaignPerformance, campaign);

// 현재 캠페인 카드: 오늘. 카드가 받는 형태로 돌려준다
export const useTodayPerformance = (
  campaign: PerformanceTarget,
): TodayPerformanceState => {
  const { retry, state } = usePerformance(
    getCampaignTodayPerformance,
    campaign,
  );

  return state.status === 'error' ? { status: 'error', retry } : state;
};

// 지난 캠페인 카드: 누적
export const useTotalPerformance = (campaign: PerformanceTarget) =>
  usePerformance(getCampaignTotalPerformance, campaign);
