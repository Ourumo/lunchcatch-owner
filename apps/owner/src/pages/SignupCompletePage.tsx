import { useState } from 'react';

import { getMe } from '@owner/api/auth';
import { useAuth } from '@owner/auth/useAuth';

// 가게 최종 등록을 마친 뒤의 임시 화면. 등록 정보 요약은 이후 작업에서 추가한다
// 등록을 마치면 로그인한 채 ACTIVE가 되므로 로그인 화면이 아닌 홈으로 보낸다
const SignupCompletePage = () => {
  const { clearOwner, setOwner } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  // 최종 등록은 서버의 점주 상태만 바꾸므로 내 정보 조회로 로그인 상태를 다시 받는다.
  // 제출하자마자 받으면 입점 신청 화면의 RequireAuth가 이 화면 대신 홈으로 보내므로, 홈으로 갈 때 받는다.
  // ACTIVE로 바뀌면 RequireAuth가 홈으로, 로그인이 끊겼으면 로그인 화면으로 보낸다
  const goHome = async () => {
    setIsLoading(true);
    setHasFailed(false);

    const result = await getMe();

    setIsLoading(false);

    if (!result.ok || result.data?.status === 'ONBOARDING') {
      setHasFailed(true);
      return;
    }

    if (result.data) {
      setOwner(result.data);
    } else {
      clearOwner();
    }
  };

  return (
    <div className="min-h-dvh min-w-mobile-min">
      <main className="mx-auto flex min-h-dvh max-w-mobile flex-col items-center gap-3 bg-bg-page px-page pt-20 text-center">
        <h1 className="type-h1 text-text-primary">매장 등록이 완료되었어요!</h1>
        <button
          className="type-body-sm font-semibold text-text-primary underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={goHome}
          type="button"
        >
          홈으로
        </button>
        {hasFailed && (
          <p className="type-body-sm text-status-danger-fg" role="alert">
            홈으로 가지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}
      </main>
    </div>
  );
};

export default SignupCompletePage;
