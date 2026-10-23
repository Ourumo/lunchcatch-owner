import { Navigate, Outlet } from 'react-router';

import {
  type AccessLevel,
  getAccessLevel,
  homePathByAccess,
} from './accessLevel';
import { useAuth } from './useAuth';

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
