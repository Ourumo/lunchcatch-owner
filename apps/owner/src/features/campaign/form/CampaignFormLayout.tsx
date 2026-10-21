import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { Toast } from '@repo/ui';

import {
  type CampaignStepKey,
  type CampaignValues,
  requestCampaignActivation,
  saveBudgetStep,
  saveCouponStep,
  savePosterStep,
  saveTargetStep,
} from '@owner/api/campaign';
import type { ApiResult } from '@owner/api/types';
import { StepActionBar } from '@owner/ui/StepActionBar/StepActionBar';
import { StepIndicator } from '@owner/ui/StepIndicator/StepIndicator';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import {
  campaignSteps,
  getCampaignEditPath,
  isValueStep,
  NEW_CAMPAIGN_ID,
} from './campaignSteps';
import { useCampaignForm } from './useCampaignForm';

const SAVE_FAILED_MESSAGE = '잠시 후 다시 시도해 주세요.';

interface ActionError {
  title: string;
  message: string;
  // 넘기면 닫기 버튼을 두고, 닫을 때 부른다
  onClose?: () => void;
}

// 현재 URL로 단계를 찾아 헤더, 단계 표시, 단계 화면, 하단 이전·다음 버튼을 조합한다.
// 다음으로 넘어갈 때마다 그 단계 값을 DRAFT에 저장해, 중간에 나가도 저장한 단계까지는 남는다.
// 마지막 확인 단계에서는 활성화를 요청하고 완료 화면으로 간다
export const CampaignFormLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { campaignId, platformSettings, reload, updateStepValues, values } =
    useCampaignForm();
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<ActionError>();

  const currentIndex = campaignSteps.findIndex(
    (step) => getCampaignEditPath(campaignId, step) === pathname,
  );
  const currentStep = campaignSteps.at(currentIndex);

  // 새 캠페인은 1단계를 저장해야 DRAFT가 생겨 다음 단계를 저장할 수 있다
  if (
    currentIndex === -1 ||
    !currentStep ||
    (campaignId === NEW_CAMPAIGN_ID && currentIndex > 0)
  ) {
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

  const clearMessages = () => setActionError(undefined);

  const goPrevious = () => {
    clearMessages();
    // 첫 단계에서 뒤로 가면 저장하지 않고 목록으로 돌아간다. 이미 저장한 단계는 DRAFT에 남는다
    navigate(
      previousStep
        ? getCampaignEditPath(campaignId, previousStep)
        : '/campaigns',
    );
  };

  // 3·4단계 저장 응답은 서버에 저장된 현재 값이라 그 값으로 입력값을 맞춘다
  const applySavedValues = <TStepKey extends 'target' | 'budget'>(
    stepKey: TStepKey,
    result: ApiResult<CampaignValues[TStepKey]>,
  ): ApiResult<string> => {
    if (!result.ok) {
      return result;
    }

    updateStepValues(stepKey, result.data);

    return { ok: true, data: campaignId };
  };

  // 단계 값을 저장하고 이어 갈 캠페인 ID를 돌려준다. 1단계는 서버가 DRAFT의 ID를 정한다
  const saveCurrentStep = async (
    stepKey: CampaignStepKey,
  ): Promise<ApiResult<string>> => {
    if (stepKey === 'coupon') {
      return saveCouponStep(values.coupon);
    }

    if (stepKey === 'target') {
      return applySavedValues(
        'target',
        await saveTargetStep(campaignId, values.target),
      );
    }

    if (stepKey === 'budget') {
      return applySavedValues(
        'budget',
        await saveBudgetStep(campaignId, values.budget),
      );
    }

    // 남은 단계는 2단계 포스터다
    const result = await savePosterStep(campaignId, values.poster);

    return result.ok ? { ok: true, data: campaignId } : result;
  };

  const requestActivation = async () => {
    setIsSaving(true);
    const result = await requestCampaignActivation(campaignId);
    setIsSaving(false);

    if (!result.ok) {
      const title = '활성화를 요청하지 못했습니다';
      const message = result.message ?? SAVE_FAILED_MESSAGE;

      // 저장된 포스터가 없으면 안내를 남긴 채 포스터 단계로 보낸다
      const posterStep = campaignSteps.find(({ id }) => id === 'poster');

      if (result.code === 'POSTER-021' && posterStep) {
        setActionError({ title, message });
        navigate(getCampaignEditPath(campaignId, posterStep));
        return;
      }

      // 그사이 상태가 바뀌었거나 캠페인을 찾을 수 없다. 안내를 읽고 닫으면 캠페인을 다시 불러온다
      if (result.code === 'CAMPAIGN-006' || result.code === 'CAMPAIGN-005') {
        setActionError({
          title,
          message,
          onClose: () => {
            clearMessages();
            reload();
          },
        });
        return;
      }

      setActionError({ title, message });
      return;
    }

    // 자동 검수는 실패하지 않지만, 대기 중이 되지 않았으면 완료 화면으로 가지 않는다
    if (result.data !== 'SCHEDULED') {
      setActionError({
        title: '활성화를 요청하지 못했습니다',
        message: SAVE_FAILED_MESSAGE,
      });
      return;
    }

    // 완료 화면에서 뒤로 가도 이미 요청한 등록 화면으로 돌아오지 않게 기록을 바꿔치기한다
    navigate(`/campaigns/${campaignId}/complete`, { replace: true });
  };

  const handleNext = async () => {
    if (!canProceed || isSaving) {
      return;
    }

    clearMessages();

    if (!nextStep) {
      await requestActivation();
      return;
    }

    if (!isValueStep(currentStep.id)) {
      navigate(getCampaignEditPath(campaignId, nextStep));
      return;
    }

    setIsSaving(true);
    const result = await saveCurrentStep(currentStep.id);
    setIsSaving(false);

    if (!result.ok) {
      setActionError({
        title: '저장하지 못했습니다',
        message: result.message ?? SAVE_FAILED_MESSAGE,
      });
      return;
    }

    // 1단계를 처음 저장하면 서버가 만든 DRAFT의 ID로 이어 간다. 뒤로 가기로 ID 없는 1단계에 돌아오지 않게 기록을 바꿔치기한다
    navigate(getCampaignEditPath(result.data, nextStep), {
      replace: campaignId === NEW_CAMPAIGN_ID,
    });
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
        {actionError && (
          <div className="px-page">
            <Toast
              description={actionError.message}
              onClose={actionError.onClose}
              style={{ maxWidth: 'none' }}
              title={actionError.title}
              variant="danger"
            />
          </div>
        )}
      </main>
      <StepActionBar
        hint={currentStep.progressHint?.(values, platformSettings)}
        isNextDisabled={!canProceed}
        isNextLoading={isSaving}
        nextLabel={nextStep ? '다음' : '활성화 요청'}
        onNext={handleNext}
        onPrevious={previousStep ? goPrevious : undefined}
      />
    </>
  );
};
