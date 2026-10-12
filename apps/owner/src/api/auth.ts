import { ApiError, request } from './client';
import { mockDelay } from './mocks/delay';
import { mockOwners } from './mocks/owners';
import type { ApiResult } from './types';

// 점주 로그인과 회원가입 (docs/requirements-owner.md "점주 회원가입", "점주 로그인")
// 로그인은 실제 API로 동작한다. 회원가입은 API 연동 전까지 mock 데이터로 동작한다

export type OwnerStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

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

// 서버 로그인 응답 (POST /v1/owner/auth/tokens). 토큰은 서버가 HttpOnly 쿠키로 내려준다
interface OwnerLoginResponse {
  email: string;
  role: string;
  status: OwnerStatus;
  tutorialViewed: boolean;
}

// 인증 실패 사유(계정 없음, 비밀번호 불일치, 이용 불가 상태)를 구분하지 않는다
const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';
// 서버가 꺼져 있거나 네트워크가 끊겨 응답을 받지 못했거나, 서버 오류(5xx)일 때.
// 화면 제목이 "로그인에 실패했습니다"라 원인만 알린다
const LOGIN_UNAVAILABLE_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
const EMAIL_DUPLICATED_MESSAGE = '이미 가입된 이메일입니다.';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const findOwner = (email: string) =>
  mockOwners.find((owner) => owner.email === normalizeEmail(email));

const isLoginAllowedStatus = (
  status: OwnerStatus,
): status is LoginResponse['status'] =>
  status === 'ONBOARDING' || status === 'ACTIVE';

// 서버가 오류 코드와 함께 거절했으면(예: AUTH-001, 입력 형식 오류 COMMON-002) 로그인 실패 문구,
// 응답을 받지 못했거나 읽지 못했거나 서버 오류(5xx)면 다시 시도 문구를 보여준다
const getLoginErrorMessage = (error: unknown) =>
  error instanceof ApiError && error.code !== null && error.status < 500
    ? LOGIN_FAILED_MESSAGE
    : LOGIN_UNAVAILABLE_MESSAGE;

export const login = async ({
  email,
  password,
}: LoginRequest): Promise<ApiResult<LoginResponse>> => {
  try {
    const data = await request<OwnerLoginResponse>('/v1/owner/auth/tokens', {
      method: 'POST',
      body: { email, password },
    });

    // 이용 정지·탈퇴 계정은 서버가 거절하지 않고 내려보내도 같은 문구로 막는다
    if (!isLoginAllowedStatus(data.status)) {
      return { ok: false, message: LOGIN_FAILED_MESSAGE };
    }

    return {
      ok: true,
      data: { status: data.status, tutorialViewed: data.tutorialViewed },
    };
  } catch (error) {
    return { ok: false, message: getLoginErrorMessage(error) };
  }
};

export const signup = async ({
  email,
  password,
}: SignupRequest): Promise<ApiResult<null, SignupFieldErrors>> => {
  await mockDelay();

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
