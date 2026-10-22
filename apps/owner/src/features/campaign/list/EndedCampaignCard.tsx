import { Link } from 'react-router';

import type { Campaign } from '@owner/api/campaign';
import { useTotalPerformance } from '@owner/hooks/useCampaignPerformance';
import {
  formatNumber,
  formatPeriod,
  formatPoints,
} from '@owner/ui/campaignFormat';
import { CampaignStatusBadge } from '@owner/ui/CampaignStatusBadge/CampaignStatusBadge';
import { PerformanceError } from '@owner/ui/PerformanceError/PerformanceError';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';

export interface EndedCampaignCardProps {
  campaign: Campaign;
  title: string;
}

// 종료된 캠페인. 집행 기간 전체의 누적 실적을 보여준다.
// 실적은 카드마다 따로 불러와 목록은 먼저 보이고, 못 받아도 카드는 그대로 둔다
export const EndedCampaignCard = ({
  campaign,
  title,
}: EndedCampaignCardProps) => {
  const { budget, status } = campaign;
  const { retry, state } = useTotalPerformance(campaign);
  const total = state.status === 'success' ? state.data : null;
  const redeemedRate =
    total && total.issuedCount > 0
      ? Math.round((total.redeemedCount / total.issuedCount) * 100)
      : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface transition-colors has-[>a:hover]:border-brand-300">
      <Link
        className="block p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
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
        {state.status === 'loading' && (
          <SkeletonBlock
            className="mt-3 h-14"
            label="누적 실적을 불러오는 중"
            rounded="lg"
          />
        )}
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
      {/* 다시 시도 버튼은 링크 안에 둘 수 없어 링크 아래에 둔다 */}
      {state.status === 'error' && (
        <PerformanceError className="mx-4 mb-4" onRetry={retry} />
      )}
    </div>
  );
};
