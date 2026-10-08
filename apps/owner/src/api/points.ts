import { mockDelay } from './mocks/delay';
import { mockPointBalance } from './mocks/points';
import type { ApiResult } from './types';

// 점주 포인트 잔액 (docs/requirements-owner.md "잔액 및 내역 조회").
// 잔액은 정산만 가지므로 캠페인 API와 분리한다. 캠페인 화면은 잔액 부족 안내를 위해 따로 불러온다
// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export interface PointBalance {
  // 포인트 원장 합계 (1원 = 1포인트)
  balance: number;
  // 오늘 예약했지만 아직 쓰지 않은 포인트. 잔액과 따로 보여준다
  reservedPoints: number;
}

// 최소 충전 금액(원). 명세에 값이 없어 임시로 둔다. 기획 확인 후 바꾼다
export const MIN_CHARGE_AMOUNT = 10000;

const BELOW_MIN_CHARGE_MESSAGE = `${MIN_CHARGE_AMOUNT.toLocaleString('ko-KR')}원부터 충전할 수 있습니다.`;

export const getPointBalance = async (): Promise<ApiResult<PointBalance>> => {
  await mockDelay();

  return { ok: true, data: { ...mockPointBalance } };
};

// 포인트 충전 (docs/requirements-owner.md "포인트 결제"). 1원 = 1포인트로 잔액에 더하고 바뀐 잔액을 돌려준다
// 실제 결제는 결제대행사 화면을 거친다. mock은 테스트 결제라 바로 충전된다
export const chargePoints = async (
  amount: number,
): Promise<ApiResult<PointBalance>> => {
  await mockDelay();

  if (!Number.isInteger(amount) || amount < MIN_CHARGE_AMOUNT) {
    return { ok: false, message: BELOW_MIN_CHARGE_MESSAGE };
  }

  mockPointBalance.balance += amount;

  return { ok: true, data: { ...mockPointBalance } };
};
