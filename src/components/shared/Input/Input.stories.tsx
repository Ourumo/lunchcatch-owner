import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta = {
  title: 'Shared/Forms/Input',
  component: Input,
  args: {
    placeholder: '입력값을 입력하세요',
  },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutLabel: Story = {};

export const WithLabel: Story = {
  args: {
    label: 'Label',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: '런치캐치',
    label: 'Label',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Label',
  },
};

export const Error: Story = {
  args: {
    errorMessage: '필수 입력 항목입니다.',
    label: 'Label',
  },
};
