import { request } from './client';
import type { ApiResult } from './types';

// 시연 상황 바꾸기. 목 모드(VITE_USE_MOCK=true)에서 목 서버만 답하는 요청이고 진짜 서버에는 없다 (src/mocks/handlers/demo.ts).
// 화면은 목 모드에서만 이 요청을 부른다

// 잔액 부족으로 캠페인이 멈춘 상황으로 바꾼다. 하루가 지나야 생기는 상황이라 시연에서는 이렇게 만든다
export const startNoPointsDemo = async (): Promise<ApiResult<null>> => {
  try {
    await request<null>('/v1/demo/no-points-scenario', { method: 'POST' });

    return { ok: true, data: null };
  } catch {
    return { ok: false };
  }
};
