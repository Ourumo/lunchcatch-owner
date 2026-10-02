import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import {
  type CampaignStepId,
  campaignSteps,
} from '@owner/features/campaign/form/campaignSteps';
import { SignupFlowLayout } from '@owner/features/signup/SignupFlowLayout';
import { SignupFlowProvider } from '@owner/features/signup/SignupFlowProvider';
import {
  getSignupStepPath,
  SIGNUP_COMPLETE_PATH,
  type SignupStepId,
  signupSteps,
} from '@owner/features/signup/signupSteps';
import AuthLayout from '@owner/layout/AuthLayout';
import MainLayout from '@owner/layout/MainLayout';
import CampaignCouponPage from '@owner/pages/CampaignCouponPage';
import CampaignDetailPage from '@owner/pages/CampaignDetailPage';
import CampaignFormPage from '@owner/pages/CampaignFormPage';
import CampaignListPage from '@owner/pages/CampaignListPage';
import CampaignNewPage from '@owner/pages/CampaignNewPage';
import CampaignTargetPage from '@owner/pages/CampaignTargetPage';
import LoginPage from '@owner/pages/LoginPage';
import SignupCompletePage from '@owner/pages/SignupCompletePage';
import SignupPage from '@owner/pages/SignupPage';
import SignupStorePage from '@owner/pages/SignupStorePage';
import SignupTermsPage from '@owner/pages/SignupTermsPage';

// 단계별 화면. 아직 없는 단계는 임시 문구를 보여준다
const stepPages: Partial<Record<SignupStepId, ReactNode>> = {
  terms: <SignupTermsPage />,
  store: <SignupStorePage />,
};

// 캠페인 등록 단계별 화면. 아직 없는 단계는 임시 문구를 보여준다
const campaignStepPages: Partial<Record<CampaignStepId, ReactNode>> = {
  coupon: <CampaignCouponPage />,
  target: <CampaignTargetPage />,
};

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
      element: stepPages[step.id] ?? (
        <p className="px-page py-5 type-body text-text-secondary">
          {step.title} 화면 준비 중
        </p>
      ),
    })),
  },
  { path: SIGNUP_COMPLETE_PATH, element: <SignupCompletePage /> },
  {
    element: <MainLayout />,
    children: [
      { path: '/campaigns', element: <CampaignListPage /> },
      { path: '/campaigns/new', element: <CampaignNewPage /> },
      { path: '/campaigns/:id', element: <CampaignDetailPage /> },
      {
        path: '/campaigns/:id/edit',
        element: <CampaignFormPage />,
        children: [
          {
            index: true,
            element: <Navigate replace to={campaignSteps[0].path} />,
          },
          ...campaignSteps.map((step) => ({
            path: step.path,
            element: campaignStepPages[step.id] ?? (
              <p className="px-page type-body text-text-secondary">
                {step.title} 화면 준비 중
              </p>
            ),
          })),
        ],
      },
    ],
  },
]);
