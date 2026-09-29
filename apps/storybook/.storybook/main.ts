import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    // 공통 컴포넌트
    '../../../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // 앱별 컴포넌트
    '../../*/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react-vite',
};

export default config;
