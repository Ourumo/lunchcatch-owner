import { http } from 'msw/http';

import { getDb, replaceDb } from '@owner/mocks/db';
import { createNoPointsSeed } from '@owner/mocks/noPoints';
import { fail, ok, unauthenticated } from '@owner/mocks/response';

// 시연 상황 바꾸기 (api/demo.ts). 진짜 서버에는 없는 목 서버 전용 요청이다

export const demoHandlers = [
  // 잔액 부족으로 캠페인이 멈춘 상황으로 바꾼다. 기본 시연 데이터에서 만들어, 이 탭에서 바꾼 내용은 처음으로 돌아간다.
  // 진행 중 캠페인이 있는 시연 계정에서만 쓸 수 있다
  http.post('*/v1/demo/no-points-scenario', () => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    if (!db.campaigns.some(({ status }) => status === 'ACTIVE')) {
      return fail(409, 'DEMO-001', '진행 중인 캠페인이 있어야 볼 수 있어요.');
    }

    const next = createNoPointsSeed();

    replaceDb({
      ...next,
      owner: {
        ...next.owner,
        isLoggedIn: true,
        tutorialViewed: db.owner.tutorialViewed,
      },
    });

    return ok(null);
  }),
];
