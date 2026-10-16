import { ApiError, request } from './client';
import type { ApiResult } from './types';

// 점주 로그인, 회원가입, 로그아웃, 내 정보 조회 (docs/requirements-owner.md "점주 회원가입", "점주 로그인", "점주 로그아웃")

export type OwnerStatus = 'ONBOARDING' | 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 상태. 로그인, 회원가입, 내 정보 조회가 같이 돌려준다
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
// 튜토리얼은 입점을 마친 점주만 보므로 tutorialViewed는 ACTIVE일 때만 온다
interface ActiveOwnerLoginResponse {
  email: string;
  role: string;
  status: 'ACTIVE';
  // 명세상 항상 온다. ACTIVE 계정이 없어 개발 서버에서 확인하지 못해, boolean이 아니면 응답 형식 오류로 본다
  tutorialViewed?: boolean;
}

interface InactiveOwnerLoginResponse {
  email: string;
  role: string;
  status: Exclude<OwnerStatus, 'ACTIVE'>;
}

type OwnerLoginResponse = ActiveOwnerLoginResponse | InactiveOwnerLoginResponse;

// 서버 회원가입 응답 (POST /v1/owners). 인증 쿠키는 주지 않는다
interface OwnerSignupResponse {
  email: string;
  role: string;
  status: OwnerStatus;
}

// 서버 내 정보 조회 응답 (GET /v1/owner/me)
interface OwnerProfileResponse {
  email: string;
  status: OwnerStatus;
  tutorialViewed: boolean;
}

// 이미 가입된 이메일 (409)
const EMAIL_DUPLICATED_CODE = 'OWNER-001';

// 인증 실패 사유(계정 없음, 비밀번호 불일치, 이용 불가 상태)를 구분하지 않는다
const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';
// 서버가 꺼져 있거나 네트워크가 끊겨 응답을 받지 못했거나, 서버 오류(5xx)일 때. 로그인과 회원가입이 같이 쓴다.
// 화면 제목("로그인에 실패했습니다" 등)이 실패를 알리므로 원인만 알린다
const UNAVAILABLE_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
// 로그인 요청 제한(429)에 걸렸을 때. 남은 시간은 화면이 따로 보여준다
const RATE_LIMITED_MESSAGE = '요청이 많아 잠시 후 다시 시도해 주세요.';
const EMAIL_DUPLICATED_MESSAGE = '이미 가입된 이메일입니다.';
// 서버가 입력 형식 오류 등으로 가입을 거절했을 때
const SIGNUP_REJECTED_MESSAGE = '입력한 정보를 다시 확인해 주세요.';
// 가입은 됐지만 바로 이어서 한 로그인이 실패했을 때
const SIGNUP_LOGIN_FAILED_MESSAGE =
  '가입은 완료되었습니다. 로그인 화면에서 다시 로그인해 주세요.';

const isLoginAllowedStatus = (
  status: OwnerStatus,
): status is LoginResponse['status'] =>
  status === 'ONBOARDING' || status === 'ACTIVE';

// 로그인과 재발급의 요청 제한은 1분 고정 구간이라, Retry-After를 읽지 못하면 최대 대기 시간인 60초로 본다
const DEFAULT_LOGIN_RETRY_AFTER_SECONDS = 60;

// 요청 제한(429)이면 남은 시간과 함께 요청 제한 문구,
// 서버가 오류 코드와 함께 거절했으면(예: AUTH-001, 입력 형식 오류 COMMON-002) 로그인 실패 문구,
// 응답을 받지 못했거나 읽지 못했거나 서버 오류(5xx, 503 AUTH-002 포함)면 다시 시도 문구를 보여준다
const getLoginFailure = (error: unknown): ApiResult<never> => {
  if (error instanceof ApiError && error.status === 429) {
    return {
      ok: false,
      message: RATE_LIMITED_MESSAGE,
      retryAfterSeconds:
        error.retryAfterSeconds ?? DEFAULT_LOGIN_RETRY_AFTER_SECONDS,
    };
  }

  return {
    ok: false,
    message:
      error instanceof ApiError && error.code !== null && error.status < 500
        ? LOGIN_FAILED_MESSAGE
        : UNAVAILABLE_MESSAGE,
  };
};

export const login = async ({
  email,
  password,
}: LoginRequest): Promise<ApiResult<LoginResponse>> => {
  try {
    const data = await request<OwnerLoginResponse>('/v1/owner/auth/tokens', {
      method: 'POST',
      body: { email, password },
    });

    // ONBOARDING은 튜토리얼 대상이 아니라 본 적 없는 것으로 둔다
    if (data.status === 'ONBOARDING') {
      return {
        ok: true,
        data: { status: 'ONBOARDING', tutorialViewed: false },
      };
    }

    if (data.status === 'ACTIVE') {
      // 안 본 것으로 채우면 이미 본 점주에게 튜토리얼이 다시 뜨므로 로그인을 실패로 돌려준다
      if (typeof data.tutorialViewed !== 'boolean') {
        return { ok: false, message: UNAVAILABLE_MESSAGE };
      }

      return {
        ok: true,
        data: { status: 'ACTIVE', tutorialViewed: data.tutorialViewed },
      };
    }

    // 이용 정지·탈퇴 계정은 서버가 거절하지 않고 내려보내도 같은 문구로 막는다
    return { ok: false, message: LOGIN_FAILED_MESSAGE };
  } catch (error) {
    return getLoginFailure(error);
  }
};

