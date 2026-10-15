import type { Meta, StoryObj } from '@storybook/react-vite';

import { AuthCheckScreen } from './AuthCheckScreen';

const meta = {
  title: 'Owner/AuthCheckScreen',
  component: AuthCheckScreen,
  args: {
    status: 'checking',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AuthCheckScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// 앱을 열고 내 정보 조회 응답을 기다리는 동안
export const Checking: Story = {};

// 서버가 응답하지 않거나 네트워크가 끊겨 로그인 상태를 확인하지 못했을 때
export const Failed: Story = {
  args: {
    onRetry: () => undefined,
    status: 'failed',
  },
};
