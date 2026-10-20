import { type ReactNode, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '@repo/ui';
import { ChevronDown, Info } from 'lucide-react';

import type { Campaign } from '@owner/api/campaign';
import type { CampaignDayReport } from '@owner/api/report';
import { formatPeriod, getCampaignTitle } from '@owner/ui/campaignFormat';
import { CampaignStatusBadge } from '@owner/ui/CampaignStatusBadge/CampaignStatusBadge';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { getComparisonCampaigns } from './analyticsCampaigns';
import { AnalyticsComparison } from './AnalyticsComparison';
import { AnalyticsSummary } from './AnalyticsSummary';
import { AnalyticsTrend } from './AnalyticsTrend';
import { CampaignSelectSheet } from './CampaignSelectSheet';
import { useStoreAnalytics } from './useStoreAnalytics';

const CAMPAIGNS_PATH = '/campaigns';

// 주소에 두는 선택한 캠페인 ID
const CAMPAIGN_ID_PARAM = 'campaignId';

const skeletonClassName =
  'animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none';

const notices = [
  '노출 수는 보장되지 않아요. 주변 직장인 수와 다른 캠페인 상황에 따라 달라져요.',
  '찜·발급·사용 수는 정산에 반영되지 않아요.',
  '수치는 하루 한 번 집계돼요. 오늘 값은 다음 날 반영돼요.',
];

const AnalyticsSkeleton = ({ label }: { label: string }) => (
  <div aria-busy="true" className="flex flex-col gap-5">
    <span className="sr-only">{label}</span>
    {[80, 176].map((height, index) => (
      <div
        aria-hidden="true"
        className={skeletonClassName}
        key={index}
        style={{ height }}
      />
    ))}
  </div>
);

const AnalyticsMessage = ({
  action,
  description,
  title,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <p className="text-body-mobile font-bold text-text-primary">{title}</p>
    <p className="text-body-sm-mobile break-keep text-text-secondary">
      {description}
    </p>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

// 집계된 기간과 집행 기간. 리포트는 날짜 오름차순으로 온다
const formatReportPeriod = (
  campaign: Campaign,
  report: CampaignDayReport[],
) => {
  const executionPeriod = `집행 ${formatPeriod(campaign.budget.startDate, campaign.budget.endDate)}`;

  if (report.length === 0) {
    return `아직 집계된 날이 없어요 · ${executionPeriod}`;
  }

  return `${formatPeriod(report[0].date, report[report.length - 1].date)} 집계 · ${executionPeriod}`;
};

interface CampaignSelectButtonProps {
  campaign: Campaign;
  title: string;
  onClick: () => void;
}

// 지금 보고 있는 캠페인. 누르면 다른 캠페인을 고르는 시트를 연다
const CampaignSelectButton = ({
  campaign,
  onClick,
  title,
}: CampaignSelectButtonProps) => (
  <button
    aria-haspopup="dialog"
    aria-label={`${title}, 캠페인 바꾸기`}
    className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 text-left transition-colors hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    onClick={onClick}
    type="button"
  >
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
      <span className="mt-1.5 block truncate text-h3-mobile font-bold text-text-primary">
        {title}
      </span>
    </span>
    <ChevronDown
      aria-hidden="true"
      className="size-5 shrink-0 text-text-secondary"
    />
  </button>
);

const AnalyticsNotices = () => (
  <aside
    aria-label="분석 안내"
    className="flex gap-2 rounded-xl bg-surface-subtle p-4"
  >
    <Info
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-text-tertiary"
    />
    <ul className="flex flex-col gap-1 text-caption-mobile break-keep text-text-secondary">
      {notices.map((notice) => (
        <li key={notice}>{notice}</li>
      ))}
    </ul>
  </aside>
);

interface StoreAnalyticsProps {
  onBack: () => void;
}

// 가게 관리 > 분석 (docs/requirements-owner.md "리포트 > 광고주 노출 리포트").
// 캠페인 하나를 골라 집계가 끝난 날의 리포트를 보여준다. 고른 캠페인은 주소의 campaignId로 둔다
export const StoreAnalytics = ({ onBack }: StoreAnalyticsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    campaignsState,
    loadReport,
    reportState,
    retryCampaigns,
    retryReport,
    selectedCampaign,
  } = useStoreAnalytics(searchParams.get(CAMPAIGN_ID_PARAM));
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const menus = campaignsState.status === 'success' ? campaignsState.menus : [];
  const getTitle = (campaign: Campaign) =>
    getCampaignTitle(campaign.coupon, menus);

  // 캠페인을 바꿔도 뒤로 가기는 분석 페이지 이전 화면으로 가도록 주소를 바꿔 쓴다
  const selectCampaign = (campaignId: string) => {
    setIsSelectOpen(false);
    setSearchParams({ [CAMPAIGN_ID_PARAM]: campaignId }, { replace: true });
  };

  const renderReport = (campaign: Campaign) => {
    if (!reportState) {
      return <AnalyticsSkeleton label="리포트를 불러오는 중" />;
    }

    if (reportState.status === 'error') {
      return (
        <AnalyticsMessage
          action={
            <Button onClick={retryReport} variant="secondary">
              다시 시도
            </Button>
          }
          description="잠시 후 다시 시도해 주세요"
          title="리포트를 불러오지 못했어요"
        />
      );
    }

    const { report } = reportState;

    return (
      <>
        <p className="px-1 text-caption-mobile text-text-secondary">
          {formatReportPeriod(campaign, report)}
        </p>
        {/* 집계되지 않은 날을 실적 0으로 보지 않으므로 0으로 채운 요약과 차트를 보여주지 않는다 */}
        {report.length > 0 ? (
          <>
            <AnalyticsSummary report={report} />
            <AnalyticsTrend campaign={campaign} report={report} />
          </>
        ) : (
          <AnalyticsMessage
            description="수치는 하루 한 번 집계돼 집행 다음 날부터 볼 수 있어요"
            title="아직 집계된 날이 없어요"
          />
        )}
      </>
    );
  };

  const renderContent = () => {
    if (campaignsState.status === 'loading') {
      return <AnalyticsSkeleton label="분석을 불러오는 중" />;
    }

    if (campaignsState.status === 'error') {
      return (
        <AnalyticsMessage
          action={
            <Button onClick={retryCampaigns} variant="secondary">
              다시 시도
            </Button>
          }
          description="잠시 후 다시 시도해 주세요"
          title="분석을 불러오지 못했어요"
        />
      );
    }

    if (!selectedCampaign) {
      return (
        <AnalyticsMessage
          action={
            <Link
              className="flex h-10 items-center rounded-full border border-action-primary px-4 text-body-sm-mobile font-bold text-text-brand transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              to={CAMPAIGNS_PATH}
            >
              캠페인 보기
            </Link>
          }
          description="캠페인을 집행하면 다음 날부터 노출과 방문을 볼 수 있어요"
          title="아직 집행한 캠페인이 없어요"
        />
      );
    }

    return (
      <>
        <CampaignSelectButton
          campaign={selectedCampaign}
          onClick={() => setIsSelectOpen(true)}
          title={getTitle(selectedCampaign)}
        />
        {renderReport(selectedCampaign)}
        {/* 비교할 다른 캠페인이 있을 때만 보여준다 */}
        {getComparisonCampaigns(campaignsState.campaigns).some(
          ({ id }) => id !== selectedCampaign.id,
        ) && (
          <AnalyticsComparison
            campaigns={campaignsState.campaigns}
            getTitle={getTitle}
            loadReport={loadReport}
            selectedId={selectedCampaign.id}
          />
        )}
        <AnalyticsNotices />
        {isSelectOpen && (
          <CampaignSelectSheet
            campaigns={campaignsState.campaigns}
            getTitle={getTitle}
            onClose={() => setIsSelectOpen(false)}
            onSelect={selectCampaign}
            selectedId={selectedCampaign.id}
          />
        )}
      </>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={onBack} title="분석" />
      </div>
      <main className="flex flex-1 flex-col gap-4 px-page py-5">
        {renderContent()}
      </main>
    </>
  );
};
