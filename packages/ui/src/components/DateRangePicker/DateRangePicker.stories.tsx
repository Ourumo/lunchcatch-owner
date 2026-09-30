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
