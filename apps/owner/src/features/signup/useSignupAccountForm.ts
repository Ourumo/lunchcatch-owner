import { type ChangeEvent, type FormEvent, useState } from 'react';

import { signup, type SignupFieldErrors } from '@owner/api/auth';
import {
  hasErrors,
  type SignupAccountErrors,
  type SignupAccountValues,
  validateSignupAccount,
} from '@owner/auth/validation';

interface UseSignupAccountFormOptions {
  onSuccess: () => void;
}

const initialValues: SignupAccountValues = {
  email: '',
  password: '',
  passwordConfirm: '',
};
const initialTouched = {
  email: false,
  password: false,
  passwordConfirm: false,
};

export const useSignupAccountForm = ({
  onSuccess,
}: UseSignupAccountFormOptions) => {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState(initialTouched);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<SignupFieldErrors>(
    {},
  );
  const [submitError, setSubmitError] = useState<string>();

  // 매 렌더링마다 전체 값을 검사하므로 비밀번호를 바꾸면 비밀번호 확인 일치 여부도 함께 갱신된다
  const errors = validateSignupAccount(values);
  // 입력 중에는 오류를 보여주지 않고, 필드를 벗어난 뒤부터 보여준다
  const visibleErrors: SignupAccountErrors = {
    email:
      serverFieldErrors.email ?? (touched.email ? errors.email : undefined),
    password: touched.password ? errors.password : undefined,
    passwordConfirm: touched.passwordConfirm
      ? errors.passwordConfirm
      : undefined,
  };

  const handleChange =
    (field: keyof SignupAccountValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setSubmitError(undefined);

      if (field === 'email') {
        setServerFieldErrors({});
      }
    };

  const handleBlur = (field: keyof SignupAccountValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true, passwordConfirm: true });

    if (hasErrors(errors) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await signup({
      email: values.email.trim(),
      password: values.password,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setServerFieldErrors(result.fieldErrors ?? {});
      setSubmitError(result.message);
      return;
    }

    onSuccess();
  };

  return {
    canSubmit: !hasErrors(errors) && !serverFieldErrors.email,
    errors: visibleErrors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    values,
  };
};
