import { Link } from 'react-router';
import { CircleAlert } from 'lucide-react';

import type { Campaign } from '@owner/api/campaign';
import {
  formatNumber,
  formatPeriod,
  formatPoints,
  getDaysFromToday,
  pausedNotices,
} from '@owner/components/campaignFormat';
import { CampaignStatusBadge } from '@owner/components/CampaignStatusBadge/CampaignStatusBadge';

export interface CurrentCampaignCardProps {
  campaign: Campaign;
  title: string;
}

// 전체 발급 수량 대비 비율(%). 데이터가 전체를 넘어도 막대가 카드 밖으로 넘치지 않게 100에서 자른다
const toRate = (count: number, total: number) =>
  total > 0 ? Math.min(100, Math.max(0, (count / total) * 100)) : 0;

const getRemainingLabel = (endDate: string) => {
  const days = getDaysFromToday(endDate);

  return days > 0 ? `${days}일 남음` : '오늘 종료';
};

// 지금 집행 중인(ACTIVE, PAUSED) 캠페인. 가게당 1건이라 오늘 실적까지 크게 보여준다. 홈과 캠페인 목록에서 함께 쓴다
export const CurrentCampaignCard = ({
  campaign,
  title,
}: CurrentCampaignCardProps) => {
  const { budget, coupon, pausedReason, performance, status } = campaign;
  const today = performance?.today;
  const issueLimit = coupon.issueLimit ?? 0;
  const issuedCount = today?.issuedCount ?? 0;
  // 사용은 발급된 쿠폰 중에서만 나오므로 발급 막대를 넘지 않게 한다
  const redeemedCount = Math.min(today?.redeemedCount ?? 0, issuedCount);

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
            <span className="text-text-secondary">오늘 쿠폰</span>
            <span className="text-text-secondary">
              전체{' '}
              <strong className="font-bold text-text-primary">
                {formatNumber(issueLimit)}
              </strong>
              장
            </span>
          </div>
          {/* 수치는 범례와 아래 칸으로 전달하므로 막대는 보조 표시로만 둔다.
              바탕(전체) 위에 발급, 그 위에 사용을 겹치고 길이는 모두 전체 발급 수량 기준이다 */}
          <div
            aria-hidden="true"
            className="relative mt-2 h-2 overflow-hidden rounded-full bg-surface-subtle"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-brand-300"
              style={{ width: `${toRate(issuedCount, issueLimit)}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-action-primary"
              style={{ width: `${toRate(redeemedCount, issueLimit)}%` }}
            />
          </div>
          {/* 글자는 기본 글자색으로 두고, 앞의 점이 어느 막대인지 알려준다 */}
          <ul className="mt-2 flex gap-4 text-caption-mobile text-text-secondary">
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-action-primary"
              />
              사용
              <strong className="font-bold text-text-primary">
                {formatNumber(today.redeemedCount)}장
              </strong>
            </li>
            <li className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-brand-300"
              />
              발급
              <strong className="font-bold text-text-primary">
                {formatNumber(today.issuedCount)}장
              </strong>
            </li>
          </ul>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-caption-mobile text-text-secondary">
                남은 쿠폰
              </dt>
              <dd className="mt-0.5 text-body-mobile font-bold text-text-primary">
                {formatNumber(Math.max(0, issueLimit - today.issuedCount))}장
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
