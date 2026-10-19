import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DateRangePicker, type DateRangeValue } from './DateRangePicker';

const meta = {
  component: DateRangePicker,
  title: 'Shared/Forms/DateRangePicker',
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<DateRangeValue>({
      endDate: '2026-09-30',
      startDate: '2026-09-01',
    });

    return <DateRangePicker onValueChange={setValue} value={value} />;
  },
};

export const Empty: Story = {};

export const Weekly: Story = {
  args: {
    selectionMode: 'week',
    ariaLabel: '주 범위 선택',
    placeholder: '주 범위 선택',
  },
};

export const Monthly: Story = {
  args: {
    selectionMode: 'month',
    ariaLabel: '월 범위 선택',
    placeholder: '월 범위 선택',
  },
};

export const SameDayRange: Story = {
  args: {
    defaultValue: { startDate: '2026-10-19', endDate: '2026-10-19' },
  },
};
