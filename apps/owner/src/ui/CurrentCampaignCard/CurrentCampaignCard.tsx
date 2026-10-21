import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CircleAlert } from 'lucide-react';

import type { Campaign, CampaignTodayPerformance } from '@owner/api/campaign';
import {
  formatCreatedDate,
  formatNumber,
  formatPeriod,
  formatPoints,
  formatShortDate,
  getDaysFromToday,
  pausedNotices,
} from '@owner/ui/campaignFormat';
import { CampaignStatusBadge } from '@owner/ui/CampaignStatusBadge/CampaignStatusBadge';
import { PerformanceError } from '@owner/ui/PerformanceError/PerformanceError';

// 오늘 실적을 불러온 상태. 오늘이 집행 대상이 아니면 data가 null이다
export type TodayPerformanceState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'success'; data: CampaignTodayPerformance | null };

export interface CurrentCampaignCardProps {
  campaign: Campaign;
  title: string;
  // 카드를 쓰는 화면이 성과를 캠페인과 따로 불러와 넘긴다. 넘기지 않으면 오늘 실적을 보여주지 않는다
  todayPerformance?: TodayPerformanceState;
  // 카드 아래에 붙이는 버튼 영역 (대기 중 취소 등). 링크 안에는 버튼을 둘 수 없어 따로 받는다
  footer?: ReactNode;
}

// 전체 발급 수량 대비 비율(%). 데이터가 전체를 넘어도 막대가 카드 밖으로 넘치지 않게 100에서 자른다
const toRate = (count: number, total: number) =>
  total > 0 ? Math.min(100, Math.max(0, (count / total) * 100)) : 0;

// 배지 옆 일정. 집행 중이면 남은 일수, 대기 중이면 시작일, 작성 중이면 만든 날
const getScheduleLabel = ({ budget, createdAt, status }: Campaign) => {
  if (status === 'DRAFT') {
    return `${formatCreatedDate(createdAt)} 등록`;
  }

  if (status === 'SCHEDULED') {
    const days = getDaysFromToday(budget.startDate);

    return days > 0
      ? `${formatShortDate(budget.startDate)} 시작 · ${days}일 뒤`
      : `${formatShortDate(budget.startDate)} 시작`;
  }

  const days = getDaysFromToday(budget.endDate);

  return days > 0 ? `${days}일 남음` : '오늘 종료';
};

// 끝나지 않은 캠페인(작성 중, 대기 중, 진행 중, 일시중지). 가게당 1건이라 오늘 실적까지 크게 보여준다.
// 홈과 캠페인 목록에서 함께 쓴다
export const CurrentCampaignCard = ({
  campaign,
  footer,
  title,
  todayPerformance,
}: CurrentCampaignCardProps) => {
  const { budget, coupon, pausedReason, status } = campaign;
  const today =
    todayPerformance?.status === 'success' ? todayPerformance.data : null;
  // 진행 중·일시중지만 오늘 실적이 있을 수 있어, 불러오는 동안 그 자리를 잡아 둔다
  const isTodayLoading =
    todayPerformance?.status === 'loading' &&
    (status === 'ACTIVE' || status === 'PAUSED');
  const issueLimit = coupon.issueLimit ?? 0;
  const issuedCount = today?.issuedCount ?? 0;
  // 사용은 발급된 쿠폰 중에서만 나오므로 발급 막대를 넘지 않게 한다
  const redeemedCount = Math.min(today?.redeemedCount ?? 0, issuedCount);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface transition-colors has-[>a:hover]:border-brand-300">
      <Link
        className="block p-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
        to={`/campaigns/${campaign.id}`}
      >
        <div className="flex items-center justify-between gap-2">
          <CampaignStatusBadge pausedReason={pausedReason} status={status} />
          <span className="text-caption-mobile text-text-secondary">
            {getScheduleLabel(campaign)}
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

        {isTodayLoading && (
          <div
            aria-busy="true"
            className="mt-4 h-36 animate-pulse rounded-lg bg-surface-subtle motion-reduce:animate-none"
          >
            <span className="sr-only">오늘 실적을 불러오는 중</span>
          </div>
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
      {/* 다시 시도 버튼은 링크 안에 둘 수 없어 링크 아래에 둔다 */}
      {todayPerformance?.status === 'error' && (
        <PerformanceError
          className="mx-4 mb-4"
          onRetry={todayPerformance.retry}
        />
      )}
      {footer}
    </div>
  );
};
