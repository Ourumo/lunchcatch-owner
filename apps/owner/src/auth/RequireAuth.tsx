import { Navigate, Outlet } from 'react-router';

import type { LoginResponse } from '@owner/api/auth';

import { useAuth } from './useAuth';

// guest: 로그인 전, onboarding: 로그인했지만 입점 신청 중(ONBOARDING), active: 입점 완료(ACTIVE)
export type AccessLevel = 'guest' | 'onboarding' | 'active';

const getAccessLevel = (owner: LoginResponse | null): AccessLevel => {
  if (!owner) return 'guest';
  return owner.status === 'ONBOARDING' ? 'onboarding' : 'active';
};

// 상태마다 처음 보여줄 화면. 입점 신청 중이면 첫 단계(약관 동의)로 보내고, 입점 신청 화면이 이어갈 단계로 다시 보낸다
const homePathByAccess: Record<AccessLevel, string> = {
  guest: '/login',
  onboarding: '/signup/terms',
  active: '/home',
};

interface RequireAuthProps {
  access: AccessLevel;
}

// 현재 상태와 맞지 않는 화면에 들어오면 상태에 맞는 첫 화면으로 보낸다.
// 로그인한 채로 로그인·회원가입 화면에 들어온 경우도 같다
const RequireAuth = ({ access }: RequireAuthProps) => {
  const { owner } = useAuth();
  const currentAccess = getAccessLevel(owner);

  if (currentAccess !== access) {
    return <Navigate replace to={homePathByAccess[currentAccess]} />;
  }

  return <Outlet />;
};

export default RequireAuth;
