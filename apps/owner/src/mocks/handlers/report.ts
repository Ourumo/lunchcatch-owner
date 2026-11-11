import { http } from 'msw/http';

import { eachDate, getKstToday } from '@owner/mocks/date';
import { getDb } from '@owner/mocks/db';
import { ok, unauthenticated } from '@owner/mocks/response';
import { getStatsByDate } from '@owner/mocks/stats';

// 가게 단위 실적 (api/report.ts)

// 과금 노출 1회당 포인트
const IMPRESSION_UNIT_COST = 10;

export const reportHandlers = [
  // 날짜별 쿠폰 사용 건수. 가게의 모든 캠페인을 사용일로 합친다. 사용이 없는 날은 서버처럼 빼고 준다 (홈 쿠폰 사용 추이)
  http.get('*/v1/owner/stores/:storeId/coupon-usages/daily', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const usedByDate = new Map<string, number>();

    db.campaigns.forEach((campaign) => {
      getStatsByDate(campaign, from, to).forEach(({ date, usedCount }) => {
        usedByDate.set(date, (usedByDate.get(date) ?? 0) + usedCount);
      });
    });

    // QR로 사용 처리한 쿠폰도 그날 사용 수에 더한다
    db.redemptions.forEach(({ useTime }) => {
      const date = useTime.slice(0, 10);

      usedByDate.set(date, (usedByDate.get(date) ?? 0) + 1);
    });

    const items = eachDate(from, to).flatMap((businessDate) => {
      const usedCount = usedByDate.get(businessDate) ?? 0;

      return usedCount > 0 ? [{ businessDate, usedCount }] : [];
    });

    return ok({ items });
  }),

  // 캠페인별 날짜별 리포트 (가게 분석). 하루 한 번 집계해 오늘 몫은 오지 않는다. 날짜, 캠페인 ID 오름차순
  http.get('*/v1/owner/report', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const today = getKstToday();
    const items = db.campaigns
      .flatMap((campaign) =>
        getStatsByDate(campaign, from, to)
          .filter(({ date }) => date < today)
          .map((stats) => {
            const validImpressionCount = Math.round(
              stats.spentPoint / IMPRESSION_UNIT_COST,
            );

            return {
              businessDate: stats.date,
              campaignId: campaign.campaignId,
              dailyBudget: stats.reservedPoint,
              impressionUnitCost: IMPRESSION_UNIT_COST,
              validImpressionCount,
              // 같은 사람에게 짧은 시간 안에 다시 보인 노출처럼 과금하지 않은 노출. 유효 노출의 5% 정도로 둔다
              invalidImpressionCount: Math.round(validImpressionCount * 0.05),
              wishCount: stats.wishCount,
              issuedCount: stats.issuedCount,
              redeemCount: stats.usedCount,
              chargedAmount: stats.spentPoint,
              refundedAmount: 0,
              spentAmount: stats.spentPoint,
            };
          }),
      )
      .sort(
        (a, b) =>
          a.businessDate.localeCompare(b.businessDate) ||
          a.campaignId - b.campaignId,
      );

    return ok({
      from,
      to,
      totalSpentAmount: items.reduce((sum, item) => sum + item.spentAmount, 0),
      items,
    });
  }),
];
