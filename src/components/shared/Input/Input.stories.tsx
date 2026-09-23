import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';

const meta = {
  title: 'Shared/Forms/Input',
  component: Input,
  args: {
    label: 'Label',
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

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: '런치캐치',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
