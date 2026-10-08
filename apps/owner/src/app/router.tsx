import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { ComingSoon } from '@owner/components/ComingSoon/ComingSoon';
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
import TabLayout from '@owner/layout/TabLayout';
import CampaignBudgetPage from '@owner/pages/CampaignBudgetPage';
import CampaignCompletePage from '@owner/pages/CampaignCompletePage';
import CampaignCouponPage from '@owner/pages/CampaignCouponPage';
import CampaignDetailPage from '@owner/pages/CampaignDetailPage';
import CampaignFormPage from '@owner/pages/CampaignFormPage';
import CampaignListPage from '@owner/pages/CampaignListPage';
import CampaignNewPage from '@owner/pages/CampaignNewPage';
import CampaignPosterPage from '@owner/pages/CampaignPosterPage';
import CampaignReviewPage from '@owner/pages/CampaignReviewPage';
import CampaignTargetPage from '@owner/pages/CampaignTargetPage';
import ComingSoonPage from '@owner/pages/ComingSoonPage';
import HomePage from '@owner/pages/HomePage';
import LoginPage from '@owner/pages/LoginPage';
import SignupCompletePage from '@owner/pages/SignupCompletePage';
import SignupHoursPage from '@owner/pages/SignupHoursPage';
import SignupImagesPage from '@owner/pages/SignupImagesPage';
import SignupLocationPage from '@owner/pages/SignupLocationPage';
import SignupMenuPage from '@owner/pages/SignupMenuPage';
import SignupPage from '@owner/pages/SignupPage';
import SignupStorePage from '@owner/pages/SignupStorePage';
import SignupTermsPage from '@owner/pages/SignupTermsPage';

// 단계별 화면. 아직 없는 단계는 임시 문구를 보여준다
const stepPages: Partial<Record<SignupStepId, ReactNode>> = {
  terms: <SignupTermsPage />,
  store: <SignupStorePage />,
  location: <SignupLocationPage />,
  hours: <SignupHoursPage />,
  images: <SignupImagesPage />,
  menu: <SignupMenuPage />,
};

// 캠페인 등록 단계별 화면. 단계를 추가하면 여기에도 화면을 넣어야 타입 검사를 통과한다
const campaignStepPages: Record<CampaignStepId, ReactNode> = {
  coupon: <CampaignCouponPage />,
  poster: <CampaignPosterPage />,
  target: <CampaignTargetPage />,
  budget: <CampaignBudgetPage />,
  review: <CampaignReviewPage />,
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
    // 하단 탭(홈 · 캠페인 · 가게 관리)의 첫 화면. 가게 관리는 화면을 만들기 전까지 준비 중으로 둔다
    element: <TabLayout />,
    children: [
      { path: '/home', element: <HomePage /> },
      { path: '/campaigns', element: <CampaignListPage /> },
      { path: '/store', element: <ComingSoon title="가게 관리" /> },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: '/campaigns/new', element: <CampaignNewPage /> },
      { path: '/campaigns/:id', element: <CampaignDetailPage /> },
      { path: '/campaigns/:id/complete', element: <CampaignCompletePage /> },
      // 홈에서 연결했지만 아직 만들지 않은 화면
      {
        path: '/qr-scan',
        element: <ComingSoonPage fallbackPath="/home" title="QR 코드 스캔" />,
      },
      {
        path: '/store/analytics',
        element: <ComingSoonPage fallbackPath="/store" title="분석" />,
      },
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
            element: campaignStepPages[step.id],
          })),
        ],
      },
    ],
  },
]);
