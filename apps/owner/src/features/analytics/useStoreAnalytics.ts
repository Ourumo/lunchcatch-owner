import { useEffect, useMemo, useState } from 'react';

import { type Campaign, getCampaign, getCampaigns } from '@owner/api/campaign';
import type { CampaignDayReport } from '@owner/api/report';
import { getMyStore, type StoreMenu } from '@owner/api/store';

import {
  findSelectedCampaign,
  getAnalyzableCampaigns,
} from './analyticsCampaigns';
import { useCampaignReportLoader } from './useCampaignReportLoader';

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
      report: CampaignDayReport[];
    };

// 목록에는 할인 메뉴가 없어 특정 메뉴 할인의 메뉴 이름을 알 수 없다. 진행 중·일시중지 캠페인은 목록을 받을 때 상세로 채워지므로
// 특정 메뉴 할인인 종료 캠페인만 상세를 다시 받는다. 상세를 받지 못하면 목록 값으로 두어 "특정 메뉴"로 보여준다
const fillEndedMenuCampaigns = (campaigns: Campaign[]) =>
  Promise.all(
    campaigns.map(async (campaign) => {
      if (
        campaign.status !== 'ENDED' ||
        campaign.coupon.discountTarget !== 'MENU' ||
        campaign.coupon.menuId !== null
      ) {
        return campaign;
      }

      const result = await getCampaign(campaign.id);

      return result.ok ? result.data : campaign;
    }),
  );

// 가게 분석에 필요한 캠페인 목록과 가게 메뉴를 불러오고, 고른 캠페인의 리포트를 불러온다
export const useStoreAnalytics = (campaignId: string | null) => {
  const [campaignsState, setCampaignsState] = useState<CampaignsState>({
    status: 'loading',
  });
  const [reportState, setReportState] = useState<ReportState | null>(null);
  // 값이 바뀌면 다시 불러온다
  const [campaignsRequestId, setCampaignsRequestId] = useState(0);
  const [reportRequestId, setReportRequestId] = useState(0);
  const loadReport = useCampaignReportLoader();

  useEffect(() => {
    let ignore = false;

    Promise.all([getCampaigns(), getMyStore()]).then(
      async ([campaignsResult, storeResult]) => {
        if (ignore) {
          return;
        }

        if (!campaignsResult.ok || !storeResult.ok) {
          setCampaignsState({ status: 'error' });
          return;
        }

        const campaigns = await fillEndedMenuCampaigns(
          getAnalyzableCampaigns(campaignsResult.data),
        );

        if (ignore) {
          return;
        }

        setCampaignsState({
          status: 'success',
          campaigns,
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
    const { id } = selectedCampaign;

    loadReport(selectedCampaign).then((result) => {
      if (ignore) {
        return;
      }

      setReportState(
        result.ok
          ? { campaignId: id, status: 'success', report: result.data }
          : { campaignId: id, status: 'error' },
      );
    });

    return () => {
      ignore = true;
    };
  }, [loadReport, reportRequestId, selectedCampaign]);

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
    loadReport,
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
