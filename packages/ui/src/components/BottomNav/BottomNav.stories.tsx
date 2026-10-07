import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Compass,
  House,
  Store,
  Ticket,
  User,
  UtensilsCrossed,
} from 'lucide-react';

import { BottomNav, type BottomNavItem } from './BottomNav';

const userItems: BottomNavItem[] = [
  { icon: <UtensilsCrossed />, label: '오늘 점심', value: 'swipe' },
  { icon: <Compass />, label: '탐색', value: 'explore' },
  { icon: <Ticket />, label: '쿠폰함', value: 'coupon' },
  { icon: <User />, label: '마이', value: 'my' },
];

// 점주 앱(apps/owner TabLayout)과 같은 구성. 캠페인이 메인 기능이라 가운데에 둔다
const ownerItems: BottomNavItem[] = [
  { icon: <House />, label: '홈', value: 'home' },
  { icon: <Ticket />, label: '캠페인', value: 'campaign' },
  { icon: <Store />, label: '가게 관리', value: 'store' },
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
