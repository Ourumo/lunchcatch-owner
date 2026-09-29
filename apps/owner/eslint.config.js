import config from '@repo/eslint-config';

export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // 상위 폴더는 상대 경로 대신 앱 경로 별칭으로 가져온다
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: '상위 폴더는 @owner/ 별칭으로 가져옵니다.',
            },
          ],
        },
      ],
    },
  },
];
