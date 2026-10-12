import { Link, useNavigate } from 'react-router';

import type { LoginResponse } from '@owner/api/auth';
import { useAuth } from '@owner/auth/useAuth';
import { SignupAccountForm } from '@owner/features/signup/SignupAccountForm';

const SignupPage = () => {
  const navigate = useNavigate();
  const { setOwner } = useAuth();

  // 가입하면 바로 로그인되어 ONBOARDING 상태로 약관 동의 단계에 들어간다
  const handleSignupSuccess = (owner: LoginResponse) => {
    setOwner(owner);
    navigate('/signup/terms');
  };

  return (
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">회원가입</h2>
      <SignupAccountForm onSuccess={handleSignupSuccess} />
      <p className="text-center type-body-sm text-text-secondary">
        이미 계정이 있으신가요?{' '}
        <Link
          className="font-semibold text-text-primary underline-offset-2 hover:underline"
          to="/login"
        >
          로그인
        </Link>
      </p>
    </section>
  );
};

export default SignupPage;
