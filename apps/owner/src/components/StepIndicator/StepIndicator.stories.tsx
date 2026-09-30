import type { Meta, StoryObj } from '@storybook/react-vite';

import { StepIndicator } from './StepIndicator';

const meta = {
  title: 'Owner/StepIndicator',
  component: StepIndicator,
  args: {
    current: 2,
    label: '회원가입 진행 단계',
    title: '가게 기본 정보',
    total: 4,
  },
  decorators: [
    (Story) => (
      <div className="bg-bg-surface" style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StepIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstStep: Story = {
  args: {
    current: 1,
    title: '약관 동의',
  },
};

export const LastStep: Story = {
  args: {
    current: 4,
    title: '영업신고증',
  },
};

export const WithoutTitle: Story = {
  args: {
    title: undefined,
  },
};
