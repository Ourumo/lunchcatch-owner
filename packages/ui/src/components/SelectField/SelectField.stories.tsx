import type { Meta, StoryObj } from '@storybook/react-vite';

import { SelectField } from './SelectField';

const options = [
  { label: '최신순', value: 'latest' },
  { label: '오래된 순', value: 'oldest' },
];

const meta = {
  title: 'Shared/Forms/SelectField',
  component: SelectField,
  args: {
    options,
  },
  decorators: [
    (Story) => (
      <div className="w-[280px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultValue: 'latest',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const ScrollableOptions: Story = {
  args: {
    options: Array.from({ length: 24 }, (_, index) => ({
      value: String(index + 1),
      label: `선택 항목 ${index + 1}`,
    })),
  },
};
