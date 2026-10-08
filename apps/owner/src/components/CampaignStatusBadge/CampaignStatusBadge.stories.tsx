import type { Meta, StoryObj } from '@storybook/react-vite';

import { CampaignStatusBadge } from './CampaignStatusBadge';

const meta = {
  title: 'Owner/CampaignStatusBadge',
  component: CampaignStatusBadge,
  args: {
    status: 'ACTIVE',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CampaignStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {
  args: { status: 'DRAFT' },
};

export const Scheduled: Story = {
  args: { status: 'SCHEDULED' },
};

export const Active: Story = {};

export const Ended: Story = {
  args: { status: 'ENDED' },
};

// 점주가 직접 다시 시작할 수 있는 중단은 경고색
export const PausedByOwner: Story = {
  args: { status: 'PAUSED', pausedReason: 'OWNER' },
};

// 점주가 재개할 수 없는 중단은 위험색
export const PausedNoPoints: Story = {
  args: { status: 'PAUSED', pausedReason: 'NO_POINTS' },
};

export const PausedByAdmin: Story = {
  args: { status: 'PAUSED', pausedReason: 'ADMIN' },
};
