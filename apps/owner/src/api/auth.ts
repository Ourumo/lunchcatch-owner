import { mockOwners } from './mocks/owners';

// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export type OwnerStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

export type ApiResult<TData, TFieldErrors = never> =
  | { ok: true; data: TData }
  | { ok: false; message?: string; fieldErrors?: TFieldErrors };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: Extract<OwnerStatus, 'ONBOARDING' | 'ACTIVE'>;
  tutorialViewed: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface SignupFieldErrors {
  email?: string;
}

const MOCK_DELAY_MS = 600;

// 인증 실패 사유(계정 없음, 비밀번호 불일치, 이용 불가 상태)를 구분하지 않는다
const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';
const EMAIL_DUPLICATED_MESSAGE = '이미 가입된 이메일입니다.';

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const findOwner = (email: string) =>
  mockOwners.find((owner) => owner.email === normalizeEmail(email));

export const login = async ({
  email,
  password,
}: LoginRequest): Promise<ApiResult<LoginResponse>> => {
  await wait(MOCK_DELAY_MS);

  const owner = findOwner(email);

  if (
    !owner ||
    owner.password !== password ||
    (owner.status !== 'ONBOARDING' && owner.status !== 'ACTIVE')
  ) {
    return { ok: false, message: LOGIN_FAILED_MESSAGE };
  }

  return {
    ok: true,
    data: { status: owner.status, tutorialViewed: owner.tutorialViewed },
  };
};

export const signup = async ({
  email,
  password,
}: SignupRequest): Promise<ApiResult<null, SignupFieldErrors>> => {
  await wait(MOCK_DELAY_MS);

  if (findOwner(email)) {
    return { ok: false, fieldErrors: { email: EMAIL_DUPLICATED_MESSAGE } };
  }

  // 가입한 계정으로 바로 로그인해 볼 수 있도록 메모리에만 추가한다. 새로고침하면 초기화된다
  mockOwners.push({
    email: normalizeEmail(email),
    password,
    status: 'ONBOARDING',
    tutorialViewed: false,
  });

  return { ok: true, data: null };
};
