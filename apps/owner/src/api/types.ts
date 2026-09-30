// 모든 API 함수가 같은 형태로 성공과 실패를 돌려준다
export type ApiResult<TData, TFieldErrors = never> =
  | { ok: true; data: TData }
  | { ok: false; message?: string; fieldErrors?: TFieldErrors };
