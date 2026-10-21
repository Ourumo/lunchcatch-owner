import { createContext } from 'react';

import type { SignupFlowValues } from '@owner/api/signupFlow';

import type { SignupStepId } from './signupSteps';

export interface SignupFlowContextValue {
  values: SignupFlowValues;
  // 한 단계의 값 중 바뀐 필드만 넘기면 나머지 값은 유지된다.
  // 사진 업로드처럼 나중에 끝나는 작업은 그때의 최신 값을 받아 바뀐 필드를 돌려주는 함수를 넘긴다
  updateStepValues: <TStepId extends SignupStepId>(
    stepId: TStepId,
    patch:
      | Partial<SignupFlowValues[TStepId]>
      | ((
          current: SignupFlowValues[TStepId],
        ) => Partial<SignupFlowValues[TStepId]>),
  ) => void;
  // 다음 단계 저장에 보낼 입점 진행 버전. 단계를 저장할 때마다 서버가 준 값으로 바꾼다
  version: number;
  setVersion: (version: number) => void;
  // 서버에 저장한 값과 진행 상태를 다시 불러와 이어갈 단계로 보낸다. 불러오지 못하면 false
  reload: () => Promise<boolean>;
}

export const SignupFlowContext = createContext<SignupFlowContextValue | null>(
  null,
);
