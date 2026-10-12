import { createContext } from 'react';

import type { LoginResponse } from '@owner/api/auth';

export interface AuthContextValue {
  // 로그인한 점주의 상태. 로그인 전이면 null
  owner: LoginResponse | null;
  // 로그인, 회원가입에 성공하면 응답으로 바꾼다
  setOwner: (owner: LoginResponse) => void;
  // 입점 신청을 마치면 ACTIVE로 바꾼다
  completeOnboarding: () => void;
  // 로그아웃하면 로그인 전으로 되돌린다
  clearOwner: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
