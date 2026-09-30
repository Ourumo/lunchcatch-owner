import { createBrowserRouter, Navigate } from 'react-router';

import { SignupFlowLayout } from '@owner/features/signup/SignupFlowLayout';
import { SignupFlowProvider } from '@owner/features/signup/SignupFlowProvider';
import {
  getSignupStepPath,
  SIGNUP_COMPLETE_PATH,
  signupSteps,
} from '@owner/features/signup/signupSteps';
import AuthLayout from '@owner/layout/AuthLayout';
import LoginPage from '@owner/pages/LoginPage';
import SignupCompletePage from '@owner/pages/SignupCompletePage';
import SignupPage from '@owner/pages/SignupPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate replace to="/login" /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    // 단계를 오가도 입력값이 유지되도록 모든 단계를 하나의 Provider 아래에 둔다
    element: (
      <SignupFlowProvider>
        <SignupFlowLayout />
      </SignupFlowProvider>
    ),
    children: signupSteps.map((step) => ({
      path: getSignupStepPath(step),
      // 단계별 화면을 만들기 전까지 쓰는 임시 화면
      element: (
        <p className="px-page py-5 type-body text-text-secondary">
          {step.title} 화면 준비 중
        </p>
      ),
    })),
  },
  { path: SIGNUP_COMPLETE_PATH, element: <SignupCompletePage /> },
]);
