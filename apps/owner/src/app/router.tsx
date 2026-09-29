import { createBrowserRouter, Navigate } from 'react-router';

import LoginPage from '@owner/pages/LoginPage';
import SignupPage from '@owner/pages/SignupPage';
import SignupTermsPage from '@owner/pages/SignupTermsPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate replace to="/login" /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/signup/terms', element: <SignupTermsPage /> },
]);
