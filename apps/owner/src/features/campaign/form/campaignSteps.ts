import {
  type CampaignStepKey,
  type CampaignValues,
  getBudgetRequiredChecks,
  getCouponRequiredChecks,
  isBudgetStepComplete,
  isCouponStepComplete,
  isValidTarget,
} from '@owner/api/campaign';
import type { PlatformSettings } from '@owner/api/platform';
import { isPosterComplete } from '@owner/api/poster';

// 등록 단계. 확인(review) 단계는 저장할 입력값이 없어 CampaignValues에 없다
export type CampaignStepId = CampaignStepKey | 'review';

export interface CampaignStep {
  id: CampaignStepId;
  // /campaigns/:id/edit 아래의 경로
  path: string;
  title: string;
  // 다음 단계로 넘어갈 수 있는지. 없으면 항상 넘어갈 수 있다
  canProceed?: (values: CampaignValues, settings: PlatformSettings) => boolean;
  // 하단 버튼 위에 보여줄 진행 상황 안내
  progressHint?: (values: CampaignValues, settings: PlatformSettings) => string;
}

const getProgressHint = (checks: boolean[]) => {
  const filledCount = checks.filter(Boolean).length;

  return filledCount === checks.length
    ? `필수 항목 ${checks.length}개를 모두 입력했어요`
    : `필수 항목 ${checks.length}개 중 ${filledCount}개를 입력했어요`;
};

// 활성화를 요청하려면 앞 단계가 모두 채워져 있어야 한다
const isCampaignReady = (
  { budget, coupon, poster, target }: CampaignValues,
  settings: PlatformSettings,
) =>
  isCouponStepComplete(coupon) &&
  isPosterComplete(poster) &&
  isValidTarget(target) &&
  isBudgetStepComplete(budget, settings);

// 배열 순서대로 진행한다 (쿠폰 조건 -> 포스터 -> 노출 대상 -> 하루 예산과 집행 기간 -> 확인).
// 단계를 추가할 때는 이 배열과 라우터의 단계 화면에 함께 추가한다
export const campaignSteps: CampaignStep[] = [
  {
    id: 'coupon',
    path: 'coupon',
    title: '쿠폰 조건',
    canProceed: ({ coupon }) => isCouponStepComplete(coupon),
    progressHint: ({ coupon }) =>
      getProgressHint(getCouponRequiredChecks(coupon)),
  },
  {
    id: 'poster',
    path: 'poster',
    title: '포스터',
    canProceed: ({ poster }) => isPosterComplete(poster),
    progressHint: ({ poster }) =>
      poster === null
        ? '템플릿을 골라 주세요'
        : isPosterComplete(poster)
          ? '포스터를 모두 채웠어요'
          : '할인 내용과 가게명을 입력해 주세요',
  },
  { id: 'target', path: 'target', title: '노출 대상' },
  {
    id: 'budget',
    path: 'budget',
    title: '하루 예산과 집행 기간',
    canProceed: ({ budget }, settings) =>
      isBudgetStepComplete(budget, settings),
    progressHint: ({ budget }, settings) =>
      getProgressHint(getBudgetRequiredChecks(budget, settings)),
  },
  {
    id: 'review',
    path: 'review',
    title: '확인',
    canProceed: (values, settings) => isCampaignReady(values, settings),
    progressHint: (values, settings) =>
      isCampaignReady(values, settings)
        ? '모든 단계를 채웠어요'
        : '채우지 않은 단계를 먼저 완성해 주세요',
  },
];

// 확인 단계를 뺀 나머지는 다음으로 넘어갈 때 그 단계 값을 DRAFT에 저장한다
export const isValueStep = (
  stepId: CampaignStepId,
): stepId is CampaignStepKey => stepId !== 'review';

export const getCampaignEditPath = (campaignId: string, step: CampaignStep) =>
  `/campaigns/${campaignId}/edit/${step.path}`;
