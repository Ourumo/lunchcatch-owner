import '../src/index.css';

import type { Preview } from '@storybook/react-vite';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo': Storybook 테스트 UI에서만 접근성 위반을 표시한다.
      // 'error': 접근성 위반이 있으면 CI를 실패 처리한다.
      // 'off': 접근성 검사를 실행하지 않는다.
      test: 'error',
    },
  },
};

export default preview;
