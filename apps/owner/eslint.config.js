import { globalIgnores } from 'eslint/config';
import config from '@repo/eslint-config';

// 다른 레이어가 mocks를 가져오지 못하게 막는 규칙. 목 모드를 꺼도 앱 코드가 그대로 동작하도록 mocks는 main.tsx만 불러온다
const noMocksImport = {
  group: ['@owner/mocks', '@owner/mocks/*'],
  message:
    'mocks는 main.tsx만 가져옵니다. 목 모드인지는 import.meta.env.VITE_USE_MOCK으로 확인합니다.',
};

export default [
  ...config,
  // MSW가 만든 서비스 워커. 직접 고치지 않는다
  globalIgnores(['public/mockServiceWorker.js']),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/main.tsx', 'src/mocks/**', 'src/ui/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noMocksImport] }],
    },
  },
  {
    // mocks는 api의 타입만 가져와 응답 모양을 맞춘다 (docs/folder-structure.md "의존 방향")
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@owner/api/*'],
              allowTypeImports: true,
              message: 'mocks에서는 api의 타입만 import type으로 가져옵니다.',
            },
            {
              group: [
                '@owner/app/*',
                '@owner/auth/*',
                '@owner/features/*',
                '@owner/hooks/*',
                '@owner/layout/*',
                '@owner/pages/*',
                '@owner/ui/*',
              ],
              message: 'mocks에서는 다른 레이어를 가져오지 않습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    // ui는 다른 ui와 api의 타입만 가져온다 (docs/folder-structure.md "의존 방향")
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@owner/api/*'],
              allowTypeImports: true,
              message: 'ui에서는 api의 타입만 import type으로 가져옵니다.',
            },
            {
              group: [
                '@owner/app/*',
                '@owner/auth/*',
                '@owner/features/*',
                '@owner/layout/*',
                '@owner/pages/*',
              ],
              message: 'ui에서는 다른 ui만 가져옵니다.',
            },
            noMocksImport,
          ],
        },
      ],
    },
  },
];
