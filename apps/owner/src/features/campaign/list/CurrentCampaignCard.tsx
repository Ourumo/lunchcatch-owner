import { Link } from 'react-router';
import { CircleAlert } from 'lucide-react';

import type { Campaign, PausedReason } from '@owner/api/campaign';
import { CampaignStatusBadge } from '@owner/components/CampaignStatusBadge/CampaignStatusBadge';
import {
  formatNumber,
  formatPeriod,
  formatPoints,
  getDaysFromToday,
} from '@owner/features/campaign/campaignFormat';

export interface CurrentCampaignCardProps {
  campaign: Campaign;
  title: string;
}

const pausedNotices: Record<PausedReason, string> = {
  OWNER: '직접 중단한 캠페인이에요. 상세 화면에서 다시 시작할 수 있어요.',
  NO_POINTS:
    '포인트 잔액이 부족해 노출이 멈췄어요. 충전하면 자동으로 다시 시작돼요.',
  ADMIN: '운영 정책에 따라 관리자가 노출을 중단했어요.',
};

const getRemainingLabel = (endDate: string) => {
  const days = getDaysFromToday(endDate);

  return days > 0 ? `${days}일 남음` : '오늘 종료';
};

// 지금 집행 중인(ACTIVE, PAUSED) 캠페인. 가게당 1건이라 오늘 실적까지 크게 보여준다
export const CurrentCampaignCard = ({
  campaign,
  title,
}: CurrentCampaignCardProps) => {
  const { budget, coupon, pausedReason, performance, status } = campaign;
  const today = performance?.today;
  const issueLimit = coupon.issueLimit ?? 0;
  const issuedRate =
    today && issueLimit > 0
      ? Math.min(100, Math.round((today.issuedCount / issueLimit) * 100))
      : 0;

  return (
    <Link
      className="block rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      to={`/campaigns/${campaign.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <CampaignStatusBadge pausedReason={pausedReason} status={status} />
        <span className="text-caption-mobile text-text-secondary">
          {getRemainingLabel(budget.endDate)}
        </span>
      </div>
      <h3 className="mt-2 text-h3-mobile font-bold text-text-primary">
        {title}
      </h3>
      <p className="mt-1 text-caption-mobile text-text-secondary">
        {formatPeriod(budget.startDate, budget.endDate)} · 매일{' '}
        {coupon.usableFrom}~{coupon.usableUntil} 사용
      </p>

      {status === 'PAUSED' && pausedReason && (
        <p className="mt-3 flex gap-1.5 rounded-lg bg-surface-subtle px-3 py-2.5 text-caption-mobile break-keep text-text-primary">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-text-secondary"
          />
          {pausedNotices[pausedReason]}
        </p>
      )}

      {today && (
        <div className="mt-4 border-t border-border-subtle pt-4">
          <div className="flex items-baseline justify-between text-body-sm-mobile">
            <span className="text-text-secondary">오늘 발급</span>
            <span className="text-text-primary">
              <strong className="font-bold">
                {formatNumber(today.issuedCount)}
              </strong>{' '}
              / {formatNumber(issueLimit)}장
            </span>
          </div>
          {/* 수치는 위 문구로 전달하므로 막대는 보조 표시로만 둔다 */}
          <div
            aria-hidden="true"
            className="mt-2 h-2 overflow-hidden rounded-full bg-surface-brand"
          >
            <div
              className="h-full rounded-full bg-action-primary"
              style={{ width: `${issuedRate}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-caption-mobile text-text-secondary">
                오늘 사용
              </dt>
              <dd className="mt-0.5 text-body-mobile font-bold text-text-primary">
                {formatNumber(today.redeemedCount)}장
              </dd>
            </div>
            <div>
              <dt className="text-caption-mobile text-text-secondary">
                오늘 남은 예산
              </dt>
              <dd className="mt-0.5 text-body-mobile font-bold text-text-brand">
                {formatPoints(today.reservedPoints - today.spentPoints)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Link>
  );
};
