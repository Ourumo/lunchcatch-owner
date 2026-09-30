import type { SignupFlowValues } from '@owner/api/signupFlow';

export type SignupStepId = keyof SignupFlowValues;

export interface SignupStep {
  id: SignupStepId;
  // /signup 아래의 경로
  path: string;
  title: string;
  // 다음 단계로 넘어갈 수 있는지. 없으면 항상 넘어갈 수 있다
  canProceed?: (values: SignupFlowValues) => boolean;
}

// 배열 순서대로 진행한다. 단계를 추가할 때는 이 배열, SignupFlowValues, 라우터의 단계 화면에 함께 추가한다
export const signupSteps: SignupStep[] = [
  { id: 'terms', path: 'terms', title: '약관 동의' },
  { id: 'store', path: 'store', title: '가게 기본 정보' },
  { id: 'business', path: 'business', title: '사업자 정보' },
  { id: 'hours', path: 'hours', title: '영업시간' },
  { id: 'menu', path: 'menu', title: '가게 이미지·대표 메뉴' },
];

export const getSignupStepPath = (step: SignupStep) => `/signup/${step.path}`;

export const SIGNUP_COMPLETE_PATH = '/signup/complete';
