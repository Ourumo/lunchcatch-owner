import type { Campaign } from '@owner/api/campaign';

// 캠페인 탭에서 보여주는 지난 캠페인 개수. 더 있으면 "전체 보기"로 전체 목록 페이지에서 본다
export const ENDED_PREVIEW_COUNT = 2;

export const ENDED_CAMPAIGNS_PATH = '/campaigns/ended';

// 끝난 캠페인만 골라 종료일 최신순으로 정렬한다. 캠페인 탭의 지난 캠페인 섹션과 지난 캠페인 전체 목록이 같이 쓴다
export const getEndedCampaigns = (campaigns: Campaign[]) =>
  campaigns
    .filter(({ status }) => status === 'ENDED')
    .sort((a, b) => b.budget.endDate.localeCompare(a.budget.endDate));
