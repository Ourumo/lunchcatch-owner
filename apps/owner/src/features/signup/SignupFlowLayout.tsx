import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { Toast } from '@repo/ui';

import { getMe, logout } from '@owner/api/auth';
import { submitSignupFlow } from '@owner/api/signupFlow';
import { useAuth } from '@owner/auth/useAuth';
import { StepActionBar } from '@owner/ui/StepActionBar/StepActionBar';
import { StepIndicator } from '@owner/ui/StepIndicator/StepIndicator';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import {
  getSignupStepPath,
  SIGNUP_COMPLETE_PATH,
  signupSteps,
} from './signupSteps';
import { useSignupFlow } from './useSignupFlow';

const SAVE_ERROR_TITLE = '저장에 실패했습니다';
const DEFAULT_SAVE_ERROR_MESSAGE = '잠시 후 다시 시도해 주세요.';
const RELOAD_ERROR_MESSAGE =
  '저장된 내용을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

// 저장이 서버의 진행 상태와 맞지 않아 거절된 경우. 진행 상태를 다시 불러와 이어갈 단계로 보낸다
const reloadMessages: Record<string, string> = {
  // 버전 충돌. 다른 기기나 창에서 먼저 저장했다
  'STORE-001':
    '다른 곳에서 먼저 저장했어요. 저장된 내용을 다시 불러왔으니 확인해 주세요.',
  // 앞 단계 미완료, 진행 상태 없음, 최종 등록에 필요한 값 부족
  'STORE-002': '앞 단계가 저장되지 않아 이어서 진행할 단계로 옮겼어요.',
  'STORE-003': '앞 단계가 저장되지 않아 이어서 진행할 단계로 옮겼어요.',
  'STORE-015': '앞 단계가 저장되지 않아 이어서 진행할 단계로 옮겼어요.',
};

// 화면 검사로 미리 막지만, 사진을 올리지 못한 채 넘어가려 하면 서버가 거절한다. 지금 단계에 머문다
const stayMessages: Record<string, string> = {
  'STORE-010': '대표 이미지를 먼저 등록해 주세요.',
  'STORE-013': '사진이 없는 메뉴가 있어요. 메뉴 사진을 등록해 주세요.',
};

// 현재 URL로 단계를 찾아 헤더, 단계 표시, 단계 화면, 하단 이전·다음 버튼을 조합한다
export const SignupFlowLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { reload, setVersion, values, version } = useSignupFlow();
  const { clearOwner, setOwner } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ title: string; description: string }>();

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

  const goPrevious = async () => {
    setError(undefined);

    if (previousStep) {
      navigate(getSignupStepPath(previousStep));
      return;
    }

    // 첫 단계에서 뒤로 가면 입점 신청을 멈추고 로그인 화면으로 돌아간다.
    // 로그인한 채로는 로그인 화면에 들어갈 수 없어 로그아웃한다
    const result = await logout();

    if (!result.ok) {
      setError({
        title: '로그아웃에 실패했습니다',
        description: result.message ?? '잠시 후 다시 시도해 주세요.',
      });
      return;
    }

    clearOwner();
    navigate('/login', { replace: true });
  };

  // 저장 실패를 이유별로 안내한다. 응답을 받지 못했거나 화면 검사로 미리 막는 값이 거절되면(400) 입력값을 그대로 둔다
  const handleSaveFailure = async (code?: string) => {
    // 입점 신청 중이 아니다. 내 정보로 상태를 다시 받으면, 이미 ACTIVE면 RequireAuth가 홈으로 보낸다
    if (code === 'OWNER-002') {
      const result = await getMe();

      if (result.ok && result.data?.status !== 'ONBOARDING') {
        if (result.data) {
          setOwner(result.data);
        } else {
          clearOwner();
        }
        return;
      }
    }

    if (code && reloadMessages[code]) {
      const isReloaded = await reload();

      setError({
        title: SAVE_ERROR_TITLE,
        description: isReloaded ? reloadMessages[code] : RELOAD_ERROR_MESSAGE,
      });
      return;
    }

    setError({
      title: SAVE_ERROR_TITLE,
      description: (code && stayMessages[code]) ?? DEFAULT_SAVE_ERROR_MESSAGE,
    });
  };

  const handleNext = async () => {
    if (!canProceed || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    if (currentStep.save) {
      const saveResult = await currentStep.save(values, version);

      if (!saveResult.ok) {
        await handleSaveFailure(saveResult.code);
        setIsSubmitting(false);
        return;
      }

      setVersion(saveResult.data);
    }

    if (nextStep) {
      setIsSubmitting(false);
      navigate(getSignupStepPath(nextStep));
      return;
    }

    const result = await submitSignupFlow(values);
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.message) {
        setError({
          title: '등록 신청에 실패했습니다',
          description: result.message,
        });
      }
      return;
    }

    navigate(SIGNUP_COMPLETE_PATH, { replace: true });
  };

  return (
    <div className="min-h-dvh min-w-mobile-min">
      <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
        {/* 내용을 스크롤해도 제목과 진행 막대가 위에 붙어 있도록 고정한다 */}
        <div className="sticky top-0 z-10">
          <TopBar
            onBack={goPrevious}
            title={currentStep.title}
            trailing={
              // 진행 막대가 스크린 리더에 단계를 알리므로 숫자는 화면에만 보여준다
              <span
                aria-hidden="true"
                className="type-caption text-text-primary"
              >
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
        </div>
        {/* flex-1로 남은 높이를 채워, 내용이 짧아도 하단 버튼이 화면 아래에 붙게 한다 */}
        <main className="flex flex-1 flex-col gap-4">
          <Outlet />
          {error && (
            <div className="px-page">
              <Toast
                description={error.description}
                style={{ maxWidth: 'none' }}
                title={error.title}
                variant="danger"
              />
            </div>
          )}
        </main>
        <StepActionBar
          hint={currentStep.progressHint?.(values)}
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
