import type { Campaign } from '@owner/api/campaign';

// 끝난 캠페인만 골라 종료일 최신순으로 정렬한다. 캠페인 탭의 지난 캠페인 섹션과 지난 캠페인 전체 목록이 같이 쓴다
export const getEndedCampaigns = (campaigns: Campaign[]) =>
  campaigns
    .filter(({ status }) => status === 'ENDED')
    .sort((a, b) => b.budget.endDate.localeCompare(a.budget.endDate));
