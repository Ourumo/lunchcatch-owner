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

export const getPointBalance = async (): Promise<ApiResult<PointBalance>> => {
  await mockDelay();

  return { ok: true, data: { ...mockPointBalance } };
};
