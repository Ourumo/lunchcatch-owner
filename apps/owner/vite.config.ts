import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
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
  },
});
