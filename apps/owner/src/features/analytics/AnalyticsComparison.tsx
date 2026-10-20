import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { ChevronRight } from 'lucide-react';

import type { Campaign } from '@owner/api/campaign';
import { STORE_ANALYTICS_COMPARE_PATH } from '@owner/features/store/storePaths';
import {
  formatNumber,
  formatPeriod,
  formatPoints,
} from '@owner/ui/campaignFormat';
import { CampaignStatusBadge } from '@owner/ui/CampaignStatusBadge/CampaignStatusBadge';

import {
  type ComparisonItem,
  useCampaignComparison,
} from './useCampaignComparison';
import type { CampaignReportLoader } from './useCampaignReportLoader';

const getComparePath = (baseId: string, targetId: string) =>
  `${STORE_ANALYTICS_COMPARE_PATH}?${new URLSearchParams({ base: baseId, target: targetId })}`;

const ComparisonCardContent = ({
  item,
  title,
}: {
  item: ComparisonItem;
  title: string;
}) => {
  const { campaign, redeemCount, spentPoints } = item;

  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <CampaignStatusBadge
            pausedReason={campaign.pausedReason}
            status={campaign.status}
          />
          <span className="text-caption-mobile text-text-secondary">
            {formatPeriod(campaign.budget.startDate, campaign.budget.endDate)}
          </span>
        </span>
        <span className="mt-1.5 block truncate text-body-mobile font-bold text-text-primary">
          {title}
        </span>
      </span>
      {/* 집계된 날이 없는 캠페인은 0 대신 집계 전으로 보여준다 */}
      <span className="shrink-0 text-right">
        {redeemCount === null || spentPoints === null ? (
          <span className="text-caption-mobile text-text-tertiary">
            집계 전
          </span>
        ) : (
          <>
            <span className="block text-body-sm-mobile text-text-secondary">
              방문{' '}
              <span className="font-bold text-text-primary">
                {formatNumber(redeemCount)}건
              </span>
            </span>
            <span className="mt-0.5 block text-caption-mobile text-text-secondary">
              소진 {formatPoints(spentPoints)}
            </span>
          </>
        )}
      </span>
    </>
  );
};

export interface AnalyticsComparisonProps {
  campaigns: Campaign[];
  selectedId: string;
  getTitle: (campaign: Campaign) => string;
  loadReport: CampaignReportLoader;
}

// 캠페인 비교. 진행 중·일시중지 캠페인과 최근에 끝난 캠페인을 보여주고,
// 다른 캠페인을 누르면 지금 보던 캠페인과 비교하는 화면으로 간다
export const AnalyticsComparison = ({
  campaigns,
  getTitle,
  loadReport,
  selectedId,
}: AnalyticsComparisonProps) => {
  const { retry, state } = useCampaignComparison(campaigns, loadReport);

  const renderList = () => {
    if (state.status === 'loading') {
      return (
        <div aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">캠페인 비교를 불러오는 중</span>
          {[0, 1].map((index) => (
            <div
              aria-hidden="true"
              className="h-19 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
              key={index}
            />
          ))}
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-body-sm-mobile text-text-secondary" role="alert">
            캠페인 비교를 불러오지 못했어요
          </p>
          <Button onClick={retry} variant="secondary">
            다시 시도
          </Button>
        </div>
      );
    }

    return (
      <ul className="flex flex-col gap-2">
        {state.items.map((item) => {
          const { id } = item.campaign;
          const title = getTitle(item.campaign);

          return (
            <li key={id}>
              {id === selectedId ? (
                <div
                  aria-current="true"
                  className="flex items-center gap-3 rounded-xl border border-action-primary bg-surface-brand p-4"
                >
                  <ComparisonCardContent item={item} title={title} />
                </div>
              ) : (
                <Link
                  aria-label={`${title}, 지금 캠페인과 비교하기`}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
                  to={getComparePath(selectedId, id)}
                >
                  <ComparisonCardContent item={item} title={title} />
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-text-tertiary"
                  />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <section
      aria-labelledby="analytics-comparison-title"
      className="rounded-xl border border-border-subtle bg-bg-surface p-4"
    >
      <h2
        className="text-body-mobile font-bold text-text-primary"
        id="analytics-comparison-title"
      >
        캠페인 비교
      </h2>
      <p className="mt-1 mb-3 text-caption-mobile break-keep text-text-secondary">
        집행 기간 전체 기준이에요. 다른 캠페인을 누르면 지금 캠페인과 비교해요.
      </p>
      {renderList()}
    </section>
  );
};
