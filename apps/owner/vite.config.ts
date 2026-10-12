import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// 개발 중 API 서버 주소. 다른 서버에 붙이려면 API_PROXY_TARGET 환경변수로 바꾼다
const DEFAULT_API_PROXY_TARGET = 'http://localhost:8080';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      // 경로 별칭은 tsconfig.app.json의 paths를 그대로 사용한다
      tsconfigPaths: true,
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        // 개발에서만 쓴다. VITE_API_BASE_URL을 비워 두면 화면이 같은 주소의 /v1로 부르고,
        // 여기서 API 서버로 넘겨 CORS 설정 없이 쿠키까지 주고받는다. 배포에서는 API 서버를 직접 부른다.
        // /v1은 API 버전이다. 서버가 /v2를 만들면 여기에도 추가해야 한다
        '/v1': {
          target: env.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET,
          changeOrigin: true,
          // 개발 서버는 인증 쿠키를 lunchcatch.com 도메인으로 준다. localhost에서는 그 쿠키를 저장하지 않으므로
          // 도메인 지정을 지워 지금 주소(localhost)의 쿠키로 받는다
          cookieDomainRewrite: '',
          // 브라우저는 같은 주소로 보내는 POST에도 Origin(http://localhost:5174)을 붙인다.
          // API 서버의 CORS가 localhost를 허용하지 않아 403으로 거절하므로, 넘길 때 Origin을 지운다
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});
