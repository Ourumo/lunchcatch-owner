import { http } from 'msw/http';

import { getCouponUsages, getDiscountAmount } from '@owner/mocks/couponUsages';
import { getKstTime, getKstToday, toKstDateTime } from '@owner/mocks/date';
import { getDb, updateDb } from '@owner/mocks/db';
import { fail, ok, paginate, unauthenticated } from '@owner/mocks/response';

// 쿠폰 사용 이력과 QR 사용 처리 (api/couponUsage.ts, api/redeem.ts)

// 시연 QR (features/qrScan/DemoQrCases.tsx). 손님 앱이 없어 QR 화면 아래 버튼으로 처리 결과를 골라 보낸다.
// 값을 바꾸면 그 파일의 DEMO_QR_TOKENS도 함께 바꾼다
const DEMO_QR_TOKENS = {
  expired: '00000000-0000-4000-8000-000000000001',
  alreadyUsed: '00000000-0000-4000-8000-000000000002',
  otherStore: '00000000-0000-4000-8000-000000000003',
  notUsableTime: '00000000-0000-4000-8000-000000000004',
  noResponse: '00000000-0000-4000-8000-000000000005',
};

// "응답 없음" QR을 한 번 보낸 적이 있는지. 처음에는 응답을 받지 못한 것처럼 실패하고, 다시 시도하면 처리한다
let hasMissedResponse = false;

// 시연 QR의 거절 응답. 진짜 서버도 이런 경우 사유 코드 없이 문구로 거절해 화면이 문구를 그대로 보여준다(만료는 코드가 있다)
const getDemoRejection = (qrToken: string) => {
  switch (qrToken) {
    case DEMO_QR_TOKENS.expired:
      return fail(410, 'COUPON-010', 'QR이 만료되었습니다.');
    case DEMO_QR_TOKENS.alreadyUsed:
      return fail(409, 'COUPON-004', '이미 사용한 쿠폰이에요.');
    case DEMO_QR_TOKENS.otherStore:
      return fail(403, 'COUPON-005', '다른 가게의 쿠폰이에요.');
    case DEMO_QR_TOKENS.notUsableTime:
      return fail(
        409,
        'COUPON-006',
        '지금은 쿠폰을 사용할 수 있는 시간이 아니에요.',
      );
    case DEMO_QR_TOKENS.noResponse:
      if (hasMissedResponse) return null;
      hasMissedResponse = true;
      return fail(503, 'COMMON-503', '잠시 후 다시 시도해 주세요.');
    default:
      return null;
  }
};

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
      const demoRejection = getDemoRejection(qrToken);

      if (demoRejection) return demoRejection;

      const campaign = db.campaigns.find(({ status }) => status === 'ACTIVE');

      // "응답 없음" 시연 QR은 다시 시도하면 처리되고, 다음에 또 눌러도 같은 흐름을 보여 주도록 사용 기록으로 막지 않는다
      const isNoResponseDemo = qrToken === DEMO_QR_TOKENS.noResponse;

      if (
        !isNoResponseDemo &&
        db.redemptions.some((item) => item.qrToken === qrToken)
      ) {
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

      if (isNoResponseDemo) hasMissedResponse = false;

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
