import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs } from './Tabs';

const items = [
  { label: '찜한 쿠폰', value: 'saved-coupons' },
  { label: '사용자', value: 'user' },
];

const meta = {
  title: 'Shared/Forms/Tabs',
  component: Tabs,
  args: {
    items,
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultValue: 'user',
  },
};

export const Disabled: Story = {
  args: {
    items: [items[0], { disabled: true, label: '사용자', value: 'user' }],
  },
};
