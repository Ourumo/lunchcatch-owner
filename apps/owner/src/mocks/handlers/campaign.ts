import { http } from 'msw/http';

import { getDb } from '@owner/mocks/db';
import { fail, ok, unauthenticated } from '@owner/mocks/response';
import type { MockCampaign } from '@owner/mocks/seed';
import { sumStats } from '@owner/mocks/stats';

// 캠페인 목록 · 상세 · 성과 (api/campaign.ts)
//
// 경로의 `:campaignId`는 경로 변수다. `/v1/owner/campaigns/3`으로 오면 params.campaignId가 '3'이 된다.
// 기간(from, to) 같은 쿼리 문자열은 경로 매칭에 쓰지 않고, 핸들러 안에서 request.url로 읽는다

type CampaignParams = { campaignId: string };

const findCampaign = (campaignId: string) =>
  getDb().campaigns.find(
    (campaign) => String(campaign.campaignId) === campaignId,
  );

// 없는 캠페인. 서버는 다른 점주의 캠페인도 같은 코드로 거절한다
const campaignNotFound = () =>
  fail(404, 'CAMPAIGN-005', '캠페인을 찾을 수 없습니다.');

// 성과 조회 기간. 쿼리 문자열의 from, to (YYYY-MM-DD)
const readPeriod = (request: Request) => {
  const { searchParams } = new URL(request.url);

  return {
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  };
};

// 목록 항목에는 상세의 일부만 담긴다
const toListItem = ({
  campaignId,
  createdAt,
  dailyBudget,
  discountTargetType,
  discountType,
  discountValue,
  endDate,
  startDate,
  status,
}: MockCampaign) => ({
  campaignId,
  status,
  discountTargetType,
  discountType,
  discountValue,
  dailyBudget,
  startDate,
  endDate,
  createdAt,
});

export const campaignHandlers = [
  // 목록. 서버처럼 최근 등록 순으로 준다. 시연 데이터는 몇 개뿐이라 한 페이지에 모두 담는다
  http.get('*/v1/owner/campaigns', () => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const items = [...db.campaigns]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toListItem);

    return ok({ items, nextPageToken: null });
  }),

  http.get<CampaignParams>('*/v1/owner/campaigns/:campaignId', ({ params }) => {
    if (!getDb().owner.isLoggedIn) return unauthenticated();

    const campaign = findCampaign(params.campaignId);

    return campaign ? ok(campaign) : campaignNotFound();
  }),

  // 찜 수 (기간 합계)
  http.get<CampaignParams>(
    '*/v1/owner/campaigns/:campaignId/analytics/funnel',
    ({ params, request }) => {
      if (!getDb().owner.isLoggedIn) return unauthenticated();

      const campaign = findCampaign(params.campaignId);

      if (!campaign) return campaignNotFound();

      const { from, to } = readPeriod(request);

      return ok({ wishCount: sumStats(campaign, from, to).wishCount });
    },
  ),

  // 쿠폰 발급 · 사용 수 (기간 합계)
  http.get<CampaignParams>(
    '*/v1/owner/campaigns/:campaignId/coupons/summary',
    ({ params, request }) => {
      if (!getDb().owner.isLoggedIn) return unauthenticated();

      const campaign = findCampaign(params.campaignId);

      if (!campaign) return campaignNotFound();

      const { from, to } = readPeriod(request);
      const { issuedCount, usedCount } = sumStats(campaign, from, to);

      return ok({ issuedCount, usedCount });
    },
  ),
];
