import { Link, useNavigate } from 'react-router';

import { SignupAccountForm } from '@owner/features/signup/SignupAccountForm';

const SignupPage = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">회원가입</h2>
      <SignupAccountForm onSuccess={() => navigate('/signup/terms')} />
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
