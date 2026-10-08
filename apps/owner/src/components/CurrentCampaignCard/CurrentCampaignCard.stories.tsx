import { MemoryRouter } from 'react-router';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Campaign } from '@owner/api/campaign';

import { CurrentCampaignCard } from './CurrentCampaignCard';

// 남은 일수 문구가 날짜와 상관없이 같게 보이도록 오늘 기준으로 날짜를 만든다
const daysFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const activeCampaign: Campaign = {
  id: 'campaign-active',
  status: 'ACTIVE',
  pausedReason: null,
  createdAt: '2026-10-01T09:00:00+09:00',
  reviewFailReasons: [],
  coupon: {
    discountTarget: 'ALL',
    menuId: null,
    discountType: 'PERCENT',
    discountValue: 20,
    issueLimit: 50,
    usableFrom: '11:30',
    usableUntil: '15:00',
  },
  poster: null,
  target: {
    radius: 1000,
    gender: 'ALL',
    ageGroups: [],
  },
  budget: {
    dailyBudget: 10000,
    startDate: daysFromToday(-3),
    endDate: daysFromToday(4),
  },
  performance: {
    today: {
      issuedCount: 24,
      redeemedCount: 12,
      reservedPoints: 10000,
      spentPoints: 2800,
    },
    total: {
      savedCount: 312,
      issuedCount: 158,
      redeemedCount: 96,
      spentPoints: 31200,
    },
  },
};

const meta = {
  title: 'Owner/CurrentCampaignCard',
  component: CurrentCampaignCard,
  args: {
    campaign: activeCampaign,
    title: '전 메뉴 20% 할인',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ width: 358 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CurrentCampaignCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

// 점주가 직접 중단한 캠페인
export const PausedByOwner: Story = {
  args: {
    campaign: { ...activeCampaign, status: 'PAUSED', pausedReason: 'OWNER' },
  },
};

// 잔액이 모자라 시스템이 중단한 캠페인
export const PausedNoPoints: Story = {
  args: {
    campaign: {
      ...activeCampaign,
      status: 'PAUSED',
      pausedReason: 'NO_POINTS',
    },
  },
};

// 오늘이 집행 대상이 아니면 오늘 실적 영역 없이 보여준다
export const WithoutTodayPerformance: Story = {
  args: {
    campaign: {
      ...activeCampaign,
      performance: activeCampaign.performance && {
        ...activeCampaign.performance,
        today: null,
      },
    },
  },
};
