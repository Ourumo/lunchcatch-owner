import { type ReactNode, useEffect, useEffectEvent, useState } from 'react';
import { useNavigate } from 'react-router';

import {
  getSignupProgress,
  type SignupFlowValues,
  type SignupProgress,
} from '@owner/api/signupFlow';

import {
  SignupFlowContext,
  type SignupFlowContextValue,
} from './signupFlowContext';
import { SignupFlowStatus } from './SignupFlowStatus';
import { getSignupStepPath, signupSteps } from './signupSteps';

// 회원가입 플로우의 모든 단계 입력값을 한곳에 모아, 단계를 오가도 값이 유지되게 한다.
// 들어올 때 서버에 저장한 값과 진행 상태를 불러와, 나갔다 다시 들어와도 저장한 값을 채우고 이어갈 단계로 보낸다
export const SignupFlowProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  // 불러오기 전이면 null
  const [values, setValues] = useState<SignupFlowValues | null>(null);
  const [isLoadFailed, setIsLoadFailed] = useState(false);
  // 값이 바뀌면 다시 불러온다
  const [loadRequestId, setLoadRequestId] = useState(0);
  const [version, setVersion] = useState(0);

  // 서버에 저장한 값으로 입력값과 버전을 바꾸고, 들어온 주소와 상관없이 서버가 정한 이어갈 단계로 보낸다.
  // 로그인하면 늘 약관 동의 주소로 들어온다
  const applyProgress = (progress: SignupProgress) => {
    setValues(progress.values);
    setVersion(progress.version);

    const resumeStep = signupSteps.find(({ id }) => id === progress.resumeStep);

    if (resumeStep) {
      navigate(getSignupStepPath(resumeStep), { replace: true });
    }
  };

  const handleProgressResult = useEffectEvent(
    (result: Awaited<ReturnType<typeof getSignupProgress>>) => {
      if (!result.ok) {
        setIsLoadFailed(true);
        return;
      }

      applyProgress(result.data);
    },
  );

  // 저장이 진행 상태와 맞지 않아 거절되면 다시 불러온다. 화면은 그대로 두어 불러온 뒤 안내를 이어서 보여준다
  const reload = async () => {
    const result = await getSignupProgress();

    if (result.ok) {
      applyProgress(result.data);
    }

    return result.ok;
  };

  useEffect(() => {
    let ignore = false;

    getSignupProgress().then((result) => {
      if (!ignore) {
        handleProgressResult(result);
      }
    });

    // 개발 모드에서 effect가 두 번 실행되면 먼저 보낸 요청의 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [loadRequestId]);

  if (!values) {
    return (
      <SignupFlowStatus
        onRetry={() => {
          setIsLoadFailed(false);
          setLoadRequestId((id) => id + 1);
        }}
        status={isLoadFailed ? 'error' : 'loading'}
      />
    );
  }

  const updateStepValues: SignupFlowContextValue['updateStepValues'] = (
    stepId,
    patch,
  ) => {
    setValues(
      (prev) =>
        prev && {
          ...prev,
          [stepId]: {
            ...prev[stepId],
            ...(typeof patch === 'function' ? patch(prev[stepId]) : patch),
          },
        },
    );
  };

  return (
    <SignupFlowContext
      value={{ reload, setVersion, updateStepValues, values, version }}
    >
      {children}
    </SignupFlowContext>
  );
};
