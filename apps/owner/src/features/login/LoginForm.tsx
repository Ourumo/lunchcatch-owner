import { Button, Input, Toast } from '@repo/ui';
import { LockKeyhole, Mail } from 'lucide-react';

import type { LoginResponse } from '@owner/api/auth';

import { useLoginForm } from './useLoginForm';

interface LoginFormProps {
  onSuccess: (response: LoginResponse) => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const {
    canSubmit,
    errors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    values,
  } = useLoginForm({ onSuccess });

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      <Input
        autoComplete="email"
        errorMessage={errors.email}
        inputMode="email"
        label="이메일 주소"
        leadingIcon={<Mail className="size-4" />}
        name="email"
        onBlur={handleBlur('email')}
        onChange={handleChange('email')}
        placeholder="example@email.com"
        type="email"
        value={values.email}
      />
      <Input
        autoComplete="current-password"
        errorMessage={errors.password}
        label="비밀번호"
        leadingIcon={<LockKeyhole className="size-4" />}
        name="password"
        onBlur={handleBlur('password')}
        onChange={handleChange('password')}
        placeholder="비밀번호를 입력해주세요"
        type="password"
        value={values.password}
      />
      {submitError && (
        <Toast
          description={submitError}
          style={{ maxWidth: 'none' }}
          title="로그인에 실패했습니다"
          variant="danger"
        />
      )}
      <Button
        className="w-full"
        disabled={!canSubmit}
        isLoading={isSubmitting}
        type="submit"
      >
        로그인
      </Button>
    </form>
  );
};
