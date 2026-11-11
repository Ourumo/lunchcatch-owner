import { http } from 'msw/http';

import { getCouponUsages, getDiscountAmount } from '@owner/mocks/couponUsages';
import { getKstTime, getKstToday, toKstDateTime } from '@owner/mocks/date';
import { getDb, updateDb } from '@owner/mocks/db';
import { fail, ok, paginate, unauthenticated } from '@owner/mocks/response';

// 쿠폰 사용 이력과 QR 사용 처리 (api/couponUsage.ts, api/redeem.ts)

interface RedeemBody {
  qrToken: string;
  latitude: number;
  longitude: number;
}

export const couponUsageHandlers = [
  // 매장 쿠폰 사용 이력. 기간(from~to) 안을 최신순으로 나눠 준다
  http.get('*/v1/owner/stores/:storeId/coupon-usages', ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    const { searchParams } = new URL(request.url);
    const usages = getCouponUsages(
      db,
      searchParams.get('from') ?? '',
      searchParams.get('to') ?? '',
    ).map(({ discountAmount, memberCouponId, usageHistoryId, useTime }) => ({
      usageHistoryId,
      memberCouponId,
      discountAmount,
      useTime,
    }));

    return ok(paginate(usages, request));
  }),

  // QR 사용 처리. 손님 앱이 없어 QR은 쿠폰 QR과 같은 모양(UUID)이면 지금 진행 중인 캠페인의 쿠폰으로 본다.
  // 진짜 서버는 사용 가능 시간 · 가게와의 거리도 보지만, 언제 어디서 열어도 시연할 수 있도록 검사하지 않는다
  http.post<never, RedeemBody>(
    '*/v1/owner/coupon-usages',
    async ({ request }) => {
      const db = getDb();

      if (!db.owner.isLoggedIn) return unauthenticated();

      const { qrToken } = await request.json();
      const campaign = db.campaigns.find(({ status }) => status === 'ACTIVE');

      if (db.redemptions.some((item) => item.qrToken === qrToken)) {
        return fail(409, 'COUPON-004', '이미 사용한 쿠폰이에요.');
      }

      if (!campaign) {
        return fail(
          409,
          'COUPON-011',
          '지금 진행 중인 캠페인의 쿠폰이 아니에요.',
        );
      }

      const usageHistoryId = db.nextId;
      const discountAmount = getDiscountAmount(db, campaign);
      const useTime = toKstDateTime(getKstToday(), getKstTime());

      updateDb((current) => {
        current.nextId += 1;
        current.redemptions.push({
          usageHistoryId,
          qrToken,
          campaignId: campaign.campaignId,
          discountAmount,
          useTime,
        });
      });

      return ok({
        memberCouponId: usageHistoryId,
        usageHistoryId,
        discountAmount,
        useTime,
      });
    },
  ),
];
