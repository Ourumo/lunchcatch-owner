import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  BusinessHoursFields,
  type BusinessHoursFieldsProps,
  type WeekdayOption,
} from './BusinessHoursFields';

// components는 api의 값을 가져오지 않으므로 api/signupFlow의 weekdays와 같은 목록을 둔다
const weekdays: WeekdayOption[] = [
  { value: 'MON', label: '월' },
  { value: 'TUE', label: '화' },
  { value: 'WED', label: '수' },
  { value: 'THU', label: '목' },
  { value: 'FRI', label: '금' },
  { value: 'SAT', label: '토' },
  { value: 'SUN', label: '일' },
];

// 요일과 시간을 바꾸면 바로 반영되도록 상태를 붙여 보여준다
const ControlledFields = (props: BusinessHoursFieldsProps) => {
  const [value, setValue] = useState(props.value);

  return <BusinessHoursFields {...props} onChange={setValue} value={value} />;
};

const meta = {
  title: 'Owner/BusinessHoursFields',
  component: BusinessHoursFields,
  args: {
    value: { openDays: [], openTime: '', closeTime: '' },
    onChange: () => {},
    weekdays,
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
  render: (args) => <ControlledFields {...args} />,
} satisfies Meta<typeof BusinessHoursFields>;

export default meta;
type Story = StoryObj<typeof meta>;

// 입점 등록 처음 화면
export const Empty: Story = {};

export const WithValue: Story = {
  args: {
    value: {
      openDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      openTime: '11:00',
      closeTime: '21:00',
    },
  },
};

export const TimeRangeError: Story = {
  args: {
    value: { openDays: ['MON'], openTime: '14:00', closeTime: '11:00' },
    timeRangeError: '시작 시간보다 늦어야 해요',
  },
};

// 가게 관리 영업시간 수정에서 요일을 모두 뺐을 때
export const DaysHintAndError: Story = {
  args: {
    value: { openDays: [], openTime: '11:00', closeTime: '21:00' },
    daysHint: '고르지 않은 요일은 휴무로 저장돼요.',
    daysError: '영업 요일을 하루 이상 골라 주세요',
  },
};
