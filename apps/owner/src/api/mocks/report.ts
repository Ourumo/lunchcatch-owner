import type { ServingDayPerformance } from '@owner/api/report';

import { daysFromToday } from './campaigns';

// 최근 집행일 5회의 쿠폰 사용 수. 캠페인 mock의 집행 기간과 맞춘다.
// 지난 캠페인(14일 전 종료)과 진행 중 캠페인(3일 전 시작) 사이에 쉬는 기간이 있어 날짜 간격이 일정하지 않다.
// 오늘 값은 진행 중 캠페인의 오늘 사용 수와 같고, 아직 확정 전이다
export const mockRecentServingDays: ServingDayPerformance[] = [
  { date: daysFromToday(-14), redeemedCount: 18, isConfirmed: true },
  { date: daysFromToday(-3), redeemedCount: 9, isConfirmed: true },
  { date: daysFromToday(-2), redeemedCount: 14, isConfirmed: true },
  { date: daysFromToday(-1), redeemedCount: 11, isConfirmed: true },
  { date: daysFromToday(0), redeemedCount: 12, isConfirmed: false },
];
