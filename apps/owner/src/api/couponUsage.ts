import { ApiError, request } from './client';
import {
  getPeriodStartDate,
  type PointHistoryPeriod,
  toKstDate,
} from './points';
import type { ApiResult } from './types';

// 쿠폰 사용 이력 (docs/requirements-owner.md "발급/사용 이력 조회", GET /v1/owner/stores/{storeId}/coupon-usages).
// 명세는 캠페인별 발급·사용·만료 이력이지만, API는 매장 단위의 확정된 사용 이력만 준다

export interface CouponUsage {
  id: string;
  // 서버가 쿠폰 조건으로 계산한 할인 금액(원)
  discountAmount: number;
  // 사용 처리 시각 (ISO 8601)
  usedAt: string;
}

export interface CouponUsagePage {
  usages: CouponUsage[];
  // 다음 구간을 받을 때 넘기는 값. 마지막 구간이면 null
  nextCursor: string | null;
}

// 조회 권한 없음. OWNER가 아니거나, ACTIVE가 아니거나, 본인 가게가 아니다
export type CouponUsageFailureCode = 'FORBIDDEN';

export const COUPON_USAGE_PAGE_SIZE = 20;

const FORBIDDEN_CODE = 'AUTH-006';

// 서버 사용 이력 응답
interface CouponUsageResponse {
  items: {
    usageHistoryId: number;
    memberCouponId: number;
    discountAmount: number;
    useTime: string;
  }[];
  nextPageToken: string | null;
}

// 쿠폰 사용 이력 한 구간. 최신순이고, 기간 첫날부터 오늘까지(한국 날짜) 조회한다.
// 다음 구간은 받은 커서로 이어서 부르고, 기간을 바꾸면 커서 없이 처음부터 부른다
export const getCouponUsagePage = async ({
  cursor,
  period,
  storeId,
}: {
  storeId: string;
  period: PointHistoryPeriod;
  cursor?: string;
}): Promise<ApiResult<CouponUsagePage>> => {
  const params = new URLSearchParams({
    from: getPeriodStartDate(period),
    to: toKstDate(new Date()),
    pageSize: String(COUPON_USAGE_PAGE_SIZE),
  });

  if (cursor) {
    params.set('pageToken', cursor);
  }

  try {
    const data = await request<CouponUsageResponse>(
      `/v1/owner/stores/${encodeURIComponent(storeId)}/coupon-usages?${params}`,
    );

    return {
      ok: true,
      data: {
        usages: data.items.map((item) => ({
          id: String(item.usageHistoryId),
          discountAmount: item.discountAmount,
          usedAt: item.useTime,
        })),
        nextCursor: data.nextPageToken || null,
      },
    };
  } catch (error) {
    return error instanceof ApiError && error.code === FORBIDDEN_CODE
      ? { ok: false, code: 'FORBIDDEN' satisfies CouponUsageFailureCode }
      : { ok: false };
  }
};
