import type { CampaignDayReport } from '@owner/api/report';
import { formatNumber, formatPoints } from '@owner/ui/campaignFormat';

import { summarizeReport } from './reportSummary';

interface SummaryRowProps {
  label: string;
  value: string;
  description?: string;
}

const SummaryRow = ({ description, label, value }: SummaryRowProps) => (
  <div className="flex items-start justify-between gap-3 py-2.5">
    <dt className="text-body-sm-mobile text-text-secondary">
      {label}
      {description && (
        <span className="mt-0.5 block text-caption-mobile text-text-tertiary">
          {description}
        </span>
      )}
    </dt>
    <dd className="shrink-0 text-body-sm-mobile font-bold text-text-primary">
      {value}
    </dd>
  </div>
);

export interface AnalyticsSummaryProps {
  report: CampaignDayReport[];
}

// 고른 캠페인의 집계된 날을 모두 더한 실적
export const AnalyticsSummary = ({ report }: AnalyticsSummaryProps) => {
  const summary = summarizeReport(report);

  return (
    <section
      aria-labelledby="analytics-summary-title"
      className="rounded-xl border border-border-subtle bg-bg-surface p-4"
    >
      <h2
        className="text-body-sm-mobile text-text-secondary"
        id="analytics-summary-title"
      >
        방문 (쿠폰 사용)
      </h2>
      <p className="mt-1 text-display-mobile font-bold text-text-primary">
        {formatNumber(summary.redeemCount)}
        <span className="ml-1 text-body-mobile font-medium">건</span>
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-surface-brand p-3">
          <dt className="text-caption-mobile text-text-brand">소진 포인트</dt>
          <dd className="mt-1 text-h3-mobile font-bold text-text-primary">
            {formatPoints(summary.spentPoints)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="text-caption-mobile text-text-secondary">유효 노출</dt>
          <dd className="mt-1 text-h3-mobile font-bold text-text-primary">
            {formatNumber(summary.validImpressionCount)}회
          </dd>
        </div>
      </dl>

      <dl className="mt-3 divide-y divide-border-subtle border-t border-border-subtle">
        <SummaryRow label="찜" value={`${formatNumber(summary.wishCount)}건`} />
        <SummaryRow
          label="쿠폰 발급"
          value={`${formatNumber(summary.issuedCount)}장`}
        />
        <SummaryRow
          description="소진 포인트 ÷ 방문"
          label="방문당 비용"
          value={
            summary.costPerRedeem === null
              ? '-'
              : formatPoints(summary.costPerRedeem)
          }
        />
        <SummaryRow
          description="포인트가 차감되지 않은 노출이에요"
          label="무효 노출"
          value={`${formatNumber(summary.invalidImpressionCount)}회`}
        />
      </dl>
    </section>
  );
};
