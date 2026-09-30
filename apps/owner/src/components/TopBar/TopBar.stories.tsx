import type { Meta, StoryObj } from '@storybook/react-vite';

import { TopBar } from './TopBar';

const meta = {
  title: 'Owner/TopBar',
  component: TopBar,
  args: {
    title: '가게 기본 정보',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBack: Story = {
  args: {
    onBack: () => undefined,
  },
};

export const TitleOnly: Story = {};

export const LongTitle: Story = {
  args: {
    onBack: () => undefined,
    title: '사업자등록정보 입력 및 영업신고증 업로드 안내',
  },
};

export const WithTrailing: Story = {
  args: {
    onBack: () => undefined,
    trailing: (
      <span className="type-caption text-text-primary">
        <span className="font-semibold">2</span> / 5
      </span>
    ),
  },
};
