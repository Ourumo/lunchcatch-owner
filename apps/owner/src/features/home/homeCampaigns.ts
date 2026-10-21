import { type Campaign, isUnfinishedCampaign } from '@owner/api/campaign';

// 끝나지 않은(작성 중, 대기 중, 진행 중, 일시중지) 캠페인. 가게당 1건이다
export const getCurrentCampaign = (campaigns: Campaign[]) =>
  campaigns.find(isUnfinishedCampaign);
