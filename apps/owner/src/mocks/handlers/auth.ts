import { http } from 'msw/http';

import { getDb, resetDb, updateDb } from '@owner/mocks/db';
import { fail, noContent, ok, unauthenticated } from '@owner/mocks/response';

// 로그인 · 로그아웃 · 내 정보 · 토큰 재발급 (api/auth.ts, api/client.ts)
//
// 진짜 서버는 로그인하면 HttpOnly 쿠키로 토큰을 주고, 이후 요청마다 쿠키로 누구인지 확인한다.
// 목 서버는 쿠키 대신 db의 owner.isLoggedIn 하나로 로그인 여부를 판단한다.
//
// 주소 앞의 `*/`는 "어느 서버 주소든"이라는 뜻이다. VITE_API_BASE_URL이 비어 있으면 같은 주소의 /v1로,
// 값이 남아 있으면 그 서버 주소의 /v1로 요청이 나가는데, 어느 쪽이든 가로챈다.
// 주소의 `:`는 MSW에서 경로 변수(예: `:campaignId`)를 뜻해, 글자 그대로의 `:`는 `\\:`로 쓴다

const toProfile = () => {
  const { email, tutorialViewed } = getDb().owner;

  return { email, status: 'ACTIVE' as const, tutorialViewed };
};

export const authHandlers = [
  // 로그인. 목 모드 로그인 화면은 시연 계정 값이 채워진 채 잠겨 있어, 어떤 값이 와도 시연 계정으로 들어가게 한다
  http.post('*/v1/owner/auth/tokens', () => {
    updateDb((db) => {
      db.owner.isLoggedIn = true;
    });

    return ok({ ...toProfile(), role: 'OWNER' });
  }),

  // 로그아웃. 서버는 쿠키를 지우고 204로 답한다. 목 서버는 시연 데이터를 처음 상태로 되돌린다
  http.delete('*/v1/owner/auth/tokens', () => {
    resetDb();

    return noContent();
  }),

  // 토큰 재발급. 로그인 상태면 성공, 아니면 "다시 로그인해야 함"(401 AUTH-003)으로 답해 화면이 로그인 화면으로 간다
  http.post('*/v1/owner/auth/tokens\\:refresh', () =>
    getDb().owner.isLoggedIn
      ? ok(null)
      : fail(401, 'AUTH-003', '다시 로그인해 주세요.'),
  ),

  // 내 정보. 앱을 열 때마다 불러 로그인 상태를 되살린다 (auth/AuthProvider.tsx)
  http.get('*/v1/owner/me', () =>
    getDb().owner.isLoggedIn ? ok(toProfile()) : unauthenticated(),
  ),

  // 첫 방문 튜토리얼 완료
  http.patch('*/v1/owner/me/tutorial', () => {
    if (!getDb().owner.isLoggedIn) return unauthenticated();

    updateDb((db) => {
      db.owner.tutorialViewed = true;
    });

    return ok({ tutorialViewed: true });
  }),
];
