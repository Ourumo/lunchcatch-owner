import type { Meta, StoryObj } from '@storybook/react-vite';

import { PasswordInput } from './PasswordInput';

const meta = {
  title: 'Owner/PasswordInput',
  component: PasswordInput,
  args: {
    label: '비밀번호',
    placeholder: '8자 이상 20자 미만',
  },
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: {
    defaultValue: 'lunchcatch123',
  },
};

export const Error: Story = {
  args: {
    defaultValue: 'lunch',
    errorMessage: '비밀번호는 8자 이상 20자 미만으로 입력해주세요.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
