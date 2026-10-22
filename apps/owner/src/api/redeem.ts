import { ApiError, request } from './client';
import type { StoreLocation } from './store';
import type { ApiResult } from './types';

// 쿠폰 QR 스캔 사용 처리 (docs/requirements-owner.md "QR 스캔 사용 처리", POST /v1/owner/coupon-usages)

// 사용 처리를 거절한 사유. 서버 오류 코드가 있는 거절만 두고, 코드가 없는 거절(이미 사용한 쿠폰, 다른 가게 쿠폰,
// 사용 가능 시간이 아님, 가게에서 먼 위치)은 서버 문구(message)를 그대로 보여준다
export type RedeemFailureCode =
  // 만료되었거나 없는 QR. 서버가 둘을 같은 코드로 준다
  | 'QR_EXPIRED'
  // 쿠폰 QR 토큰(UUID)이 아님
  | 'INVALID_QR'
  // 가게 위치를 불러오지 못했거나 서버가 위치 값을 거절함
  | 'INVALID_LOCATION'
  // 응답을 받지 못했거나 서버 오류. 처리됐는데 응답만 받지 못했을 수 있다
  | 'NETWORK';

export interface RedeemedCoupon {
  // 서버가 쿠폰 조건으로 계산한 할인 금액(원)
  discountAmount: number;
  // 사용 처리 시각 (ISO 8601)
  usedAt: string;
}

interface CouponUseResponse {
  memberCouponId: number;
  usageHistoryId: number;
  discountAmount: number;
  useTime: string;
}

const failureCodesByServerCode: Record<string, RedeemFailureCode> = {
  'COUPON-010': 'QR_EXPIRED',
  'COMMON-003': 'INVALID_QR',
  'COMMON-002': 'INVALID_LOCATION',
};

const QR_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 매장 스캔 기기로 읽는 방식이라 기기 위치 대신 입점 신청 때 저장한 가게 위치를 보낸다.
// 쿠폰 QR 토큰은 UUID라, 다른 QR은 서버에 보내지 않고 잘못된 QR로 본다
export const redeemCoupon = async ({
  location,
  qrToken,
}: {
  location: StoreLocation;
  qrToken: string;
}): Promise<ApiResult<RedeemedCoupon>> => {
  if (!QR_TOKEN_PATTERN.test(qrToken)) {
    return { ok: false, code: 'INVALID_QR' };
  }

  try {
    const data = await request<CouponUseResponse>('/v1/owner/coupon-usages', {
      method: 'POST',
      body: {
        qrToken,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    });

    return {
      ok: true,
      data: { discountAmount: data.discountAmount, usedAt: data.useTime },
    };
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.code === null ||
      error.status >= 500
    ) {
      return { ok: false, code: 'NETWORK' };
    }

    return {
      ok: false,
      code: failureCodesByServerCode[error.code],
      message: error.message,
    };
  }
};
