import config from '@repo/eslint-config';
import path from 'node:path';

export default [
  ...config,
  {
    // lint-staged처럼 루트에서 실행해도 이 앱의 package.json에서 addon 설치 여부를 확인한다
    files: ['.storybook/main.ts'],
    rules: {
      'storybook/no-uninstalled-addons': [
        'error',
        { packageJsonLocation: path.join(import.meta.dirname, 'package.json') },
      ],
    },
  },
];
