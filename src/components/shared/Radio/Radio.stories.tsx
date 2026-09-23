import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio } from './Radio';

const meta = {
  title: 'Shared/Forms/Radio',
  component: Radio,
  args: {
    label: 'Radio',
    name: 'radio-story',
  },
} satisfies Meta<typeof Radio>;

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
