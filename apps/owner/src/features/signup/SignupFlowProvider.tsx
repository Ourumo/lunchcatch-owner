import { type ReactNode, useState } from 'react';

import type { SignupFlowValues } from '@owner/api/signupFlow';

import {
  SignupFlowContext,
  type SignupFlowContextValue,
} from './signupFlowContext';

const createInitialValues = (): SignupFlowValues => ({
  terms: {
    service: false,
    paidService: false,
    privacy: false,
    location: false,
    marketing: false,
  },
  store: { name: '', category: null, ownerName: '', phone: '' },
  location: { place: null },
  business: { registrationNumber: '' },
  hours: { openDays: [], openTime: '', closeTime: '' },
  images: { logoImage: null, interiorImages: [] },
  menu: { menus: [] },
});

// 회원가입 플로우의 모든 단계 입력값을 한곳에 모아, 단계를 오가도 값이 유지되게 한다
export const SignupFlowProvider = ({ children }: { children: ReactNode }) => {
  const [values, setValues] = useState(createInitialValues);

  const updateStepValues: SignupFlowContextValue['updateStepValues'] = (
    stepId,
    patch,
  ) => {
    setValues((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], ...patch },
    }));
  };

  return (
    <SignupFlowContext value={{ updateStepValues, values }}>
      {children}
    </SignupFlowContext>
  );
};
