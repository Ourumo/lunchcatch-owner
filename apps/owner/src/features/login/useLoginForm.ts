import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';

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
  // 요청 제한(429)이 풀릴 때까지 남은 초. 그 전에는 다시 제출할 수 없다
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (remainingSeconds === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (remainingSeconds > 1) {
        setRemainingSeconds(remainingSeconds - 1);
        return;
      }

      // 제한이 풀리면 안내를 지우고 다시 제출할 수 있게 한다
      setRemainingSeconds(null);
      setSubmitError(undefined);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [remainingSeconds]);

  const isLocked = remainingSeconds !== null;

  const errors = validateLogin(values);
  // 입력 중에는 오류를 보여주지 않고, 필드를 벗어난 뒤부터 보여준다
  const visibleErrors: LoginErrors = {
    email: touched.email ? errors.email : undefined,
    password: touched.password ? errors.password : undefined,
  };

  const handleChange =
    (field: keyof LoginValues) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));

      // 요청 제한은 입력과 상관없으므로 풀릴 때까지 안내를 그대로 둔다
      if (!isLocked) {
        setSubmitError(undefined);
      }
    };

  const handleBlur = (field: keyof LoginValues) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (hasErrors(errors) || isSubmitting || isLocked) {
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

      if (result.retryAfterSeconds) {
        setRemainingSeconds(result.retryAfterSeconds);
      }

      return;
    }

    onSuccess(result.data);
  };

  return {
    canSubmit: !hasErrors(errors) && !isLocked,
    errors: visibleErrors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    remainingSeconds,
    submitError,
    values,
  };
};
