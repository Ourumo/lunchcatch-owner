import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilterChip } from './FilterChip';

const meta = {
  title: 'Shared/Forms/FilterChip',
  component: FilterChip,
  args: {
    label: '상태: 대기',
  },
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Removable: Story = {
  args: {
    onRemove: () => undefined,
  },
};
