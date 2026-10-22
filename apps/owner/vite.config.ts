import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// 개발 중 API 서버 주소. 다른 서버에 붙이려면 API_PROXY_TARGET 환경변수로 바꾼다
const DEFAULT_API_PROXY_TARGET = 'http://localhost:8080';

// 개발 중 사진을 올릴 S3 버킷 주소. 다른 버킷에 올리려면 S3_UPLOAD_PROXY_TARGET 환경변수로 바꾼다
const DEFAULT_S3_UPLOAD_PROXY_TARGET =
  'https://lunchcatch-dev-media.s3.ap-northeast-2.amazonaws.com';

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
          // 브라우저는 같은 주소로 보내는 POST에도 Origin(http://localhost:5174)을 붙인다.
          // API 서버의 CORS가 localhost를 허용하지 않아 403으로 거절하므로, 넘길 때 Origin을 지운다
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
        // 개발에서만 쓴다. S3 버킷의 CORS가 localhost를 허용하지 않아, 업로드 주소로 바로 PUT하면 막힌다.
        // 화면이 업로드 주소의 경로와 쿼리를 /s3-upload 뒤에 붙여 부르면 여기서 버킷으로 넘긴다. 배포에서는 업로드 주소로 바로 올린다.
        // 업로드 주소의 서명에 Host가 들어가므로 changeOrigin으로 Host를 버킷 주소로 맞춘다
        '/s3-upload': {
          target: env.S3_UPLOAD_PROXY_TARGET || DEFAULT_S3_UPLOAD_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/s3-upload/, ''),
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
