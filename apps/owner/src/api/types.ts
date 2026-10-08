// 모든 API 함수가 같은 형태로 성공과 실패를 돌려준다
export type ApiResult<TData, TFieldErrors = never> =
  | { ok: true; data: TData }
  | {
      ok: false;
      message?: string;
      // 실패 종류에 따라 화면이 다르게 안내해야 할 때 쓰는 구분 값 (예: UPCOMING_LIMIT_ERROR)
      code?: string;
      fieldErrors?: TFieldErrors;
    };
