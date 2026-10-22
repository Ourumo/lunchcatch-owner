import { useEffect, useState } from 'react';

import type { Campaign } from '@owner/api/campaign';

import { getComparisonCampaigns } from './analyticsCampaigns';
import { summarizeReport } from './reportSummary';
import type { CampaignReportLoader } from './useCampaignReportLoader';

export interface ComparisonItem {
  campaign: Campaign;
  // 집계된 날이 없으면 null. 0으로 보여주지 않는다
  redeemCount: number | null;
  spentPoints: number | null;
}

type ComparisonState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: ComparisonItem[] };

// 캠페인 비교 목록의 캠페인마다 집행 기간 리포트를 받아 방문과 소진 포인트를 더한다.
// 지금 보고 있는 캠페인의 리포트는 분석 화면이 받은 요청을 같이 쓴다
export const useCampaignComparison = (
  campaigns: Campaign[] | null,
  loadReport: CampaignReportLoader,
) => {
  const [state, setState] = useState<ComparisonState>({ status: 'loading' });
  // 값이 바뀌면 다시 불러온다
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    if (!campaigns) {
      return;
    }

    let ignore = false;
    const comparisonCampaigns = getComparisonCampaigns(campaigns);

    Promise.all(comparisonCampaigns.map(loadReport)).then((results) => {
      if (ignore) {
        return;
      }

      if (results.some((result) => !result.ok)) {
        setState({ status: 'error' });
        return;
      }

      setState({
        status: 'success',
        items: comparisonCampaigns.map((campaign, index) => {
          const result = results[index];
          const report = result.ok ? result.data : [];
          const summary = report.length > 0 ? summarizeReport(report) : null;

          return {
            campaign,
            redeemCount: summary?.redeemCount ?? null,
            spentPoints: summary?.spentPoints ?? null,
          };
        }),
      });
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaigns, loadReport, requestId]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequestId((id) => id + 1);
  };

  return { retry, state };
};
