import { HttpResponse } from 'msw/http';

// 서버와 같은 응답 봉투를 만든다. api/client.ts의 readEnvelope가 code === 'SUCCESS'인지 보고 data를 꺼낸다.
// 핸들러는 HttpResponse를 직접 만들지 않고 이 함수들로만 응답해, 봉투 모양이 핸들러마다 달라지지 않게 한다

// 성공 (200). data에 결과를 담는다
export const ok = <T>(data: T) =>
  HttpResponse.json({ code: 'SUCCESS', message: '요청에 성공했습니다.', data });

// 서버가 거절한 응답. code는 서버 오류 코드와 같게 둬야 api/*.ts가 이유를 구분한다 (예: 401 AUTH-005)
export const fail = (status: number, code: string, message: string) =>
  HttpResponse.json({ code, message, data: null }, { status });

// 본문 없는 성공 (204). 로그아웃처럼 서버가 본문 없이 답하는 요청에 쓴다
export const noContent = () => new HttpResponse(null, { status: 204 });

// 로그인하지 않았을 때. 서버의 "Access Token 없음·만료"와 같은 코드라,
// 화면은 재발급을 시도하고 재발급도 401이면 로그인 화면으로 보낸다 (api/client.ts request)
export const unauthenticated = () =>
  fail(401, 'AUTH-005', '로그인이 필요합니다.');
