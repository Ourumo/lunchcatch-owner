// 서버 응답 봉투. 성공이면 code가 SUCCESS이고 data에 결과가 들어 있다
interface ResponseEnvelope<T> {
  code: string;
  message: string;
  data: T;
}

// 서버가 거절한 요청. code로 이유를 구분한다 (예: 로그인 실패 AUTH-001)
// 화면에는 그대로 올리지 않는다. api/*.ts의 각 함수가 잡아서 ApiResult({ ok: false, message })로 바꿔 돌려준다
export class ApiError extends Error {
  readonly status: number;
  // 응답 본문을 읽지 못하면 null이다 (예: 로컬 백엔드가 꺼져 Vite 프록시가 502를 준 경우)
  readonly code: string | null;
  // 요청 제한(429)일 때 다시 보낼 수 있을 때까지 남은 초 (Retry-After). 헤더가 없거나 읽지 못하면 없다
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string | null,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

// API 서버 주소. 배포에서는 Vercel 환경 변수로 넣는다
// (Preview는 https://api.dev.lunchcatch.com, Production은 https://api.lunchcatch.com. docs/deployment.md)
// 로컬에서는 비워 두어 같은 주소의 /v1로 부르면 Vite 프록시가 API 서버로 넘긴다 (vite.config.ts)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(
  /\/$/,
  '',
);

// 서버가 연결만 받고 응답하지 않을 때 끝없이 기다리지 않도록 이 시간이 지나면 요청을 끊는다.
// 앱을 시작할 때 내 정보 조회가 끝나야 화면을 그리므로, 끊지 않으면 빈 화면이 계속된다
const REQUEST_TIMEOUT_MS = 10_000;

const REFRESH_PATH = '/v1/owner/auth/tokens:refresh';

// Access Token이 없거나 만료됨. 재발급하고 한 번 더 보낸다
const ACCESS_TOKEN_EXPIRED_CODE = 'AUTH-005';

const readEnvelope = async <T>(
  response: Response,
): Promise<ResponseEnvelope<T> | null> => {
  try {
    return (await response.json()) as ResponseEnvelope<T>;
  } catch {
    return null;
  }
};

// Retry-After는 초 또는 HTTP 날짜로 온다.
// 서버가 남은 시간을 초 단위로 내림해 주므로(58.6초 남았으면 58), 받은 대로 기다리면 풀리기 직전에 다시 보내 또 거절된다.
// 1초 더 기다린다
const readRetryAfterSeconds = (response: Response) => {
  const header = response.headers.get('Retry-After');

  if (!header) return undefined;

  const seconds = /^\d+$/.test(header)
    ? Number(header)
    : (Date.parse(header) - Date.now()) / 1000;

  return Number.isFinite(seconds)
    ? Math.max(0, Math.ceil(seconds)) + 1
    : undefined;
};

// 요청을 한 번 보내고 봉투를 벗긴 data를 돌려준다
const send = async <T>(
  path: string,
  { body, method = 'GET' }: RequestOptions,
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    // 배포에서는 점주 앱(owner.lunchcatch.com)과 API 서버(api.lunchcatch.com)의 주소가 달라
    // 인증 쿠키를 실으려면 include가 필요하다. 같은 사이트(lunchcatch.com)라서 SameSite=Strict 쿠키도 함께 간다
    credentials: 'include',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 204는 본문과 봉투가 없다
  if (response.status === 204) return undefined as T;

  // 요청 제한(429)은 본문 없이 오므로 읽지 않는다
  if (response.status === 429) {
    throw new ApiError(
      429,
      null,
      '요청이 너무 많습니다 (429)',
      readRetryAfterSeconds(response),
    );
  }

  const envelope = await readEnvelope<T>(response);

  if (!response.ok || envelope?.code !== 'SUCCESS') {
    throw new ApiError(
      response.status,
      envelope?.code ?? null,
      envelope?.message ?? `요청에 실패했습니다 (${response.status})`,
    );
  }

  return envelope.data;
};

// 다시 로그인해야 하는 상태가 됐을 때 알릴 곳 (AuthProvider가 로그인 상태를 지운다)
const sessionExpiredListeners = new Set<() => void>();

export const onSessionExpired = (listener: () => void) => {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
};

// 진행 중인 재발급. 여러 요청이 동시에 401을 받아도 재발급은 한 번만 보낸다
// 같은 Refresh Token이 두 번 가면 서버가 재사용으로 보고 모든 로그인을 끊는다 (AUTH-004)
let refreshing: Promise<boolean> | null = null;
// 재발급에 성공한 횟수. 재발급 전에 보낸 요청이 늦게 401을 받으면 이미 바뀐 쿠키로 다시 보내기만 한다
let refreshCount = 0;

// 재발급에 성공하면 true, 다시 로그인해야 하면(401: 쿠키 없음·만료 AUTH-003, 재사용 감지 AUTH-004) false.
// 서버가 잠시 처리하지 못했거나(503) 응답을 받지 못하면 서버가 이미 토큰을 바꿨는지 알 수 없어
// 같은 Refresh Token으로 다시 보내지 않고 오류를 그대로 올린다
const refreshTokens = () => {
  refreshing ??= send<void>(REFRESH_PATH, { method: 'POST' })
    .then(() => {
      refreshCount += 1;
      return true;
    })
    .catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        sessionExpiredListeners.forEach((listener) => listener());
        return false;
      }
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
};

// 로그인, 회원가입은 로그인 전에 부르고 재발급은 그 자체라 401이어도 재발급하지 않는다.
// 로그아웃은 재발급 대상이다. Access Token이 만료된 채 보내면 서버가 Refresh Token을 폐기하지 않아(401 AUTH-005),
// 재발급하고 다시 보내지 않으면 새로고침했을 때 로그인 상태가 되살아난다
const needsSession = (path: string, method: RequestOptions['method']) =>
  path !== REFRESH_PATH &&
  !(path === '/v1/owner/auth/tokens' && method === 'POST') &&
  !(path === '/v1/owners' && method === 'POST');

// API 서버에 요청하고 봉투를 벗긴 data를 돌려준다
// 인증 토큰은 서버가 HttpOnly 쿠키로 주고받으므로 따로 싣지 않는다
// Access Token(30분)이 만료돼 401 AUTH-005가 오면 Refresh Token으로 재발급하고 한 번만 더 보낸다
// 네트워크가 끊겨 응답을 못 받거나 시간이 지나 요청을 끊으면 fetch가 던진 오류가 그대로 올라간다
export const request = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const sentAfterRefreshCount = refreshCount;

  try {
    return await send<T>(path, options);
  } catch (error) {
    const isExpired =
      error instanceof ApiError &&
      error.status === 401 &&
      error.code === ACCESS_TOKEN_EXPIRED_CODE;
    if (!isExpired || !needsSession(path, options.method)) throw error;

    // 보낸 뒤에 다른 요청이 이미 재발급했으면 다시 재발급하지 않는다
    if (sentAfterRefreshCount === refreshCount && !(await refreshTokens())) {
      throw error;
    }
    return send<T>(path, options);
  }
};
