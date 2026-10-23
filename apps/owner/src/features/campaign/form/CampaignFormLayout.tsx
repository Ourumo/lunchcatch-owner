import { useLayoutEffect, useRef, useState } from 'react';
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
import { isPosterComplete } from '@owner/api/poster';
import type { ApiResult } from '@owner/api/types';
import { StepActionBar } from '@owner/ui/StepActionBar/StepActionBar';
import { StepIndicator } from '@owner/ui/StepIndicator/StepIndicator';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import {
  campaignSteps,
  getCampaignEditPath,
  isFromReview,
  isValueStep,
  NEW_CAMPAIGN_ID,
} from './campaignSteps';
import { useCampaignForm } from './useCampaignForm';
import {
  getBalanceBlockReason,
  getRequiredPoints,
  type ReviewOutletContext,
  useReviewBalance,
} from './useReviewBalance';

const SAVE_FAILED_MESSAGE = '잠시 후 다시 시도해 주세요.';
const POSTER_REFRESH_FAILED_MESSAGE =
  '바꾼 내용을 포스터에 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.';

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
  const { key: locationKey, pathname, state } = useLocation();
  const {
    campaignId,
    platformSettings,
    reload,
    setPoster,
    updateStepValues,
    values,
  } = useCampaignForm();
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<ActionError>();
  // 확인 단계에서 수정하러 들어갈 때의 값. 저장하지 않고 확인 단계로 돌아오면 이 값으로 되돌린다
  const valuesBeforeEditRef = useRef<CampaignValues | null>(null);

  const currentIndex = campaignSteps.findIndex(
    (step) => getCampaignEditPath(campaignId, step) === pathname,
  );
  const currentStep = campaignSteps.at(currentIndex);
  // 확인 단계에서 수정을 눌러 들어온 단계. 저장하면 확인 단계로 바로 돌아간다
  const isEditingFromReview =
    currentStep !== undefined &&
    isFromReview(state) &&
    isValueStep(currentStep.id);
  const isReview = currentStep?.id === 'review';
  // 확인 단계에서 활성화를 요청해도 되는지 보려고 잔액을 불러온다. 확인 단계 화면도 이 값을 받아 보여준다
  const { balance, retryBalance } = useReviewBalance(isReview, locationKey);

  // 이전 버튼, 상단 뒤로 가기, 브라우저 뒤로 가기 어느 쪽으로 돌아와도 고친 값을 버린다.
  // 확인 단계가 고친 값으로 한 번 그려지지 않도록 그리기 전에 되돌린다
  useLayoutEffect(() => {
    if (isEditingFromReview) {
      valuesBeforeEditRef.current ??= values;
      return;
    }

    const valuesBeforeEdit = valuesBeforeEditRef.current;

    if (isReview && valuesBeforeEdit) {
      valuesBeforeEditRef.current = null;
      updateStepValues('coupon', valuesBeforeEdit.coupon);
      updateStepValues('target', valuesBeforeEdit.target);
      updateStepValues('budget', valuesBeforeEdit.budget);
      setPoster(valuesBeforeEdit.poster);
    }
  }, [isEditingFromReview, isReview, setPoster, updateStepValues, values]);

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
  const requiredPoints = getRequiredPoints(values.budget, platformSettings);
  // 서버는 활성화 요청에서 잔액을 검사하지 않아, 확인 단계에서 앞 단계를 다 채웠으면 잔액을 보고 화면에서 막는다.
  // 1~4단계의 저장과 다음은 잔액과 상관없이 둔다
  const balanceBlockReason =
    isReview && canProceed && requiredPoints !== null
      ? getBalanceBlockReason(balance, requiredPoints)
      : null;
  const canGoNext = canProceed && balanceBlockReason === null;

  const clearMessages = () => setActionError(undefined);

  const goPrevious = () => {
    clearMessages();

    // 확인 단계에서 들어왔으면 저장하지 않고 그 확인 단계 기록으로 돌아간다
    if (isEditingFromReview) {
      navigate(-1);
      return;
    }

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

  // 서버는 포스터를 만들 때 할인 내용을 쿠폰 조건으로, 기간을 집행 기간으로 채운다. 그 값을 저장한 뒤
  // 같은 템플릿과 이미지로 포스터를 다시 만들어 덮어써야 포스터에 반영된다. 아직 포스터가 없으면 건너뛴다
  const refreshPoster = async (
    saved: ApiResult<string>,
  ): Promise<ApiResult<string>> => {
    if (!saved.ok || !isPosterComplete(values.poster)) {
      return saved;
    }

    const posterResult = await savePosterStep(saved.data, values.poster);

    return posterResult.ok
      ? saved
      : {
          ok: false,
          message: posterResult.message ?? POSTER_REFRESH_FAILED_MESSAGE,
        };
  };

  // 단계 값을 저장하고 이어 갈 캠페인 ID를 돌려준다. 1단계는 서버가 DRAFT의 ID를 정한다
  const saveCurrentStep = async (
    stepKey: CampaignStepKey,
  ): Promise<ApiResult<string>> => {
    if (stepKey === 'coupon') {
      const saved = await saveCouponStep(values.coupon);

      // 차례로 밟아 갈 때는 바로 다음 2단계에서 포스터를 저장하므로, 확인 단계에서 들어왔을 때만 다시 만든다
      return isEditingFromReview ? refreshPoster(saved) : saved;
    }

    if (stepKey === 'target') {
      return applySavedValues(
        'target',
        await saveTargetStep(campaignId, values.target),
      );
    }

    if (stepKey === 'budget') {
      // 포스터(2단계)는 집행 기간보다 먼저 만들어 기간이 비어 있으므로, 집행 기간을 저장할 때마다 다시 만든다
      return refreshPoster(
        applySavedValues(
          'budget',
          await saveBudgetStep(campaignId, values.budget),
        ),
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

      if (result.code === 'POSTER-020' && posterStep) {
        setActionError({ title, message });
        navigate(getCampaignEditPath(campaignId, posterStep));
        return;
      }

      // 자동 검수에 실패해 작성 중으로 남았다. 사진을 바꿔야 통과하면 사유를 남긴 채 포스터 단계로 보내고,
      // 검수 도구 장애처럼 다시 요청하면 되는 실패는 확인 단계에 남긴다
      const moderationTitle = '포스터가 검수를 통과하지 못했습니다';

      if (result.code === 'MODERATION_FIX_POSTER' && posterStep) {
        setActionError({ title: moderationTitle, message });
        navigate(getCampaignEditPath(campaignId, posterStep));
        return;
      }

      if (result.code === 'MODERATION_RETRY') {
        setActionError({ title: moderationTitle, message });
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

    // 완료 화면에서 뒤로 가도 이미 요청한 등록 화면으로 돌아오지 않게 기록을 바꿔치기한다
    navigate(`/campaigns/${campaignId}/complete`, { replace: true });
  };

  const handleNext = async () => {
    if (!canGoNext || isSaving) {
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

    // 확인 단계에서 들어왔으면 그 확인 단계 기록으로 돌아가, 뒤로 가기로 수정 화면에 다시 오지 않게 한다
    if (isEditingFromReview) {
      // 저장한 값이라 확인 단계로 돌아가도 되돌리지 않는다
      valuesBeforeEditRef.current = null;
      navigate(-1);
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
        <Outlet
          context={{ balance, retryBalance } satisfies ReviewOutletContext}
        />
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
        hint={
          balanceBlockReason ??
          currentStep.progressHint?.(values, platformSettings)
        }
        isNextDisabled={!canGoNext}
        isNextLoading={isSaving}
        nextLabel={
          isEditingFromReview ? '저장' : nextStep ? '다음' : '활성화 요청'
        }
        onNext={handleNext}
        // 확인 단계에서 들어온 1단계는 이전 버튼으로 확인 단계에 돌아갈 수 있게 둔다
        onPrevious={
          previousStep || isEditingFromReview ? goPrevious : undefined
        }
      />
    </>
  );
};
