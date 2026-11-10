import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@repo/ui';

import App from './app/App.tsx';

initializeTheme();

// 목 모드(VITE_USE_MOCK=true)면 서버 대신 답할 MSW를 먼저 켠다.
// 앱이 그려지자마자 내 정보 조회를 보내므로, 워커가 준비된 뒤에 그려야 첫 요청부터 가로챌 수 있다.
// 값이 'true'가 아니면 빌드할 때 이 블록이 통째로 빠져 MSW 코드가 번들에 들어가지 않는다
const enableMocking = async () => {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }
};

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
