import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { TimePicker, type TimePickerProps } from './TimePicker';

// 값을 바꾸면 칸에 바로 반영되도록 상태를 붙여 보여준다
const ControlledTimePicker = (props: TimePickerProps) => {
  const [value, setValue] = useState(props.value);

  return <TimePicker {...props} onValueChange={setValue} value={value} />;
};

const meta = {
  title: 'Owner/TimePicker',
  component: TimePicker,
  args: {
    label: '영업 시작시간',
    value: '',
    onValueChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  render: (args) => <ControlledTimePicker {...args} />,
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithValue: Story = {
  args: {
    value: '11:00',
  },
};

export const WithError: Story = {
  args: {
    errorMessage: '시작 시간보다 늦어야 해요',
    label: '영업 종료시간',
    value: '10:00',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: '11:00',
  },
};
