import type { Meta, StoryObj } from '@storybook/react-vite';

import { StepActionBar } from './StepActionBar';

const meta = {
  title: 'Owner/StepActionBar',
  component: StepActionBar,
  args: {
    onNext: () => undefined,
    onPrevious: () => undefined,
  },
  decorators: [
    // 화면 하단에 고정되는 요소라, transform이 있는 틀 안에 고정되도록 감싼다
    (Story) => (
      <div
        className="bg-bg-page"
        style={{ height: 160, transform: 'translateZ(0)', width: 390 }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StepActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstStep: Story = {
  args: {
    onPrevious: undefined,
  },
};

export const LastStep: Story = {
  args: {
    nextLabel: '입점 신청하기',
  },
};

export const NextDisabled: Story = {
  args: {
    isNextDisabled: true,
  },
};

export const NextLoading: Story = {
  args: {
    isNextLoading: true,
  },
};