// 서버가 오류 코드와 함께 거절한 것(4xx)과, 응답을 받지 못했거나 서버 오류(5xx)인 것을 나눈다
const getSignupErrorMessage = (error: unknown) =>
  error instanceof ApiError && error.code !== null && error.status < 500
    ? SIGNUP_REJECTED_MESSAGE
    : UNAVAILABLE_MESSAGE;

export const signup = async ({
  email,
  password,
}: SignupRequest): Promise<ApiResult<LoginResponse, SignupFieldErrors>> => {
  try {
    await request<OwnerSignupResponse>('/v1/owners', {
      method: 'POST',
      body: { email, password },
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === EMAIL_DUPLICATED_CODE) {
      return { ok: false, fieldErrors: { email: EMAIL_DUPLICATED_MESSAGE } };
    }

    return { ok: false, message: getSignupErrorMessage(error) };
  }

  // 가입 응답에는 인증 쿠키가 없어, 가입한 계정으로 바로 로그인해 약관 동의 단계로 이어지게 한다
  const loginResult = await login({ email, password });

  if (!loginResult.ok) {
    return { ok: false, message: SIGNUP_LOGIN_FAILED_MESSAGE };
  }

  return loginResult;
};

// 이미 만료됐거나 로그인하지 않은 상태 (인증 쿠키 없음)
const UNAUTHENTICATED_CODE = 'AUTH-005';

// 서버가 Refresh Token을 폐기하고 인증 쿠키 두 개를 지운다(204). 쿠키는 서버가 지우므로 화면에서 지우지 않는다.
// Access Token만 만료됐으면 client가 재발급하고 다시 보낸다. 그래도 401 AUTH-005면 Refresh Token도 없거나 만료돼
// 서버에 지울 로그인이 없어 성공으로 본다 (사용자 앱 logout과 같다).
// 그 밖의 거절(403 AUTH-006 등), 서버 오류, 응답을 받지 못한 경우는 실패로 돌려주고 로그인 상태는 그대로 둔다.
// 실패 문구는 부른 쪽이 정한다. 개발용 로그인 상태(VITE_MOCK_OWNER_STATUS)여도 서버에 요청한다
export const logout = async (): Promise<ApiResult<null>> => {
  try {
    await request<void>('/v1/owner/auth/tokens', { method: 'DELETE' });
  } catch (error) {
    if (!(error instanceof ApiError && error.code === UNAUTHENTICATED_CODE)) {
      return { ok: false };
    }
  }

  return { ok: true, data: null };
};

// 개발용 로그인 상태(.env의 VITE_MOCK_OWNER_STATUS). 입점 신청 API가 없어 ACTIVE 계정을 만들 수 없고
// 개발 서버가 꺼져 있으면 어느 화면도 볼 수 없어, 로컬 개발에서만 서버에 묻지 않고 이 상태를 쓴다. 배포 빌드에서는 무시한다
const getMockOwnerStatus = (): LoginResponse['status'] | null => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const status = import.meta.env.VITE_MOCK_OWNER_STATUS;

  return status === 'ACTIVE' || status === 'ONBOARDING' ? status : null;
};

// 인증 쿠키로 로그인한 점주를 확인한다. 화면은 HttpOnly 쿠키를 읽을 수 없어 새로고침 뒤 로그인 상태는 이것으로만 알 수 있다.
// 로그인 전이면 data가 null이다. 재발급까지 실패해 쿠키로 로그인할 수 없거나(401), 점주가 아닌 계정이거나(403 AUTH-006),
// 이용 정지·탈퇴 상태인 경우다. 그 밖의 오류(요청 제한 429, 서버 오류 5xx 등)나 응답을 받지 못한 경우는
// 로그인 전인지 알 수 없어 실패로 돌려준다
export const getMe = async (): Promise<ApiResult<LoginResponse | null>> => {
  const mockStatus = getMockOwnerStatus();

  if (mockStatus) {
    // 튜토리얼은 본 것으로 두어 개발 중에 매번 뜨지 않게 한다
    return { ok: true, data: { status: mockStatus, tutorialViewed: true } };
  }

  try {
    const data = await request<OwnerProfileResponse>('/v1/owner/me');

    if (!isLoginAllowedStatus(data.status)) {
      return { ok: true, data: null };
    }

    return {
      ok: true,
      data: { status: data.status, tutorialViewed: data.tutorialViewed },
    };
  } catch (error) {
    // 인증을 거절한 응답만 로그인 전으로 본다
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      return { ok: true, data: null };
    }

    return { ok: false };
  }
};
