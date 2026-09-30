import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { Toast } from '@repo/ui';

import { submitSignupFlow } from '@owner/api/signupFlow';
import { StepActionBar } from '@owner/components/StepActionBar/StepActionBar';
import { StepIndicator } from '@owner/components/StepIndicator/StepIndicator';
import { TopBar } from '@owner/components/TopBar/TopBar';

import {
  getSignupStepPath,
  SIGNUP_COMPLETE_PATH,
  signupSteps,
} from './signupSteps';
import { useSignupFlow } from './useSignupFlow';

// 현재 URL로 단계를 찾아 헤더, 단계 표시, 단계 화면, 하단 이전·다음 버튼을 조합한다
export const SignupFlowLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { values } = useSignupFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const currentIndex = signupSteps.findIndex(
    (step) => getSignupStepPath(step) === pathname,
  );
  const currentStep = signupSteps.at(currentIndex);

  if (currentIndex === -1 || !currentStep) {
    return <Navigate replace to={getSignupStepPath(signupSteps[0])} />;
  }

  const previousStep =
    currentIndex > 0 ? signupSteps.at(currentIndex - 1) : undefined;
  const nextStep = signupSteps.at(currentIndex + 1);
  const canProceed = currentStep.canProceed?.(values) ?? true;

  const goPrevious = () => {
    setSubmitError(undefined);
    // 첫 단계에서 뒤로 가면 입점 신청을 멈추고 로그인 화면으로 돌아간다
    navigate(previousStep ? getSignupStepPath(previousStep) : '/login');
  };

  const handleNext = async () => {
    if (!canProceed || isSubmitting) {
      return;
    }

    if (nextStep) {
      navigate(getSignupStepPath(nextStep));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);
    const result = await submitSignupFlow(values);
    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    navigate(SIGNUP_COMPLETE_PATH, { replace: true });
  };

  return (
    <div className="min-h-dvh min-w-mobile-min bg-bg-page">
      <div className="mx-auto flex min-h-dvh max-w-mobile flex-col">
        <TopBar
          onBack={goPrevious}
          title={currentStep.title}
          trailing={
            // 진행 막대가 스크린 리더에 단계를 알리므로 숫자는 화면에만 보여준다
            <span aria-hidden="true" className="type-caption text-text-primary">
              <span className="font-semibold">{currentIndex + 1}</span> /{' '}
              {signupSteps.length}
            </span>
          }
        />
        <StepIndicator
          current={currentIndex + 1}
          label="회원가입 진행 단계"
          total={signupSteps.length}
          variant="attached"
        />
        {/* 하단 고정 버튼(StepActionBar)에 내용이 가려지지 않도록 비워둔다 */}
        <main className="flex flex-1 flex-col gap-4 pb-[calc(76px+env(safe-area-inset-bottom))]">
          <Outlet />
          {submitError && (
            <div className="px-page">
              <Toast
                description={submitError}
                style={{ maxWidth: 'none' }}
                title="등록 신청에 실패했습니다"
                variant="danger"
              />
            </div>
          )}
        </main>
        <StepActionBar
          isNextDisabled={!canProceed}
          isNextLoading={isSubmitting}
          nextLabel={nextStep ? '다음' : '등록 신청 완료'}
          onNext={handleNext}
          onPrevious={previousStep ? goPrevious : undefined}
        />
      </div>
    </div>
  );
};
