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
    (Story) => (
      <div className="bg-bg-page" style={{ width: 390 }}>
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

export const WithHint: Story = {
  args: {
    hint: '필수 약관 3개 중 2개에 동의했어요',
    isNextDisabled: true,
    onPrevious: undefined,
  },
};
