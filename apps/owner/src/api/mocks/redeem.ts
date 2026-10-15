import { mockCampaigns } from './campaigns';
import { mockStore } from './store';

// 손님이 받은 쿠폰 한 장. 서버가 쿠폰 이름(할인 내용)을 함께 내려준다고 가정한다
export interface MockIssuedCoupon {
  issueId: string;
  couponTitle: string;
  storeId: string;
  status: 'ISSUED' | 'REDEEMED';
  // HH:mm. 시작 시각부터 끝 시각 전까지 사용 처리할 수 있다. 하루 종일은 00:00~24:00
  usableFrom: string;
  usableUntil: string;
}

const currentCampaignTitle =
  mockCampaigns.find(({ status }) => status === 'ACTIVE')?.poster?.slots
    .discountText ?? '할인 쿠폰';

// 결과별로 확인하는 발급 쿠폰. 성공을 확인하는 쿠폰은 언제 열어도 쓸 수 있게 하루 종일 쓸 수 있다
export const mockIssuedCoupons: MockIssuedCoupon[] = [
  {
    issueId: 'mock-redeemed',
    couponTitle: currentCampaignTitle,
    storeId: mockStore.id,
    status: 'REDEEMED',
    usableFrom: '00:00',
    usableUntil: '24:00',
  },
  {
    issueId: 'mock-other-store',
    couponTitle: '김치찌개 2,000원 할인',
    storeId: 'store-other',
    status: 'ISSUED',
    usableFrom: '00:00',
    usableUntil: '24:00',
  },
  {
    // 사용 가능 시간이 비어 있어 언제 찍어도 시간 밖이다
    issueId: 'mock-not-usable-time',
    couponTitle: currentCampaignTitle,
    storeId: mockStore.id,
    status: 'ISSUED',
    usableFrom: '00:00',
    usableUntil: '00:00',
  },
];

// 목록에 없는 발급 ID는 이 가게 진행 중 캠페인의 쿠폰으로 본다.
// 사용자 앱 QR(발급 ID가 숫자)을 다른 기기로 찍어 보는 시험이 시간과 상관없이 성공하도록 하루 종일 쓸 수 있게 둔다
export const createMockIssuedCoupon = (issueId: string): MockIssuedCoupon => {
  const coupon: MockIssuedCoupon = {
    issueId,
    couponTitle: currentCampaignTitle,
    storeId: mockStore.id,
    status: 'ISSUED',
    usableFrom: '00:00',
    usableUntil: '24:00',
  };

  mockIssuedCoupons.push(coupon);

  return coupon;
};

// 이미 사용 처리에 쓴 QR(jti). 같은 QR이 다시 오면 거절한다
export const mockUsedQrTokens = new Set<string>();
