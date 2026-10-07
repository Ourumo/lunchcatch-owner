import { Link } from 'react-router';

import type { Campaign } from '@owner/api/campaign';
import {
  formatNumber,
  formatPeriod,
  formatPoints,
} from '@owner/features/campaign/campaignFormat';
import { CampaignStatusBadge } from '@owner/features/campaign/CampaignStatusBadge';

export interface EndedCampaignCardProps {
  campaign: Campaign;
  title: string;
}

// 종료된 캠페인. 집행 기간 전체의 누적 실적을 보여준다
export const EndedCampaignCard = ({
  campaign,
  title,
}: EndedCampaignCardProps) => {
  const { budget, performance, status } = campaign;
  const total = performance?.total;
  const redeemedRate =
    total && total.issuedCount > 0
      ? Math.round((total.redeemedCount / total.issuedCount) * 100)
      : 0;

  return (
    <Link
      className="block rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      to={`/campaigns/${campaign.id}`}
    >
      <div className="flex items-center gap-2">
        <CampaignStatusBadge status={status} />
        <span className="text-caption-mobile text-text-secondary">
          {formatPeriod(budget.startDate, budget.endDate)}
        </span>
      </div>
      <h3 className="mt-2 text-body-mobile font-bold text-text-primary">
        {title}
      </h3>
      {total && (
        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-bg-page px-3 py-2.5">
          <div>
            <dt className="text-caption-mobile text-text-secondary">발급</dt>
            <dd className="mt-0.5 text-body-sm-mobile font-bold text-text-primary">
              {formatNumber(total.issuedCount)}장
            </dd>
          </div>
          <div>
            <dt className="text-caption-mobile text-text-secondary">
              사용 (사용률)
            </dt>
            <dd className="mt-0.5 text-body-sm-mobile font-bold text-text-primary">
              {formatNumber(total.redeemedCount)}장{' '}
              <span className="font-medium text-text-secondary">
                ({redeemedRate}%)
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-caption-mobile text-text-secondary">
              소진 포인트
            </dt>
            <dd className="mt-0.5 text-body-sm-mobile font-bold text-text-primary">
              {formatPoints(total.spentPoints)}
            </dd>
          </div>
        </dl>
      )}
    </Link>
  );
};
