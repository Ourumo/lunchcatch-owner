import { type ReactNode, useEffect, useState } from 'react';

import { getMe, type LoginResponse } from '@owner/api/auth';
import { onSessionExpired } from '@owner/api/client';
import { AuthCheckScreen } from '@owner/components/AuthCheckScreen/AuthCheckScreen';

import { AuthContext } from './authContext';

// 내 정보 조회로 로그인 상태를 확인하는 중(checking), 확인하지 못함(failed), 확인함(done)
type CheckStatus = 'checking' | 'failed' | 'done';

// 앱을 시작할 때 내 정보 조회로 로그인 상태를 되살린다.
// 인증은 서버가 HttpOnly 쿠키로 관리해 화면이 쿠키를 읽을 수 없으므로 새로고침할 때마다 서버에 묻는다
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('checking');
  // 로그인 전이면 null
  const [owner, setOwner] = useState<LoginResponse | null>(null);
  // 값이 바뀌면 다시 확인한다
  const [checkRequestId, setCheckRequestId] = useState(0);

  // 재발급까지 실패해 다시 로그인해야 하면 로그인 상태를 지운다. RequireAuth가 로그인 화면으로 보낸다
  useEffect(() => onSessionExpired(() => setOwner(null)), []);

  useEffect(() => {
    let ignore = false;

    getMe().then((result) => {
      if (ignore) {
        return;
      }

      if (!result.ok) {
        setCheckStatus('failed');
        return;
      }

      setOwner(result.data);
      setCheckStatus('done');
    });

    // 개발 모드에서 effect가 두 번 실행되면 먼저 보낸 요청의 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [checkRequestId]);

  // 확인하기 전에는 로그인 화면이나 보호 화면으로 보내지 않는다
  if (checkStatus === 'checking') {
    return <AuthCheckScreen status="checking" />;
  }

  if (checkStatus === 'failed') {
    return (
      <AuthCheckScreen
        onRetry={() => {
          setCheckStatus('checking');
          setCheckRequestId((id) => id + 1);
        }}
        status="failed"
      />
    );
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
