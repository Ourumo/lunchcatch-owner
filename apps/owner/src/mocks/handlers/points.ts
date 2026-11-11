import { http } from 'msw/http';

import { getKstToday } from '@owner/mocks/date';
import { getDb } from '@owner/mocks/db';
import { getBalance, getLedger, getReservedPoint } from '@owner/mocks/ledger';
import { ok, paginate, unauthenticated } from '@owner/mocks/response';
import {
  getStatsByDate,
  IMPRESSION_UNIT_COST,
  sumStats,
} from '@owner/mocks/stats';

// 포인트 잔액 · 원장 · 충전 정책 · 소진 집계 (api/points.ts, api/campaign.ts)

// 충전 정책. 충전 주문(payments.ts)도 이 값으로 금액을 검사한다
export const CHARGE_POLICY = {
  minChargeAmount: 10000,
  chargeProducts: [10000, 30000, 50000, 100000],
  effectiveDate: '2026-09-01',
};

export const pointHandlers = [
  http.get('*/v1/owner/points/balance', () => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const balance = getBalance(db);
    const reservedPoint = getReservedPoint(db);

    return ok({
      balance,
      reservedPoint,
      unspentTotal: balance + reservedPoint,
      businessDate: getKstToday(),
    });
  }),

  // 원장(포인트 내역). 기간(from~to, 한국 날짜)과 캠페인으로 거르고 최신순으로 나눠 준다
  http.get('*/v1/owner/points/ledger', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const campaignId = searchParams.get('campaignId');
    const entries = getLedger(db).filter(({ createdAt, ...entry }) => {
      const date = createdAt.slice(0, 10);

      return (
        from <= date &&
        date <= to &&
        (!campaignId || String(entry.campaignId) === campaignId)
      );
    });

    return ok(paginate(entries, request));
  }),

  // 충전 정책. 충전 시트의 최소 금액과 금액 선택지
  http.get('*/v1/owner/point-policy', () => {
    if (!getDb().owner.isLoggedIn) return unauthenticated();

    return ok(CHARGE_POLICY);
  }),

  // 소진 집계. groupBy가 CAMPAIGN이면 캠페인마다 기간 합계 한 줄, DAY_CAMPAIGN이면 날짜 · 캠페인마다 한 줄.
  // campaignId가 있으면 그 캠페인만 준다. 소진이 없는 줄은 서버처럼 빼고 준다
  http.get('*/v1/owner/points/spend-summary', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const campaignId = searchParams.get('campaignId');
    const campaigns = db.campaigns.filter(
      (campaign) => !campaignId || String(campaign.campaignId) === campaignId,
    );

    const items =
      searchParams.get('groupBy') === 'DAY_CAMPAIGN'
        ? campaigns.flatMap((campaign) =>
            getStatsByDate(campaign, from, to).map((stats) => ({
              date: stats.date,
              campaignId: campaign.campaignId,
              spentPoint: stats.spentPoint,
              reservedPoint: stats.reservedPoint,
              impressionCount: stats.spentPoint / IMPRESSION_UNIT_COST,
            })),
          )
        : campaigns.map((campaign) => {
            const stats = sumStats(campaign, from, to);

            return {
              date: from,
              campaignId: campaign.campaignId,
              spentPoint: stats.spentPoint,
              reservedPoint: stats.reservedPoint,
              impressionCount: stats.spentPoint / IMPRESSION_UNIT_COST,
            };
          });

    return ok({ items: items.filter(({ spentPoint }) => spentPoint > 0) });
  }),
];
