import type { LoginResponse } from '@owner/api/auth';

// guest: 로그인 전, onboarding: 로그인했지만 입점 신청 중(ONBOARDING), active: 입점 완료(ACTIVE)
export type AccessLevel = 'guest' | 'onboarding' | 'active';

export const getAccessLevel = (owner: LoginResponse | null): AccessLevel => {
  if (!owner) return 'guest';
  return owner.status === 'ONBOARDING' ? 'onboarding' : 'active';
};

// 상태마다 처음 보여줄 화면. 입점 신청 중이면 첫 단계(약관 동의)로 보내고, 입점 신청 화면이 이어갈 단계로 다시 보낸다
export const homePathByAccess: Record<AccessLevel, string> = {
  guest: '/login',
  onboarding: '/signup/terms',
  active: '/home',
};
