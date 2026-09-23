import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchField } from './SearchField';

const meta = {
  title: 'Shared/Forms/SearchField',
  component: SearchField,
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: '런치캐치',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
