import { MemoryRouter } from 'react-router';
import { Button, type ButtonVariant } from '@repo/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { Campaign, CampaignTodayPerformance } from '@owner/api/campaign';

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
  coupon: {
    discountTarget: 'ALL',
    menuId: null,
    discountType: 'AMOUNT',
    discountValue: 2000,
    issueLimit: 50,
    usableFrom: '11:30',
    usableUntil: '15:00',
    minOrderAmount: null,
    notice: '',
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

// 오늘 실적만 바꾼 캠페인
const withToday = (today: CampaignTodayPerformance | null): Campaign => ({
  ...activeCampaign,
  performance: activeCampaign.performance && {
    ...activeCampaign.performance,
    today,
  },
});

const meta = {
  title: 'Owner/CurrentCampaignCard',
  component: CurrentCampaignCard,
  args: {
    campaign: activeCampaign,
    title: '전 메뉴 2,000원 할인',
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

// 캠페인 탭이 카드 아래에 붙이는 버튼 영역과 같은 모양. 버튼이 여러 개면 나란히 같은 폭으로 둔다
const actionFooter = (buttons: { label: string; variant: ButtonVariant }[]) => (
  <div className="flex gap-2 border-t border-border-subtle p-3">
    {buttons.map(({ label, variant }) => (
      <Button className="h-11 flex-1" key={label} variant={variant}>
        {label}
      </Button>
    ))}
  </div>
);

export const Active: Story = {};

// 캠페인 탭에서는 진행 중 캠페인 카드 아래에 중단 버튼을 붙인다
export const ActiveWithFooter: Story = {
  args: {
    footer: actionFooter([{ label: '캠페인 중단', variant: 'neutral' }]),
  },
};

const pausedByOwnerCampaign: Campaign = {
  ...activeCampaign,
  status: 'PAUSED',
  pausedReason: 'OWNER',
};

// 점주가 직접 일시중지한 캠페인
export const PausedByOwner: Story = {
  args: { campaign: pausedByOwnerCampaign },
};

// 직접 일시중지했으면 다시 시작하거나 종료할 수 있다
export const PausedByOwnerWithFooter: Story = {
  args: {
    campaign: pausedByOwnerCampaign,
    footer: actionFooter([
      { label: '캠페인 종료', variant: 'neutral' },
      { label: '다시 시작', variant: 'secondary' },
    ]),
  },
};

const pausedNoPointsCampaign: Campaign = {
  ...activeCampaign,
  status: 'PAUSED',
  pausedReason: 'NO_POINTS',
};

// 잔액이 모자라 시스템이 중단한 캠페인
export const PausedNoPoints: Story = {
  args: { campaign: pausedNoPointsCampaign },
};

// 잔액 부족은 충전하면 자동으로 다시 시작되므로 종료만 둔다
export const PausedNoPointsWithFooter: Story = {
  args: {
    campaign: pausedNoPointsCampaign,
    footer: actionFooter([{ label: '캠페인 종료', variant: 'neutral' }]),
  },
};

// 오늘이 집행 대상이 아니면 오늘 실적 영역 없이 보여준다
export const WithoutTodayPerformance: Story = {
  args: {
    campaign: withToday(null),
  },
};

// 오늘 막 열려 아직 발급이 없으면 바탕 막대만 보이고 남은 쿠폰은 전체 수량이다
export const NothingIssued: Story = {
  args: {
    campaign: withToday({
      issuedCount: 0,
      redeemedCount: 0,
      reservedPoints: 10000,
      spentPoints: 0,
    }),
  },
};

// 발급이 전체 수량을 넘는 데이터가 와도 막대는 카드 밖으로 넘치지 않고, 남은 쿠폰은 0장이다
export const OverIssued: Story = {
  args: {
    campaign: withToday({
      issuedCount: 55,
      redeemedCount: 30,
      reservedPoints: 10000,
      spentPoints: 9800,
    }),
  },
};

// 집행 전이라 실적 없이 시작일을 보여준다
const scheduledCampaign: Campaign = {
  ...activeCampaign,
  status: 'SCHEDULED',
  budget: {
    ...activeCampaign.budget,
    startDate: daysFromToday(3),
    endDate: daysFromToday(9),
  },
  performance: null,
};

export const Scheduled: Story = {
  args: { campaign: scheduledCampaign },
};

// 캠페인 탭에서는 카드 아래에 대기 중 취소 버튼을 붙인다
export const ScheduledWithFooter: Story = {
  args: {
    campaign: scheduledCampaign,
    footer: actionFooter([{ label: '대기 중 취소', variant: 'neutral' }]),
  },
};

// 작성 중이면 만든 날을 보여주고, 아직 정하지 않은 기간은 "기간 미정"으로 보인다
export const Draft: Story = {
  args: {
    campaign: {
      ...activeCampaign,
      status: 'DRAFT',
      budget: { dailyBudget: null, startDate: '', endDate: '' },
      performance: null,
    },
  },
};
