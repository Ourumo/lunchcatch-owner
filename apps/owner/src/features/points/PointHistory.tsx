import { useState } from 'react';
import { Button, SegmentedControl, SelectField } from '@repo/ui';

import {
  type PointHistoryFilter,
  type PointHistoryPeriod,
} from '@owner/api/points';
import { useChargePolicy } from '@owner/hooks/useChargePolicy';
import { usePointCharge } from '@owner/hooks/usePointCharge';
import { formatPoints } from '@owner/ui/campaignFormat';
import {
  formatHistoryDate,
  formatHistoryTime,
  historyPeriodItems,
} from '@owner/ui/historyFormat';
import { LoadMoreFooter } from '@owner/ui/LoadMoreFooter/LoadMoreFooter';
import { PointChargeSheet } from '@owner/ui/PointChargeSheet/PointChargeSheet';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';
import { StatusMessage } from '@owner/ui/StatusMessage/StatusMessage';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import {
  formatServingSummary,
  formatSignedPoints,
  groupPointHistory,
  type PointHistoryItem,
  pointHistoryTypeLabels,
} from './pointHistoryFormat';
import { usePointHistory } from './usePointHistory';

// 처음에는 최근 30일 전체 내역을 보여준다
const DEFAULT_FILTER: PointHistoryFilter = { period: '30D', campaignId: null };

interface BalanceSummaryProps {
  state: ReturnType<typeof usePointHistory>['balanceState'];
  onCharge: () => void;
  onRetry: () => void;
}

// 잔액과 예약 중 포인트. 원장 조회에 실패하면 이전에 받은 잔액으로 대신 보여주지 않고 실패 안내를 보여준다
const BalanceSummary = ({ onCharge, onRetry, state }: BalanceSummaryProps) => {
  const renderBalance = () => {
    if (state.status === 'loading') {
      return (
        <div aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">잔액을 불러오는 중</span>
          <SkeletonBlock className="h-4 w-10" />
          <SkeletonBlock className="h-8 w-32" />
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-body-mobile font-bold text-text-primary">
            잔액을 불러오지 못했어요
          </p>
          <Button onClick={onRetry} variant="secondary">
            다시 시도
          </Button>
        </div>
      );
    }

    return (
      <div>
        <p className="text-caption-mobile text-text-secondary">잔액</p>
        <p className="mt-0.5 text-h2-mobile font-bold text-text-primary">
          {formatPoints(state.balance.balance)}
        </p>
      </div>
    );
  };

  return (
    <section
      aria-label="포인트 잔액"
      className="rounded-xl border border-border-subtle bg-bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        {renderBalance()}
        <button
          className="flex h-9 shrink-0 items-center rounded-full border border-action-primary px-4 text-body-sm-mobile font-bold text-text-brand transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          onClick={onCharge}
          type="button"
        >
          충전
        </button>
      </div>
      {state.status === 'success' && (
        <div className="mt-4 border-t border-border-subtle pt-3">
          <div className="flex items-center justify-between gap-3 text-body-sm-mobile">
            <span className="text-text-secondary">예약 중 포인트</span>
            <span className="shrink-0 font-bold text-text-primary">
              {formatPoints(state.balance.reservedPoints)}
            </span>
          </div>
          <p className="mt-1 text-caption-mobile break-keep text-text-tertiary">
            오늘 캠페인에 예약했지만 아직 쓰지 않은 포인트로, 잔액과 따로
            보여줘요
          </p>
        </div>
      )}
    </section>
  );
};

interface HistoryRowProps {
  item: PointHistoryItem;
  campaignTitles: Record<string, string>;
}

// 내역 한 줄. 왼쪽에 유형과 설명, 오른쪽에 금액을 둔다.
// 설명은 캠페인 이름이고, 캠페인이 없는 충전·환불은 시각이다
const HistoryRow = ({ campaignTitles, item }: HistoryRowProps) => {
  const campaignTitle = item.campaignId
    ? (campaignTitles[item.campaignId] ?? '캠페인')
    : null;
  const description = campaignTitle ?? formatHistoryTime(item.occurredAt);
  const servingSummary = item.serving && formatServingSummary(item.serving);

  return (
    <li className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-body-mobile font-bold text-text-primary">
          {pointHistoryTypeLabels[item.type]}
        </span>
        <span className="shrink-0 text-body-mobile font-bold text-text-primary">
          {formatSignedPoints(item.amount)}
        </span>
      </div>
      <p className="truncate text-body-sm-mobile text-text-secondary">
        {description}
      </p>
      {servingSummary && (
        <p className="text-caption-mobile break-keep text-text-tertiary">
          {servingSummary}
        </p>
      )}
    </li>
  );
};

const HistorySkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-3">
    <span className="sr-only">포인트 내역을 불러오는 중</span>
    {[0, 1].map((index) => (
      <SkeletonBlock className="h-40" key={index} />
    ))}
  </div>
);

interface PointHistoryProps {
  onBack: () => void;
}

// 포인트 내역 (docs/requirements-owner.md "잔액 및 내역 조회").
// 소진은 캠페인별·일별 합계 한 줄로 보여주고, 그날의 예약과 예약 해제는 그 줄 아래 보조 줄로 보여준다
export const PointHistory = ({ onBack }: PointHistoryProps) => {
  const chargePolicy = useChargePolicy();
  const startCharge = usePointCharge();
  const {
    balanceState,
    campaignOptions,
    campaignTitles,
    changeFilter,
    filter,
    historyState,
    loadMoreHistory,
    retryBalance,
    retryHistory,
  } = usePointHistory(DEFAULT_FILTER);
  const [isChargeOpen, setIsChargeOpen] = useState(false);

  const renderHistory = () => {
    if (historyState.status === 'loading') {
      return <HistorySkeleton />;
    }

    if (historyState.status === 'error') {
      return (
        <StatusMessage
          description="잠시 후 다시 시도해 주세요"
          onRetry={retryHistory}
          title="포인트 내역을 불러오지 못했어요"
        />
      );
    }

    const days = groupPointHistory(
      historyState.entries,
      historyState.todaySpent,
    );

    if (days.length === 0) {
      return (
        <StatusMessage
          description={
            filter.campaignId
              ? '다른 기간이나 캠페인을 골라 보세요'
              : '충전하거나 캠페인을 집행하면 여기에 내역이 쌓여요'
          }
          title="이 기간에 포인트 내역이 없어요"
        />
      );
    }

    return (
      <div className="flex flex-col gap-5">
        {days.map(({ date, items }) => (
          <section className="flex flex-col gap-2" key={date}>
            <h3 className="px-1 text-body-sm-mobile font-bold text-text-secondary">
              {formatHistoryDate(date)}
            </h3>
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
              {items.map((item) => (
                <HistoryRow
                  campaignTitles={campaignTitles}
                  item={item}
                  key={item.key}
                />
              ))}
            </ul>
          </section>
        ))}
        <LoadMoreFooter
          hasMore={historyState.nextCursor !== null}
          loadingLabel="포인트 내역을 더 불러오는 중"
          onLoadMore={loadMoreHistory}
          status={historyState.loadMore}
        />
      </div>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={onBack} title="포인트 내역" />
      </div>
      <main className="flex flex-1 flex-col gap-6 px-page py-5">
        <BalanceSummary
          onCharge={() => setIsChargeOpen(true)}
          onRetry={retryBalance}
          state={balanceState}
        />
        <section
          aria-labelledby="point-history-title"
          className="flex flex-col gap-3"
        >
          <h2
            className="text-body-mobile font-bold text-text-primary"
            id="point-history-title"
          >
            내역
          </h2>
          <div className="flex flex-col gap-2">
            <SegmentedControl<PointHistoryPeriod>
              ariaLabel="조회 기간"
              items={historyPeriodItems}
              onValueChange={(period) => changeFilter({ period })}
              value={filter.period}
            />
            {/* SelectField는 문자열 값만 받으므로 전체는 빈 문자열로 넘긴다 */}
            <SelectField
              aria-label="캠페인"
              onValueChange={(value) =>
                changeFilter({ campaignId: value || null })
              }
              options={[
                { value: '', label: '전체 캠페인' },
                ...campaignOptions.map(({ id, label }) => ({
                  value: id,
                  label,
                })),
              ]}
              value={filter.campaignId ?? ''}
            />
          </div>
          {renderHistory()}
        </section>
      </main>
      {isChargeOpen && (
        <PointChargeSheet
          balance={
            balanceState.status === 'success'
              ? balanceState.balance.balance
              : undefined
          }
          policy={chargePolicy}
          onCharge={startCharge}
          onClose={() => setIsChargeOpen(false)}
        />
      )}
    </>
  );
};
