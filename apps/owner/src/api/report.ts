import { mockDelay } from './mocks/delay';
import { mockRecentServingDays } from './mocks/report';
import type { ApiResult } from './types';

// 가게 단위 쿠폰 사용 실적. 홈의 쿠폰 사용 추이에 쓴다.
// 명세의 광고주 노출 리포트(docs/requirements-owner.md "리포트")는 캠페인별이라, 여러 캠페인에 걸친 가게 단위 실적은 응답 형태를 백엔드와 확인해야 한다
// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export interface ServingDayPerformance {
  // 캠페인이 집행된 날 (YYYY-MM-DD). 캠페인이 매일 열리지 않아 간격이 일정하지 않다
  date: string;
  // 그날 사용 처리된 쿠폰 수
  redeemedCount: number;
  // 일 1회 집계로 확정됐는지. 확정 전인 당일 값은 화면에 "집계 중"으로 표시한다
  isConfirmed: boolean;
}

// 최근 집행일 5회. 오래된 날짜부터 온다
export const getRecentServingDays = async (): Promise<
  ApiResult<ServingDayPerformance[]>
> => {
  await mockDelay();

  return { ok: true, data: structuredClone(mockRecentServingDays) };
};
