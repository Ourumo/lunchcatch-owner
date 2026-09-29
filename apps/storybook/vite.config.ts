/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    // 앱 컴포넌트의 스토리에서 쓰는 앱별 경로 별칭. 앱을 추가하면 여기에도 등록한다
    alias: {
      '@admin': path.resolve(dirname, '../admin/src'),
      '@owner': path.resolve(dirname, '../owner/src'),
      '@user': path.resolve(dirname, '../user/src'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
