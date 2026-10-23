import { useState } from 'react';
import { Button } from '@repo/ui';

import { getMe } from '@owner/api/auth';
import { useAuth } from '@owner/auth/useAuth';

// 입점 신청 완료 화면의 "홈으로". 등록을 마치면 로그인한 채 ACTIVE가 되므로 로그인 화면이 아닌 홈으로 보낸다.
// 최종 등록은 서버의 점주 상태만 바꾸므로 내 정보 조회로 로그인 상태를 다시 받는다.
// 제출하자마자 받으면 입점 신청 화면의 RequireAuth가 완료 화면 대신 홈으로 보내므로, 홈으로 갈 때 받는다.
// ACTIVE로 바뀌면 RequireAuth가 홈으로, 로그인이 끊겼으면 로그인 화면으로 보낸다
export const SignupCompleteAction = () => {
  const { clearOwner, setOwner } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

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
    <div className="flex flex-col gap-3">
      {hasFailed && (
        <p
          className="text-center text-body-sm-mobile break-keep text-status-danger-fg"
          role="alert"
        >
          홈으로 가지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}
      <Button className="h-12 w-full" isLoading={isLoading} onClick={goHome}>
        홈으로
      </Button>
    </div>
  );
};
