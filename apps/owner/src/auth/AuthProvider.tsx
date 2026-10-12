import { type ReactNode, useEffect, useState } from 'react';

import { getMe, type LoginResponse } from '@owner/api/auth';

import { AuthContext } from './authContext';

// 앱을 시작할 때 내 정보 조회로 로그인 상태를 되살린다.
// 인증은 서버가 HttpOnly 쿠키로 관리해 화면이 쿠키를 읽을 수 없으므로 새로고침할 때마다 서버에 묻는다
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 조회하는 중이면 undefined, 로그인 전이면 null
  const [owner, setOwner] = useState<LoginResponse | null>();

  useEffect(() => {
    let ignore = false;

    getMe().then((result) => {
      if (!ignore) {
        setOwner(result.ok ? result.data : null);
      }
    });

    // 개발 모드에서 effect가 두 번 실행되면 먼저 보낸 요청의 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  // 조회하는 동안 로그인 화면이 잠깐 보였다가 바뀌지 않도록 아무것도 그리지 않는다
  if (owner === undefined) {
    return null;
  }

  return (
    <AuthContext
      value={{
        owner,
        setOwner,
        // 입점 신청 API가 아직 mock이라 화면의 상태만 바꾼다. 새로고침하면 서버 상태(ONBOARDING)로 돌아간다
        completeOnboarding: () => {
          setOwner((prev) => prev && { ...prev, status: 'ACTIVE' });
        },
        clearOwner: () => setOwner(null),
      }}
    >
      {children}
    </AuthContext>
  );
};
