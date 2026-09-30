import type { Meta, StoryObj } from '@storybook/react-vite';

import { SegmentedControl } from './SegmentedControl';

const items = [
  { label: '전체 메뉴', value: 'all' },
  { label: '특정 메뉴', value: 'specific' },
];

const meta = {
  title: 'Shared/Forms/SegmentedControl',
  component: SegmentedControl,
  args: {
    ariaLabel: '메뉴 범위 선택',
    items,
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultValue: 'specific',
  },
};

export const Disabled: Story = {
  args: {
    items: [
      items[0],
      { disabled: true, label: '특정 메뉴', value: 'specific' },
    ],
  },
};
