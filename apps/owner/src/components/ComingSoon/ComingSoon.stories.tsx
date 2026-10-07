import type { Meta, StoryObj } from '@storybook/react-vite';

import { ComingSoon } from './ComingSoon';

const meta = {
  title: 'Owner/ComingSoon',
  component: ComingSoon,
  args: {
    title: '가게 관리',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ComingSoon>;

export default meta;
type Story = StoryObj<typeof meta>;

// 탭 첫 화면처럼 돌아갈 곳이 없는 화면
export const TabRoot: Story = {};

// 다른 화면에서 들어온 하위 화면
export const WithBack: Story = {
  args: {
    onBack: () => undefined,
    title: '포인트 내역',
  },
};
