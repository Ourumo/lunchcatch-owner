import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Toast } from '@repo/ui';

import type { LoginResponse } from '@owner/api/auth';
import { LoginForm } from '@owner/features/login/LoginForm';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isDashboardPending, setIsDashboardPending] = useState(false);

  const handleLoginSuccess = ({ status }: LoginResponse) => {
    if (status === 'ONBOARDING') {
      navigate('/signup/terms');
      return;
    }

    // 대시보드 화면이 생기면 이동으로 바꾼다
    setIsDashboardPending(true);
  };

  return (
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">로그인</h2>
      <LoginForm onSuccess={handleLoginSuccess} />
      {isDashboardPending && (
        <Toast
          description="대시보드 화면은 준비 중입니다."
          style={{ maxWidth: 'none' }}
          title="로그인되었습니다"
          variant="success"
        />
      )}
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
