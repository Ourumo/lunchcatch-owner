import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowRightLeft,
  ChartNoAxesColumn,
  Compass,
  House,
  Menu,
  Settings,
  Ticket,
  User,
} from 'lucide-react';

import { BottomNav, type BottomNavItem } from './BottomNav';

const userItems: BottomNavItem[] = [
  { icon: <ArrowRightLeft />, label: '스와이프', value: 'swipe' },
  { icon: <Compass />, label: '탐색', value: 'explore' },
  { icon: <Ticket />, label: '쿠폰함', value: 'coupon' },
  { icon: <User />, label: '마이', value: 'my' },
];

const ownerItems: BottomNavItem[] = [
  { icon: <House />, label: '홈', value: 'home' },
  { icon: <Ticket />, label: '캠페인', value: 'campaign' },
  { icon: <ChartNoAxesColumn />, label: '통계', value: 'stats' },
  { icon: <Settings />, label: '매장관리', value: 'store' },
  { icon: <Menu />, label: '더보기', value: 'more' },
];

const meta = {
  title: 'Shared/Navigation/BottomNav',
  component: BottomNav,
  args: {
    items: userItems,
    value: 'explore',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <BottomNav {...args} onValueChange={setValue} value={value} />;
  },
} satisfies Meta<typeof BottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserApp: Story = {};

export const OwnerApp: Story = {
  args: {
    items: ownerItems,
    value: 'home',
  },
};
