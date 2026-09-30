import { useContext } from 'react';

import { SignupFlowContext } from './signupFlowContext';

export const useSignupFlow = () => {
  const context = useContext(SignupFlowContext);

  if (!context) {
    throw new Error(
      'useSignupFlow는 SignupFlowProvider 안에서 사용해야 합니다.',
    );
  }

  return context;
};
