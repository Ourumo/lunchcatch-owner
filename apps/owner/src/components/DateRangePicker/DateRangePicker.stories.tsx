import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DateRangePicker, type DateRangeValue } from './DateRangePicker';

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const meta = {
  title: 'Owner/DateRangePicker',
  component: DateRangePicker,
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
        <p className="mt-3 type-caption text-text-secondary">
          달력을 펼치면 이 문구가 아래로 밀려난다
        </p>
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    placeholder: '시작일과 종료일을 골라 주세요',
  },
};

// 집행 시작일처럼 내일부터만 고를 수 있다
export const WithMinDate: Story = {
  render: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [value, setValue] = useState<DateRangeValue>({
      endDate: '',
      startDate: '',
    });

    return (
      <DateRangePicker
        minDate={toDateValue(tomorrow)}
        onValueChange={setValue}
        placeholder="시작일과 종료일을 골라 주세요"
        value={value}
      />
    );
  },
};
