import { useCallback, useState } from 'react';

import type { Campaign } from '@owner/api/campaign';
import { type CampaignDayReport, getCampaignReport } from '@owner/api/report';
import type { ApiResult } from '@owner/api/types';

export type CampaignReportLoader = (
  campaign: Campaign,
) => Promise<ApiResult<CampaignDayReport[]>>;

// 같은 캠페인의 리포트를 분석 화면과 캠페인 비교가 함께 쓰도록, 페이지에 있는 동안 캠페인마다 한 번만 요청한다.
// 응답을 기다리는 중에 다시 부르면 같은 요청을 기다린다. 실패한 요청은 지워 다시 시도하면 새로 요청한다
export const useCampaignReportLoader = (): CampaignReportLoader => {
  const [requests] = useState(
    () => new Map<string, Promise<ApiResult<CampaignDayReport[]>>>(),
  );

  return useCallback(
    (campaign: Campaign) => {
      const cached = requests.get(campaign.id);

      if (cached) {
        return cached;
      }

      const request = getCampaignReport({
        campaignId: campaign.id,
        startDate: campaign.budget.startDate,
        endDate: campaign.budget.endDate,
      }).then((result) => {
        if (!result.ok) {
          requests.delete(campaign.id);
        }

        return result;
      });

      requests.set(campaign.id, request);

      return request;
    },
    [requests],
  );
};
