import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MultiSelectField } from './MultiSelectField';

const options = [
  { label: '집행 예정', value: 'SCHEDULED' },
  { label: '집행 중', value: 'ACTIVE' },
  { label: '일시 중단', value: 'PAUSED' },
  { label: '종료', value: 'ENDED' },
];
const meta = {
  title: 'Shared/Forms/MultiSelectField',
  component: MultiSelectField,
  args: { options, fitContent: true },
  decorators: [
    (Story) => (
      <div className="min-h-72 p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MultiSelectField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MultipleSelected: Story = {
  args: { defaultValue: ['SCHEDULED', 'ACTIVE'] },
};
export const AllSelected: Story = {
  args: { defaultValue: options.map((option) => option.value) },
};
export const Disabled: Story = {
  args: { disabled: true, defaultValue: ['ACTIVE'] },
};
export const DisabledOption: Story = {
  args: {
    options: options.map((option) => ({
      ...option,
      disabled: option.value === 'ENDED',
    })),
  },
};
export const OpensAbove: Story = {
  args: { menuPlacement: 'top' },
  decorators: [
    (Story) => (
      <div className="pt-60">
        <Story />
      </div>
    ),
  ],
};
export const Controlled: Story = {
  render: function ControlledField(args) {
    const [value, setValue] = useState(['SCHEDULED', 'ACTIVE']);
    return (
      <MultiSelectField {...args} value={value} onValueChange={setValue} />
    );
  },
};
