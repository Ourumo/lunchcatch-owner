import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { Toast } from '@repo/ui';

import { saveCampaignStep } from '@owner/api/campaign';
import { StepActionBar } from '@owner/components/StepActionBar/StepActionBar';
import { StepIndicator } from '@owner/components/StepIndicator/StepIndicator';
import { TopBar } from '@owner/components/TopBar/TopBar';

import {
  campaignSteps,
  getCampaignEditPath,
  isValueStep,
} from './campaignSteps';
import { useCampaignForm } from './useCampaignForm';

const SAVE_FAILED_MESSAGE = '잠시 후 다시 시도해 주세요.';

// 현재 URL로 단계를 찾아 헤더, 단계 표시, 단계 화면, 하단 이전·다음 버튼을 조합한다.
// 다음으로 넘어갈 때마다 그 단계 값을 DRAFT에 저장해, 중간에 나가도 저장한 단계까지는 남는다
export const CampaignFormLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { campaignId, platformSettings, values } = useCampaignForm();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const currentIndex = campaignSteps.findIndex(
    (step) => getCampaignEditPath(campaignId, step) === pathname,
  );
  const currentStep = campaignSteps.at(currentIndex);

  if (currentIndex === -1 || !currentStep) {
    return (
      <Navigate
        replace
        to={getCampaignEditPath(campaignId, campaignSteps[0])}
      />
    );
  }

  const previousStep =
    currentIndex > 0 ? campaignSteps.at(currentIndex - 1) : undefined;
  const nextStep = campaignSteps.at(currentIndex + 1);
  const canProceed = currentStep.canProceed?.(values, platformSettings) ?? true;

  const goPrevious = () => {
    setSaveError(undefined);
    // 첫 단계에서 뒤로 가면 저장하지 않고 목록으로 돌아간다. 이미 저장한 단계는 DRAFT에 남는다
    navigate(
      previousStep
        ? getCampaignEditPath(campaignId, previousStep)
        : '/campaigns',
    );
  };

  const handleNext = async () => {
    if (!canProceed || isSaving) {
      return;
    }

    setSaveError(undefined);

    if (isValueStep(currentStep.id)) {
      setIsSaving(true);
      const result = await saveCampaignStep(
        campaignId,
        currentStep.id,
        values[currentStep.id],
      );
      setIsSaving(false);

      if (!result.ok) {
        setSaveError(result.message ?? SAVE_FAILED_MESSAGE);
        return;
      }
    }

    // 확인 단계의 활성화 요청은 이후 단계에서 연결한다. 지금은 상세 화면으로 이동한다
    navigate(
      nextStep
        ? getCampaignEditPath(campaignId, nextStep)
        : `/campaigns/${campaignId}`,
    );
  };

  return (
    <>
      {/* 내용을 스크롤해도 제목과 진행 막대가 위에 붙어 있도록 고정한다 */}
      <div className="sticky top-0 z-10">
        <TopBar
          onBack={goPrevious}
          title="캠페인 만들기"
          trailing={
            // 진행 막대가 스크린 리더에 단계를 알리므로 숫자는 화면에만 보여준다
            <span aria-hidden="true" className="type-caption text-text-primary">
              <span className="font-semibold">{currentIndex + 1}</span> /{' '}
              {campaignSteps.length}
            </span>
          }
        />
        <StepIndicator
          current={currentIndex + 1}
          label="캠페인 등록 진행 단계"
          total={campaignSteps.length}
          variant="attached"
        />
      </div>
      {/* flex-1로 남은 높이를 채워, 내용이 짧아도 하단 버튼이 화면 아래에 붙게 한다 */}
      <main className="flex flex-1 flex-col gap-4 pt-5 pb-6">
        <h2 className="px-page text-h2-mobile font-bold text-text-primary">
          {currentStep.title}
        </h2>
        <Outlet />
        {saveError && (
          <div className="px-page">
            <Toast
              description={saveError}
              style={{ maxWidth: 'none' }}
              title="저장하지 못했습니다"
              variant="danger"
            />
          </div>
        )}
      </main>
      <StepActionBar
        hint={currentStep.progressHint?.(values, platformSettings)}
        isNextDisabled={!canProceed}
        isNextLoading={isSaving}
        nextLabel={nextStep ? '다음' : '완료'}
        onNext={handleNext}
        onPrevious={previousStep ? goPrevious : undefined}
      />
    </>
  );
};
