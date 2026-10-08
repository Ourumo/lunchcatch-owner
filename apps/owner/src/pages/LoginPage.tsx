import { Link, useNavigate } from 'react-router';

import type { LoginResponse } from '@owner/api/auth';
import { LoginForm } from '@owner/features/login/LoginForm';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = ({ status }: LoginResponse) => {
    if (status === 'ONBOARDING') {
      navigate('/signup/terms');
      return;
    }

    navigate('/home', { replace: true });
  };

  return (
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">로그인</h2>
      <LoginForm onSuccess={handleLoginSuccess} />
      <p className="text-center type-body-sm text-text-secondary">
        계정이 없으신가요?{' '}
        <Link
          className="font-semibold text-text-primary underline-offset-2 hover:underline"
          to="/signup"
        >
          회원가입
        </Link>
      </p>
    </section>
  );
};

export default LoginPage;
