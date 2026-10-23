import { createContext } from 'react';

import type { LoginResponse } from '@owner/api/auth';

export interface AuthContextValue {
  // 로그인한 점주의 상태. 로그인 전이면 null
  owner: LoginResponse | null;
  // 로그인, 회원가입에 성공하거나 내 정보 조회로 상태를 다시 받으면(입점 신청 완료 등) 그 값으로 바꾼다
  setOwner: (owner: LoginResponse) => void;
  // 로그아웃하면 로그인 전으로 되돌린다
  clearOwner: () => void;
  // 최초 튜토리얼 완료를 서버에 저장한다. 결과와 상관없이 tutorialViewed를 먼저 true로 바꿔 이번 접속에서는 다시 보여주지 않는다
  completeTutorial: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
