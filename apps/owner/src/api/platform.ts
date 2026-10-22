import { mockPlatformSettings } from './mocks/platform';
import type { ApiResult } from './types';

// 운영의 플랫폼 설정값 (docs/requirements-admin.md "플랫폼 설정값 관리").
// 모든 도메인이 읽을 수 있고, 관리자가 바꾸면 다음 날 00:00부터 적용된다
// 점주가 받을 조회 API가 없어 서버 초기 설정값을 mock으로 둔다. 관리자가 값을 바꿔 서버가
// 하루 예산을 422 CAMPAIGN-007로 거절하면 4단계 저장이 서버 문구로 이유를 보여준다

export interface PlatformSettings {
  // 유효 노출 1회당 차감 포인트
  impressionUnitPrice: number;
  minDailyBudget: number;
}

export const getPlatformSettings = async (): Promise<
  ApiResult<PlatformSettings>
> => ({ ok: true, data: { ...mockPlatformSettings } });
