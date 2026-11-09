import { http } from 'msw/http';

import { eachDate } from '@owner/mocks/date';
import { getDb } from '@owner/mocks/db';
import { ok, unauthenticated } from '@owner/mocks/response';
import { getStatsByDate } from '@owner/mocks/stats';

// 가게 단위 실적 (api/report.ts)

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

    const items = eachDate(from, to).flatMap((businessDate) => {
      const usedCount = usedByDate.get(businessDate) ?? 0;

      return usedCount > 0 ? [{ businessDate, usedCount }] : [];
    });

    return ok({ items });
  }),
];
