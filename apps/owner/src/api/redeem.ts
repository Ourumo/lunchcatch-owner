import { mockDelay } from './mocks/delay';
import {
  createMockIssuedCoupon,
  mockIssuedCoupons,
  mockUsedQrTokens,
} from './mocks/redeem';
import { mockStore } from './mocks/store';
import type { ApiResult } from './types';

// 쿠폰 QR 스캔 사용 처리 (docs/requirements-owner.md "QR 스캔 사용 처리")
// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

// 사용 처리를 거절한 사유. 백엔드 사유 코드 목록이 정해지기 전까지 명세의 예외를 따라 둔다
export type RedeemFailureCode =
  // 만료된 QR (발급 후 60초)
  | 'QR_EXPIRED'
  // 이미 사용 처리에 쓴 QR
  | 'QR_ALREADY_USED'
  // 이미 사용 완료된 쿠폰
  | 'COUPON_ALREADY_REDEEMED'
  // 다른 가게 쿠폰
  | 'OTHER_STORE_COUPON'
  // 캠페인 사용 가능 시간이 아님
  | 'OUTSIDE_USABLE_TIME'
  // 쿠폰 QR이 아니거나 서명이 맞지 않음
  | 'INVALID_QR';

export interface RedeemedCoupon {
  // 쿠폰 이름(할인 내용). 성공 응답에 포함되는지 백엔드 확인이 필요하다
  couponTitle: string;
  // 사용 처리 시각 (ISO 8601)
  redeemedAt: string;
}

// 사용자 앱 QR의 유효 시간 (apps/user QR_TOKEN_LIFETIME_MS와 같다)
const QR_TOKEN_LIFETIME_MS = 60_000;

const QR_TOKEN_PREFIX = 'lunch-catch';

const fail = (code: RedeemFailureCode): ApiResult<RedeemedCoupon> => ({
  ok: false,
  code,
});

// mock QR은 사용자 앱과 같은 "lunch-catch:{발급 ID}:{발급 시각}" 형식이다.
// 실제 토큰은 issue_id, 만료 시각, jti, 서명을 담은 서명 토큰이고 서버가 검증한다
const parseMockToken = (token: string) => {
  const [prefix, issueId, issuedAtText, ...rest] = token.split(':');
  const issuedAt = Number(issuedAtText);

  if (
    prefix !== QR_TOKEN_PREFIX ||
    !issueId ||
    !Number.isFinite(issuedAt) ||
    rest.length > 0
  ) {
    return null;
  }

  return { issueId, issuedAt };
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const isWithinUsableTime = (
  now: Date,
  usableFrom: string,
  usableUntil: string,
) => {
  const minutes = now.getHours() * 60 + now.getMinutes();

  return toMinutes(usableFrom) <= minutes && minutes < toMinutes(usableUntil);
};

// 서버와 같은 순서로 검증한다. 서명(형식) → 만료 → QR 재사용 → 가게 → 쿠폰 상태 → 사용 가능 시간
export const redeemCoupon = async (
  token: string,
): Promise<ApiResult<RedeemedCoupon>> => {
  await mockDelay();

  const parsed = parseMockToken(token);

  if (!parsed) {
    return fail('INVALID_QR');
  }

  const now = new Date();

  if (now.getTime() - parsed.issuedAt > QR_TOKEN_LIFETIME_MS) {
    return fail('QR_EXPIRED');
  }

  if (mockUsedQrTokens.has(token)) {
    return fail('QR_ALREADY_USED');
  }

  const coupon =
    mockIssuedCoupons.find(({ issueId }) => issueId === parsed.issueId) ??
    createMockIssuedCoupon(parsed.issueId);

  if (coupon.storeId !== mockStore.id) {
    return fail('OTHER_STORE_COUPON');
  }

  if (coupon.status === 'REDEEMED') {
    return fail('COUPON_ALREADY_REDEEMED');
  }

  if (!isWithinUsableTime(now, coupon.usableFrom, coupon.usableUntil)) {
    return fail('OUTSIDE_USABLE_TIME');
  }

  coupon.status = 'REDEEMED';
  mockUsedQrTokens.add(token);

  return {
    ok: true,
    data: { couponTitle: coupon.couponTitle, redeemedAt: now.toISOString() },
  };
};
