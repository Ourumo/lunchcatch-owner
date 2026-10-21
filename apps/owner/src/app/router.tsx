import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import RequireAuth from '@owner/auth/RequireAuth';
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
import {
  POINT_HISTORY_PATH,
  STORE_ANALYTICS_COMPARE_PATH,
  STORE_ANALYTICS_PATH,
  STORE_HOURS_PATH,
  STORE_IMAGES_PATH,
  STORE_MENUS_PATH,
  STORE_PATH,
} from '@owner/features/store/storePaths';
import {
  POINT_CHARGE_FAIL_PATH,
  POINT_CHARGE_PATH,
  POINT_CHARGE_SUCCESS_PATH,
} from '@owner/hooks/usePointCharge';
import AuthLayout from '@owner/layout/AuthLayout';
import MainLayout from '@owner/layout/MainLayout';
import TabLayout from '@owner/layout/TabLayout';
import CampaignBudgetPage from '@owner/pages/CampaignBudgetPage';
import CampaignCompletePage from '@owner/pages/CampaignCompletePage';
import CampaignCouponPage from '@owner/pages/CampaignCouponPage';
import CampaignDetailPage from '@owner/pages/CampaignDetailPage';
import CampaignEndedPage from '@owner/pages/CampaignEndedPage';
import CampaignFormPage from '@owner/pages/CampaignFormPage';
import CampaignListPage from '@owner/pages/CampaignListPage';
import CampaignNewPage from '@owner/pages/CampaignNewPage';
import CampaignPosterPage from '@owner/pages/CampaignPosterPage';
import CampaignReviewPage from '@owner/pages/CampaignReviewPage';
import CampaignTargetPage from '@owner/pages/CampaignTargetPage';
import ComingSoonPage from '@owner/pages/ComingSoonPage';
import HomePage from '@owner/pages/HomePage';
import LoginPage from '@owner/pages/LoginPage';
import PointChargeFailPage from '@owner/pages/PointChargeFailPage';
import PointChargePage from '@owner/pages/PointChargePage';
import PointChargeSuccessPage from '@owner/pages/PointChargeSuccessPage';
import PointHistoryPage from '@owner/pages/PointHistoryPage';
import QrScanPage from '@owner/pages/QrScanPage';
import SignupCompletePage from '@owner/pages/SignupCompletePage';
import SignupHoursPage from '@owner/pages/SignupHoursPage';
import SignupImagesPage from '@owner/pages/SignupImagesPage';
import SignupLocationPage from '@owner/pages/SignupLocationPage';
import SignupMenuPage from '@owner/pages/SignupMenuPage';
import SignupPage from '@owner/pages/SignupPage';
import SignupStorePage from '@owner/pages/SignupStorePage';
import SignupTermsPage from '@owner/pages/SignupTermsPage';
import StoreAnalyticsPage from '@owner/pages/StoreAnalyticsPage';
import StoreHoursPage from '@owner/pages/StoreHoursPage';
import StoreImagesPage from '@owner/pages/StoreImagesPage';
import StoreManagementPage from '@owner/pages/StoreManagementPage';
import StoreMenusPage from '@owner/pages/StoreMenusPage';

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

// 로그인 상태(로그인 전, 입점 신청 중, 입점 완료)마다 들어갈 수 있는 화면을 나눈다.
// 맞지 않는 화면에 들어오면 RequireAuth가 상태에 맞는 첫 화면으로 보낸다
export const router = createBrowserRouter([
  // 첫 화면은 로그인으로 보내고, 로그인한 상태면 RequireAuth가 다시 상태에 맞는 화면으로 보낸다
  { path: '/', element: <Navigate replace to="/login" /> },
  {
    element: <RequireAuth access="guest" />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth access="onboarding" />,
    children: [
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
      // 입점 신청을 제출한 뒤의 화면. 홈으로 갈 때 ACTIVE로 바꾼다
      { path: SIGNUP_COMPLETE_PATH, element: <SignupCompletePage /> },
    ],
  },
  {
    element: <RequireAuth access="active" />,
    children: [
      {
        // 하단 탭(홈 · 캠페인 · 가게 관리)의 첫 화면
        element: <TabLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/campaigns', element: <CampaignListPage /> },
          { path: STORE_PATH, element: <StoreManagementPage /> },
        ],
      },
      {
        element: <MainLayout />,
        children: [
          { path: '/campaigns/new', element: <CampaignNewPage /> },
          { path: '/campaigns/ended', element: <CampaignEndedPage /> },
          { path: '/campaigns/:id', element: <CampaignDetailPage /> },
          {
            path: '/campaigns/:id/complete',
            element: <CampaignCompletePage />,
          },
          { path: STORE_HOURS_PATH, element: <StoreHoursPage /> },
          { path: STORE_IMAGES_PATH, element: <StoreImagesPage /> },
          { path: STORE_MENUS_PATH, element: <StoreMenusPage /> },
          { path: STORE_ANALYTICS_PATH, element: <StoreAnalyticsPage /> },
          { path: POINT_HISTORY_PATH, element: <PointHistoryPage /> },
          { path: POINT_CHARGE_PATH, element: <PointChargePage /> },
          {
            path: POINT_CHARGE_SUCCESS_PATH,
            element: <PointChargeSuccessPage />,
          },
          { path: POINT_CHARGE_FAIL_PATH, element: <PointChargeFailPage /> },
          { path: '/qr-scan', element: <QrScanPage /> },
          // 분석에서 연결했지만 아직 만들지 않은 화면
          {
            path: STORE_ANALYTICS_COMPARE_PATH,
            element: (
              <ComingSoonPage
                fallbackPath={STORE_ANALYTICS_PATH}
                title="캠페인 비교"
              />
            ),
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
    ],
  },
]);
