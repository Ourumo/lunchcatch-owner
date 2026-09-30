import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DatePicker } from './DatePicker';

const meta = {
  component: DatePicker,
  title: 'Shared/Forms/DatePicker',
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('2026-09-30');

    return <DatePicker onValueChange={setValue} value={value} />;
  },
};

export const Empty: Story = {
  args: {
    placeholder: '가입일 선택',
  },
};
