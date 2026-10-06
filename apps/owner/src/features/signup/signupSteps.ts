import {
  getStoreRequiredChecks,
  hasAgreedRequiredTerms,
  isStoreStepComplete,
  ownerTerms,
  type SignupFlowValues,
} from '@owner/api/signupFlow';

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

// 배열 순서대로 진행한다. 단계를 추가할 때는 이 배열, SignupFlowValues, 라우터의 단계 화면에 함께 추가한다
export const signupSteps: SignupStep[] = [
  {
    id: 'terms',
    path: 'terms',
    title: '약관 동의',
    canProceed: ({ terms }) => hasAgreedRequiredTerms(terms),
    progressHint: getTermsProgressHint,
  },
  {
    id: 'store',
    path: 'store',
    title: '가게 기본 정보',
    canProceed: ({ store, business }) => isStoreStepComplete(store, business),
    progressHint: getStoreProgressHint,
  },
  {
    id: 'location',
    path: 'location',
    title: '매장 위치 등록',
    canProceed: ({ location }) => location.place !== null,
    progressHint: ({ location }) =>
      location.place ? '가게 위치를 선택했어요' : '가게 위치를 선택해주세요',
  },
  { id: 'hours', path: 'hours', title: '영업시간' },
  { id: 'menu', path: 'menu', title: '가게 이미지·대표 메뉴' },
];

export const getSignupStepPath = (step: SignupStep) => `/signup/${step.path}`;

export const SIGNUP_COMPLETE_PATH = '/signup/complete';
