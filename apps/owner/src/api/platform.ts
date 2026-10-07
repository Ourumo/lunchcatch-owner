import { mockDelay } from './mocks/delay';
import { mockPlatformSettings } from './mocks/platform';
import type { ApiResult } from './types';

// 운영의 플랫폼 설정값 (docs/requirements-admin.md "플랫폼 설정값 관리").
// 모든 도메인이 읽을 수 있고, 관리자가 바꾸면 다음 날 00:00부터 적용된다
// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export interface PlatformSettings {
  // 유효 노출 1회당 차감 포인트
  impressionUnitPrice: number;
  minDailyBudget: number;
  // 반경 안에 최근 7일 데이터가 없을 때 추천하는 하루 예산
  bootstrapDailyBudget: number;
}

export const getPlatformSettings = async (): Promise<
  ApiResult<PlatformSettings>
> => {
  await mockDelay();

  return { ok: true, data: { ...mockPlatformSettings } };
};
