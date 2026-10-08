import type { Campaign } from '@owner/api/campaign';

// 지금 집행 중인(ACTIVE, PAUSED) 캠페인. 가게당 1건이다
export const getCurrentCampaign = (campaigns: Campaign[]) =>
  campaigns.find(({ status }) => status === 'ACTIVE' || status === 'PAUSED');

// 진행 중 캠페인이 없을 때 안내할 다음 캠페인. 시작 대기가 있으면 가장 먼저 시작하는 것을,
// 없으면 가장 최근에 만든 작성 중 캠페인을 고른다 (목록은 등록 시각 최신순으로 온다)
export const getNextCampaign = (campaigns: Campaign[]) => {
  const scheduled = campaigns
    .filter(({ status }) => status === 'SCHEDULED')
    .sort((a, b) => a.budget.startDate.localeCompare(b.budget.startDate));

  return scheduled[0] ?? campaigns.find(({ status }) => status === 'DRAFT');
};
