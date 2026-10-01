import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './Checkbox';

const meta = {
  title: 'Shared/Forms/Checkbox',
  component: Checkbox,
  args: {
    label: 'Checkbox',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Large: Story = {
  args: {
    label: '약관 전체 동의',
    size: 'lg',
  },
};

export const LargeChecked: Story = {
  args: {
    defaultChecked: true,
    label: '약관 전체 동의',
    size: 'lg',
  },
};

export const LargeDisabled: Story = {
  args: {
    disabled: true,
    label: '약관 전체 동의',
    size: 'lg',
  },
};

export const Inverse: Story = {
  args: {
    variant: 'inverse',
  },
};

export const InverseChecked: Story = {
  args: {
    defaultChecked: true,
    variant: 'inverse',
  },
};

export const LargeInverseChecked: Story = {
  args: {
    defaultChecked: true,
    label: '약관 전체 동의',
    size: 'lg',
    variant: 'inverse',
  },
};
