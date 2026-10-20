import { createContext } from 'react';

import type { SignupFlowValues } from '@owner/api/signupFlow';

import type { SignupStepId } from './signupSteps';

export interface SignupFlowContextValue {
  values: SignupFlowValues;
  // 한 단계의 값 중 바뀐 필드만 넘기면 나머지 값은 유지된다
  updateStepValues: <TStepId extends SignupStepId>(
    stepId: TStepId,
    patch: Partial<SignupFlowValues[TStepId]>,
  ) => void;
  // 다음 단계 저장에 보낼 입점 진행 버전. 단계를 저장할 때마다 서버가 준 값으로 바꾼다
  version: number;
  setVersion: (version: number) => void;
}

export const SignupFlowContext = createContext<SignupFlowContextValue | null>(
  null,
);
