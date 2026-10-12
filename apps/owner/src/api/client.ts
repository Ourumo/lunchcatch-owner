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

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
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

const readEnvelope = async <T>(
  response: Response,
): Promise<ResponseEnvelope<T> | null> => {
  try {
    return (await response.json()) as ResponseEnvelope<T>;
  } catch {
    return null;
  }
};

// API 서버에 요청하고 봉투를 벗긴 data를 돌려준다
// 인증 토큰은 서버가 HttpOnly 쿠키로 주고받으므로 따로 싣지 않는다
// 네트워크가 끊겨 응답을 못 받으면 fetch가 던진 오류가 그대로 올라간다
export const request = async <T>(
  path: string,
  { body, method = 'GET' }: RequestOptions = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    // 배포에서는 점주 앱(owner.lunchcatch.com)과 API 서버(api.lunchcatch.com)의 주소가 달라
    // 인증 쿠키를 실으려면 include가 필요하다. 같은 사이트(lunchcatch.com)라서 SameSite=Strict 쿠키도 함께 간다
    credentials: 'include',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 204는 본문과 봉투가 없다
  if (response.status === 204) return undefined as T;

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
