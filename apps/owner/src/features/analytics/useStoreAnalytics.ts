import { useEffect, useMemo, useState } from 'react';

import { type Campaign, getCampaign, getCampaigns } from '@owner/api/campaign';
import { type CampaignDayReport, getCampaignReport } from '@owner/api/report';
import { getMyStore, type StoreMenu } from '@owner/api/store';

import {
  findSelectedCampaign,
  getAnalyzableCampaigns,
} from './analyticsCampaigns';

type CampaignsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; campaigns: Campaign[]; menus: StoreMenu[] };

// 고른 캠페인의 리포트. 어느 캠페인의 결과인지 함께 두어, 캠페인을 바꾸면 새 결과가 오기 전까지 불러오는 중으로 본다
type ReportState =
  | { campaignId: string; status: 'error' }
  | {
      campaignId: string;
      status: 'success';
      campaign: Campaign;
      report: CampaignDayReport[];
    };

// 가게 분석에 필요한 캠페인 목록과 가게 메뉴를 불러오고, 고른 캠페인의 리포트를 불러온다
export const useStoreAnalytics = (campaignId: string | null) => {
  const [campaignsState, setCampaignsState] = useState<CampaignsState>({
    status: 'loading',
  });
  const [reportState, setReportState] = useState<ReportState | null>(null);
  // 값이 바뀌면 다시 불러온다
  const [campaignsRequestId, setCampaignsRequestId] = useState(0);
  const [reportRequestId, setReportRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaigns(), getMyStore()]).then(
      ([campaignsResult, storeResult]) => {
        if (ignore) {
          return;
        }

        if (!campaignsResult.ok || !storeResult.ok) {
          setCampaignsState({ status: 'error' });
          return;
        }

        setCampaignsState({
          status: 'success',
          campaigns: getAnalyzableCampaigns(campaignsResult.data),
          menus: storeResult.data.menus,
        });
      },
    );

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignsRequestId]);

  const campaigns =
    campaignsState.status === 'success' ? campaignsState.campaigns : null;
  const selectedCampaign = useMemo(
    () => (campaigns ? findSelectedCampaign(campaigns, campaignId) : null),
    [campaignId, campaigns],
  );

  useEffect(() => {
    if (!selectedCampaign) {
      return;
    }

    let ignore = false;
    const { budget, id } = selectedCampaign;

    // 종료된 캠페인은 목록에 할인 메뉴가 없어 상세로 다시 받는다
    Promise.all([
      getCampaign(id),
      getCampaignReport({
        campaignId: id,
        startDate: budget.startDate,
        endDate: budget.endDate,
      }),
    ]).then(([campaignResult, reportResult]) => {
      if (ignore) {
        return;
      }

      if (!campaignResult.ok || !reportResult.ok) {
        setReportState({ campaignId: id, status: 'error' });
        return;
      }

      setReportState({
        campaignId: id,
        status: 'success',
        campaign: campaignResult.data,
        report: reportResult.data,
      });
    });

    return () => {
      ignore = true;
    };
  }, [reportRequestId, selectedCampaign]);

  const retryCampaigns = () => {
    setCampaignsState({ status: 'loading' });
    setCampaignsRequestId((id) => id + 1);
  };

  const retryReport = () => {
    setReportState(null);
    setReportRequestId((id) => id + 1);
  };

  return {
    campaignsState,
    // 고른 캠페인과 다른 캠페인의 결과면 아직 불러오는 중이다
    reportState:
      reportState && reportState.campaignId === selectedCampaign?.id
        ? reportState
        : null,
    retryCampaigns,
    retryReport,
    selectedCampaign,
  };
};
