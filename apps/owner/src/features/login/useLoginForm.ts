import { type ChangeEvent, type FormEvent, useState } from 'react';

import { login, type LoginResponse } from '@owner/api/auth';
import {
  hasErrors,
  type LoginErrors,
  type LoginValues,
  validateLogin,
} from '@owner/auth/validation';

interface UseLoginFormOptions {
  onSuccess: (response: LoginResponse) => void;
}

const initialValues: LoginValues = { email: '', password: '' };
const initialTouched = { email: false, password: false };

export const useLoginForm = ({ onSuccess }: UseLoginFormOptions) => {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState(initialTouched);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const errors = validateLogin(values);
  // 입력 중에는 오류를 보여주지 않고, 필드를 벗어난 뒤부터 보여준다
  const visibleErrors: LoginErrors = {
    email: touched.email ? errors.email : undefined,
    password: touched.password ? errors.password : undefined,
  };

  const handleChange =
    (field: keyof LoginValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      setSubmitError(undefined);
    };

  const handleBlur = (field: keyof LoginValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (hasErrors(errors) || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = await login({
      email: values.email.trim(),
      password: values.password,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    onSuccess(result.data);
  };

  return {
    canSubmit: !hasErrors(errors),
    errors: visibleErrors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    submitError,
    values,
  };
};
