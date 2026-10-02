import type { PlatformSettings } from '@owner/api/platform';

// 운영의 플랫폼 설정값. 노출 1회당 차감 포인트는 아직 정해지지 않아 임시 값을 쓴다
export const mockPlatformSettings: PlatformSettings = {
  impressionUnitPrice: 10,
  minDailyBudget: 5000,
  bootstrapDailyBudget: 10000,
};
