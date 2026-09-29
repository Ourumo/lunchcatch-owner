// 비밀번호 길이 규칙: 8자 이상 20자 미만 (docs/requirements-owner.md 점주 회원가입)
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 19;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const VALIDATION_MESSAGES = {
  emailRequired: '이메일을 입력해주세요.',
  emailInvalid: '올바른 이메일 형식이 아닙니다.',
  passwordRequired: '비밀번호를 입력해주세요.',
  passwordLength: '비밀번호는 8자 이상 20자 미만으로 입력해주세요.',
  passwordConfirmRequired: '비밀번호를 한 번 더 입력해주세요.',
  passwordMismatch: '비밀번호가 일치하지 않습니다.',
} as const;

export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

export interface SignupAccountValues {
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface SignupAccountErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

// 각 검증 함수는 통과하면 undefined, 실패하면 필드에 표시할 오류 메시지를 반환한다
export const validateEmail = (email: string) => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return VALIDATION_MESSAGES.emailRequired;
  }

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return VALIDATION_MESSAGES.emailInvalid;
  }

  return undefined;
};

export const validatePassword = (password: string) => {
  if (!password) {
    return VALIDATION_MESSAGES.passwordRequired;
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return VALIDATION_MESSAGES.passwordLength;
  }

  return undefined;
};

export const validatePasswordConfirm = (
  password: string,
  passwordConfirm: string,
) => {
  if (!passwordConfirm) {
    return VALIDATION_MESSAGES.passwordConfirmRequired;
  }

  if (password !== passwordConfirm) {
    return VALIDATION_MESSAGES.passwordMismatch;
  }

  return undefined;
};

// 로그인은 길이 규칙을 검사하지 않는다. 계정 존재 여부와 실패 사유는 서버가 공통 메시지로 처리한다
export const validateLogin = ({
  email,
  password,
}: LoginValues): LoginErrors => ({
  email: validateEmail(email),
  password: password ? undefined : VALIDATION_MESSAGES.passwordRequired,
});

export const validateSignupAccount = ({
  email,
  password,
  passwordConfirm,
}: SignupAccountValues): SignupAccountErrors => ({
  email: validateEmail(email),
  password: validatePassword(password),
  passwordConfirm: validatePasswordConfirm(password, passwordConfirm),
});

export const hasErrors = (errors: LoginErrors | SignupAccountErrors) =>
  Object.values(errors).some(Boolean);
