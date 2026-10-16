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
    remainingSeconds,
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
          className="break-keep"
          description={submitError}
          style={{ maxWidth: 'none' }}
          title="로그인에 실패했습니다"
          variant="danger"
        />
      )}
      {remainingSeconds !== null && (
        // 남은 시간은 1초마다 바뀌어 화면 낭독기가 매번 다시 읽지 않도록 위 안내(알림 영역) 밖에 둔다
        <p className="-mt-2 text-caption-mobile text-text-secondary">
          {remainingSeconds}초 후에 다시 시도할 수 있어요.
        </p>
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
