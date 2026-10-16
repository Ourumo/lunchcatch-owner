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

export const Required: Story = {
  args: {
    label: '관리자 ID',
    required: true,
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: '런치캐치',
    label: 'Label',
  },
};

export const WithTrailing: Story = {
  args: {
    defaultValue: '20',
    inputMode: 'numeric',
    label: '할인율',
    trailing: '%',
  },
};

export const WithHelperText: Story = {
  args: {
    label: '조정 포인트',
    trailing: 'P',
    helperText: '양수는 포인트 지급, 음수는 포인트 차감입니다.',
  },
};

export const ErrorWithHelperText: Story = {
  args: {
    label: '조정 포인트',
    helperText: '양수는 포인트 지급, 음수는 포인트 차감입니다.',
    errorMessage: '조정 포인트를 0이 아닌 정수로 입력해 주세요.',
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
