import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

import { completeTutorial, getMe, type LoginResponse } from '@owner/api/auth';
import { onAuthChanged } from '@owner/api/authChannel';
import { onSessionExpired } from '@owner/api/client';
import { useCountdown } from '@owner/hooks/useCountdown';
import { AuthCheckScreen } from '@owner/ui/AuthCheckScreen/AuthCheckScreen';

import { getAccessLevel, homePathByAccess } from './accessLevel';
import { AuthContext } from './authContext';

// 내 정보 조회로 로그인 상태를 확인하는 중(checking), 확인하지 못함(failed),
// 요청 제한(429)에 걸려 확인하지 못함(rateLimited), 확인함(done)
type CheckStatus = 'checking' | 'failed' | 'rateLimited' | 'done';

// 앱을 시작할 때 내 정보 조회로 로그인 상태를 되살린다.
// 인증은 서버가 HttpOnly 쿠키로 관리해 화면이 쿠키를 읽을 수 없으므로 새로고침할 때마다 서버에 묻는다
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('checking');
  // 로그인 전이면 null
  const [owner, setOwner] = useState<LoginResponse | null>(null);
  // 값이 바뀌면 다시 확인한다
  const [checkRequestId, setCheckRequestId] = useState(0);
  // 요청 제한이 풀릴 때까지 남은 초. 그동안은 다시 확인해도 같은 이유로 거절돼 다시 시도를 막는다
  const { remainingSeconds, start: startRetryWait } = useCountdown();

  // 다른 탭의 알림으로 보낸 내 정보 조회 중 마지막 것. 알림이 연달아 오면 마지막 조회 결과만 쓴다
  const latestSyncRef = useRef<Promise<unknown> | null>(null);
  // 확인 요청을 보낸 뒤 다른 탭에서 로그인·로그아웃했는지. 그 응답은 바뀌기 전 쿠키로 받은 것이라 다시 확인한다
  const changedWhileCheckingRef = useRef(false);

  // 재발급까지 실패해 다시 로그인해야 하면 로그인 상태를 지운다. RequireAuth가 로그인 화면으로 보낸다
  useEffect(() => onSessionExpired(() => setOwner(null)), []);

  // 다른 탭에서 로그인·로그아웃하면 내 정보 조회로 로그인 상태를 다시 받는다.
  // 받기 전과 후가 모두 로그인 상태면 다른 계정으로 바뀌었을 수 있다. 로그인 상태에는 계정을 구분할 값이 없고
  // 화면마다 이전 계정의 데이터를 들고 있으므로, 상태에 맞는 첫 화면을 새로 연다.
  // 그 밖에는 로그인 상태만 바꾸고 RequireAuth가 상태에 맞는 화면으로 보낸다.
  // 확인 중이면 바뀐 것만 기록해 두고 확인이 끝난 뒤 다시 확인한다.
  // 확인하지 못한 화면이면 다시 시도할 때 바뀐 쿠키로 묻게 되어 무시하고, 조회가 실패하면 지금 상태를 그대로 둔다
  const syncWithOtherTab = useEffectEvent(async () => {
    if (checkStatus === 'checking') {
      changedWhileCheckingRef.current = true;
      return;
    }

    if (checkStatus !== 'done') {
      return;
    }

    const wasLoggedIn = owner !== null;
    const sync = getMe();

    latestSyncRef.current = sync;
    const result = await sync;

    if (latestSyncRef.current !== sync || !result.ok) {
      return;
    }

    if (wasLoggedIn && result.data) {
      window.location.replace(homePathByAccess[getAccessLevel(result.data)]);
      return;
    }

    setOwner(result.data);
  });

  useEffect(() => onAuthChanged(() => void syncWithOtherTab()), []);

  const handleCheckResult = useEffectEvent(
    (result: Awaited<ReturnType<typeof getMe>>) => {
      if (!result.ok) {
        // 자동으로 다시 확인하지 않는다. 풀린 뒤 점주가 다시 시도를 누른다
        if (result.retryAfterSeconds !== undefined) {
          setCheckStatus('rateLimited');
          startRetryWait(result.retryAfterSeconds);
          return;
        }

        setCheckStatus('failed');
        return;
      }

      if (changedWhileCheckingRef.current) {
        setCheckRequestId((id) => id + 1);
        return;
      }

      setOwner(result.data);
      setCheckStatus('done');
    },
  );

  useEffect(() => {
    let ignore = false;

    changedWhileCheckingRef.current = false;
    getMe().then((result) => {
      if (!ignore) {
        handleCheckResult(result);
      }
    });

    // 개발 모드에서 effect가 두 번 실행되면 먼저 보낸 요청의 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [checkRequestId]);

  // 로그인 상태의 tutorialViewed를 먼저 바꿔 튜토리얼을 내리고, 완료를 서버에 저장한다.
  // 저장이 계속 실패해도 튜토리얼에 막혀 앱을 못 쓰는 일이 없게, 이번 접속에서는 결과와 상관없이 본 것으로 둔다.
  // 브라우저 저장소에는 따로 두지 않아, 저장에 실패했으면 새로고침이나 다시 로그인할 때 서버 값으로 다시 보여준다.
  // ACTIVE가 아니라고 거절되면(OWNER-002) 내 정보 조회로 상태를 다시 받아, RequireAuth가 상태에 맞는 화면으로 보낸다
  const completeOwnerTutorial = async () => {
    setOwner((prev) => prev && { ...prev, tutorialViewed: true });

    const result = await completeTutorial();

    if (!result.ok && result.code === 'OWNER-002') {
      const me = await getMe();

      if (me.ok) {
        setOwner(me.data);
      }
    }
  };

  // 확인하기 전에는 로그인 화면이나 보호 화면으로 보내지 않는다
  if (checkStatus === 'checking') {
    return <AuthCheckScreen status="checking" />;
  }

  if (checkStatus === 'failed' || checkStatus === 'rateLimited') {
    return (
      <AuthCheckScreen
        isRateLimited={checkStatus === 'rateLimited'}
        onRetry={() => {
          setCheckStatus('checking');
          setCheckRequestId((id) => id + 1);
        }}
        remainingSeconds={remainingSeconds}
        status="failed"
      />
    );
  }

  return (
    <AuthContext
      value={{
        owner,
        setOwner,
        clearOwner: () => setOwner(null),
        completeTutorial: completeOwnerTutorial,
      }}
    >
      {children}
    </AuthContext>
  );
};
