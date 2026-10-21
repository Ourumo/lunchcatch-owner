import { isImageAttached, isImageUploading } from '@owner/api/imageUpload';
import {
  getStoreRequiredChecks,
  hasAgreedRequiredTerms,
  isHoursStepComplete,
  isStoreStepComplete,
  isValidTimeRange,
  ownerTerms,
  saveHoursStep,
  saveLocationStep,
  saveStoreStep,
  saveTermsStep,
  type SignupFlowValues,
} from '@owner/api/signupFlow';
import type { ApiResult } from '@owner/api/types';

export type SignupStepId = keyof SignupFlowValues;

export interface SignupStep {
  id: SignupStepId;
  // /signup 아래의 경로
  path: string;
  title: string;
  // 다음 단계로 넘어갈 수 있는지. 없으면 항상 넘어갈 수 있다
  canProceed?: (values: SignupFlowValues) => boolean;
  // 하단 버튼 위에 보여줄 진행 상황 안내. 다 채운 뒤에도 완료 문구를 보여준다
  progressHint?: (values: SignupFlowValues) => string;
  // "다음"을 누르면 이 단계를 서버에 저장한다. 성공해야 다음 단계로 넘어가고, 받은 입점 진행 버전을 다음 저장에 보낸다
  save?: (
    values: SignupFlowValues,
    version: number,
  ) => Promise<ApiResult<number>>;
}

const getTermsProgressHint = ({ terms }: SignupFlowValues) => {
  const requiredTerms = ownerTerms.filter((item) => item.required);
  const agreedCount = requiredTerms.filter((item) => terms[item.id]).length;

  return agreedCount === requiredTerms.length
    ? `필수 약관 ${requiredTerms.length}개에 모두 동의했어요`
    : `필수 약관 ${requiredTerms.length}개 중 ${agreedCount}개에 동의했어요`;
};

const getStoreProgressHint = ({ store, business }: SignupFlowValues) => {
  const checks = getStoreRequiredChecks(store, business);
  const filledCount = checks.filter(Boolean).length;

  return filledCount === checks.length
    ? `필수 항목 ${checks.length}개를 모두 입력했어요`
    : `필수 항목 ${checks.length}개 중 ${filledCount}개를 입력했어요`;
};

const getHoursProgressHint = ({ hours }: SignupFlowValues) => {
  if (hours.openDays.length === 0) {
    return '영업 요일을 하루 이상 골라주세요';
  }

  if (!hours.openTime || !hours.closeTime) {
    return '영업 시작·종료 시간을 입력해주세요';
  }

  return isValidTimeRange(hours.openTime, hours.closeTime)
    ? '영업시간을 모두 입력했어요'
    : '종료 시간을 시작 시간보다 늦게 설정해주세요';
};

// 매장 사진은 고르자마자 올리므로, 올리는 중이거나 올리지 못한 사진이 있으면 먼저 알린다
const getImagesProgressHint = ({ images }: SignupFlowValues) => {
  if (images.interiorImages.some(isImageUploading)) {
    return '매장 사진을 올리고 있어요';
  }

  if (images.interiorImages.some(({ status }) => status === 'failed')) {
    return '올리지 못한 매장 사진을 다시 올리거나 빼주세요';
  }

  return images.logoImage
    ? '대표 이미지를 등록했어요'
    : '대표 이미지를 등록해주세요';
};

// 배열 순서대로 진행한다. 단계를 추가할 때는 이 배열, SignupFlowValues, 라우터의 단계 화면에 함께 추가한다
export const signupSteps: SignupStep[] = [
  {
    id: 'terms',
    path: 'terms',
    title: '약관 동의',
    canProceed: ({ terms }) => hasAgreedRequiredTerms(terms),
    progressHint: getTermsProgressHint,
    save: saveTermsStep,
  },
  {
    id: 'store',
    path: 'store',
    title: '가게 기본 정보',
    canProceed: ({ store, business }) => isStoreStepComplete(store, business),
    progressHint: getStoreProgressHint,
    save: ({ store, business }, version) =>
      saveStoreStep(store, business, version),
  },
  {
    id: 'location',
    path: 'location',
    title: '매장 위치 등록',
    canProceed: ({ location }) => location.place !== null,
    progressHint: ({ location }) =>
      location.place ? '가게 위치를 선택했어요' : '가게 위치를 선택해주세요',
    save: ({ location }, version) => saveLocationStep(location, version),
  },
  {
    id: 'hours',
    path: 'hours',
    title: '영업시간 설정',
    canProceed: ({ hours }) => isHoursStepComplete(hours),
    progressHint: getHoursProgressHint,
    save: ({ hours }, version) => saveHoursStep(hours, version),
  },
  {
    id: 'images',
    path: 'images',
    title: '매장 사진 등록',
    // 매장 사진은 선택이지만, 고른 사진은 모두 가게에 붙어야 넘어간다
    canProceed: ({ images }) =>
      images.logoImage !== null && images.interiorImages.every(isImageAttached),
    progressHint: getImagesProgressHint,
  },
  {
    id: 'menu',
    path: 'menu',
    title: '대표 메뉴 등록',
    // 선택 단계라 다음 버튼 조건을 두지 않는다
    progressHint: ({ menu }) =>
      menu.menus.length > 0
        ? `대표 메뉴 ${menu.menus.length}개를 등록했어요`
        : '대표 메뉴는 나중에 등록해도 돼요',
  },
];

export const getSignupStepPath = (step: SignupStep) => `/signup/${step.path}`;

export const SIGNUP_COMPLETE_PATH = '/signup/complete';
