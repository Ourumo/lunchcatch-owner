import type { Meta, StoryObj } from '@storybook/react-vite';

import { Toggle } from './Toggle';

const meta = {
  title: 'Shared/Forms/Toggle',
  component: Toggle,
  args: {
    label: 'On',
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
