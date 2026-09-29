import { Button, Input, Toast } from '@repo/ui';

import { PasswordInput } from '@owner/components/PasswordInput/PasswordInput';

import { useSignupAccountForm } from './useSignupAccountForm';

interface SignupAccountFormProps {
  onSuccess: () => void;
}

export const SignupAccountForm = ({ onSuccess }: SignupAccountFormProps) => {
  const {
    canSubmit,
    errors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    values,
  } = useSignupAccountForm({ onSuccess });

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      <Input
        autoComplete="email"
        errorMessage={errors.email}
        inputMode="email"
        label="이메일 주소"
        name="email"
        onBlur={handleBlur('email')}
        onChange={handleChange('email')}
        placeholder="example@email.com"
        type="email"
        value={values.email}
      />
      <PasswordInput
        autoComplete="new-password"
        errorMessage={errors.password}
        label="비밀번호"
        name="password"
        onBlur={handleBlur('password')}
        onChange={handleChange('password')}
        placeholder="8자 이상 20자 미만"
        value={values.password}
      />
      <PasswordInput
        autoComplete="new-password"
        errorMessage={errors.passwordConfirm}
        label="비밀번호 확인"
        name="passwordConfirm"
        onBlur={handleBlur('passwordConfirm')}
        onChange={handleChange('passwordConfirm')}
        placeholder="비밀번호를 한 번 더 입력해주세요"
        value={values.passwordConfirm}
      />
      {submitError && (
        <Toast
          description={submitError}
          style={{ maxWidth: 'none' }}
          title="회원가입에 실패했습니다"
          variant="danger"
        />
      )}
      <Button
        className="w-full"
        disabled={!canSubmit}
        isLoading={isSubmitting}
        type="submit"
      >
        이메일로 가입하기
      </Button>
    </form>
  );
};
