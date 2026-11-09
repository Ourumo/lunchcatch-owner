import { setupWorker } from 'msw/browser';

import { handlers } from '@owner/mocks/handlers';

// 목 모드 진입점. main.tsx가 VITE_USE_MOCK=true일 때만 이 파일을 불러온다.
//
// MSW(Mock Service Worker)가 동작하는 방식
// 1. 브라우저에 서비스 워커(public/mockServiceWorker.js)를 등록한다. 서비스 워커는 페이지와 네트워크 사이에서
//    페이지가 보내는 요청을 먼저 받아 볼 수 있는 브라우저 기능이다
// 2. 화면이 fetch로 요청을 보내면 서비스 워커가 가로채 이 페이지의 MSW에 "이 요청에 답할 핸들러가 있나?" 묻는다
// 3. 맞는 핸들러가 있으면 그 응답을 서버 응답인 것처럼 돌려주고, 없으면 원래대로 네트워크로 보낸다
//
// 그래서 api/*.ts는 목 모드인지 모른 채 평소처럼 요청하고, 토큰 재발급 · 오류 처리 같은 코드도 그대로 거친다
export const worker = setupWorker(...handlers);

export const startMockWorker = () =>
  worker.start({
    // 핸들러가 없는 요청(폰트, 카카오 · 토스 SDK 등)은 경고 없이 그대로 네트워크로 보낸다
    onUnhandledFrame: 'bypass',
    // 배포 화면의 콘솔에는 MSW 기록을 남기지 않는다. 로컬에서는 어떤 요청을 가로챘는지 콘솔에서 볼 수 있다
    quiet: import.meta.env.PROD,
  });
