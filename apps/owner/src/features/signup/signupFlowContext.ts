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
}

export const SignupFlowContext = createContext<SignupFlowContextValue | null>(
  null,
);
