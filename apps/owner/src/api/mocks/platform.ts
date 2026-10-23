import type { PlatformSettings } from '@owner/api/platform';

// 운영의 플랫폼 설정값. 최소 하루 예산은 서버 초기 설정값(MIN_DAILY_BUDGET)과 같고,
// 노출 1회당 차감 포인트는 화면에서 쓰지 않아 임시 값을 둔다
export const mockPlatformSettings: PlatformSettings = {
  impressionUnitPrice: 10,
  minDailyBudget: 1000,
};
