import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusBadge } from './StatusBadge';

const meta = {
  title: 'Shared/StatusBadge',
  component: StatusBadge,
  args: {
    children: 'Info',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'danger',
  },
};
