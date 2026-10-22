import { getAccessLevel, homePathByAccess } from './accessLevel';
import { useAuth } from './useAuth';

// 지금 로그인 상태의 첫 화면 주소. 없는 주소나 오류 화면에서 돌아갈 곳으로 쓴다
export const useHomePath = () => {
  const { owner } = useAuth();

  return homePathByAccess[getAccessLevel(owner)];
};
