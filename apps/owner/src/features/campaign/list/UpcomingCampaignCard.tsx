import { Link } from 'react-router';
import { ChevronRight, CircleAlert } from 'lucide-react';

import type { Campaign } from '@owner/api/campaign';
import { CampaignStatusBadge } from '@owner/components/CampaignStatusBadge/CampaignStatusBadge';
import {
  formatCreatedDate,
  formatPeriod,
  formatShortDate,
  getDaysFromToday,
} from '@owner/features/campaign/campaignFormat';

export interface UpcomingCampaignCardProps {
  campaign: Campaign;
  title: string;
}

const getScheduleLabel = ({ budget, createdAt, status }: Campaign) => {
  if (status === 'SCHEDULED' && budget.startDate) {
    const days = getDaysFromToday(budget.startDate);

    return days > 0
      ? `${formatShortDate(budget.startDate)} 시작 · ${days}일 뒤`
      : `${formatShortDate(budget.startDate)} 시작`;
  }

  return `${formatCreatedDate(createdAt)} 등록`;
};

// 시작을 기다리거나(SCHEDULED) 작성 중인(DRAFT) 캠페인
export const UpcomingCampaignCard = ({
  campaign,
  title,
}: UpcomingCampaignCardProps) => {
  const { budget, reviewFailReasons, status } = campaign;
  const isReviewFailed = status === 'DRAFT' && reviewFailReasons.length > 0;

  return (
    <Link
      className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      to={`/campaigns/${campaign.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={status} />
          <span className="truncate text-caption-mobile text-text-secondary">
            {getScheduleLabel(campaign)}
          </span>
        </div>
        <h3 className="mt-2 truncate text-body-mobile font-bold text-text-primary">
          {title}
        </h3>
        {isReviewFailed ? (
          <p className="mt-1 flex items-center gap-1 text-caption-mobile font-medium text-status-danger-fg">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            자동 검수를 통과하지 못했어요
          </p>
        ) : (
          <p className="mt-1 text-caption-mobile text-text-secondary">
            {formatPeriod(budget.startDate, budget.endDate)}
          </p>
        )}
      </div>
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-text-tertiary"
      />
    </Link>
  );
};
