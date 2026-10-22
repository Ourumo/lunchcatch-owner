import { type Campaign, isCurrentCampaign } from '@owner/api/campaign';

// 분석할 수 있는 캠페인. 한 번이라도 집행된 진행 중·일시중지·종료 캠페인만 고를 수 있다
const isAnalyzableCampaign = (campaign: Campaign) =>
  (isCurrentCampaign(campaign) || campaign.status === 'ENDED') &&
  campaign.budget.startDate !== '' &&
  campaign.budget.endDate !== '';

// 진행 중·일시중지 캠페인을 먼저, 나머지는 종료일 최신순으로 둔다
export const getAnalyzableCampaigns = (campaigns: Campaign[]) =>
  campaigns
    .filter(isAnalyzableCampaign)
    .sort(
      (a, b) =>
        Number(isCurrentCampaign(b)) - Number(isCurrentCampaign(a)) ||
        b.budget.endDate.localeCompare(a.budget.endDate) ||
        a.id.localeCompare(b.id),
    );

// 주소의 campaignId로 고른 캠페인. 없거나 고를 수 없는 캠페인이면 진행 중·일시중지 캠페인, 없으면 가장 최근에 끝난 캠페인
export const findSelectedCampaign = (
  campaigns: Campaign[],
  campaignId: string | null,
) => campaigns.find(({ id }) => id === campaignId) ?? campaigns.at(0) ?? null;

// 캠페인 비교에 두는 최근 종료 캠페인 수
const COMPARISON_ENDED_COUNT = 2;

// 캠페인 비교 목록. 진행 중·일시중지 캠페인과 최근에 끝난 캠페인 몇 개를 둔다
export const getComparisonCampaigns = (campaigns: Campaign[]) => [
  ...campaigns.filter(isCurrentCampaign),
  ...campaigns
    .filter(({ status }) => status === 'ENDED')
    .slice(0, COMPARISON_ENDED_COUNT),
];
