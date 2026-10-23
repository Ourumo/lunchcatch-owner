import { SegmentedControl } from '@repo/ui';

import type { CouponUsage } from '@owner/api/couponUsage';
import type { PointHistoryPeriod } from '@owner/api/points';
import { formatNumber } from '@owner/ui/campaignFormat';
import {
  formatHistoryDate,
  formatHistoryTime,
  historyPeriodItems,
  toKstDateKey,
} from '@owner/ui/historyFormat';
import { LoadMoreFooter } from '@owner/ui/LoadMoreFooter/LoadMoreFooter';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';
import { StatusMessage } from '@owner/ui/StatusMessage/StatusMessage';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { useCouponUsageHistory } from './useCouponUsageHistory';

// 처음에는 최근 30일을 보여준다
const DEFAULT_PERIOD: PointHistoryPeriod = '30D';

interface CouponUsageDay {
  // YYYY-MM-DD
  date: string;
  usages: CouponUsage[];
}

// 최신순으로 온 이력을 한국 날짜별로 묶는다. 순서는 그대로 둔다
const groupByDate = (usages: CouponUsage[]) =>
  usages.reduce<CouponUsageDay[]>((days, usage) => {
    const date = toKstDateKey(new Date(usage.usedAt));
    const lastDay = days.at(-1);

    if (lastDay?.date === date) {
      lastDay.usages.push(usage);
    } else {
      days.push({ date, usages: [usage] });
    }

    return days;
  }, []);

const UsageRow = ({ usage }: { usage: CouponUsage }) => (
  <li className="flex items-center justify-between gap-3 px-4 py-3">
    <span className="text-body-mobile text-text-secondary">
      {formatHistoryTime(usage.usedAt)}
    </span>
    <span className="shrink-0 text-body-mobile font-bold text-text-primary">
      {formatNumber(usage.discountAmount)}원 할인
    </span>
  </li>
);

const UsageSkeleton = () => (
  <SkeletonBlock className="h-48" label="쿠폰 사용 이력을 불러오는 중" />
);

interface CouponUsageHistoryProps {
  onBack: () => void;
}

// 가게 관리 > 쿠폰 사용 이력 (docs/requirements-owner.md "발급/사용 이력 조회").
// API가 매장 단위의 확정된 사용 이력만 주어, 사용 시각과 할인액을 날짜별로 묶어 보여준다.
// 목록 끝에 가까워지면 다음 구간을 이어 붙이고, 같은 날이 두 구간에 걸치면 이어 붙인 목록으로 다시 묶는다
export const CouponUsageHistory = ({ onBack }: CouponUsageHistoryProps) => {
  const { changePeriod, loadMore, period, retry, state } =
    useCouponUsageHistory(DEFAULT_PERIOD);

  const renderContent = () => {
    if (state.status === 'loading') {
      return <UsageSkeleton />;
    }

    if (state.status === 'error') {
      // 권한이 없으면 다시 시도해도 같아 버튼을 두지 않는다
      return state.isForbidden ? (
        <StatusMessage
          description="이 계정으로는 가게의 쿠폰 사용 이력을 볼 수 없어요"
          title="쿠폰 사용 이력을 조회할 수 없어요"
        />
      ) : (
        <StatusMessage
          description="잠시 후 다시 시도해 주세요"
          onRetry={retry}
          title="쿠폰 사용 이력을 불러오지 못했어요"
        />
      );
    }

    if (state.usages.length === 0) {
      return (
        <StatusMessage
          description="손님이 쿠폰을 쓰면 여기에 사용 이력이 쌓여요"
          title="이 기간에 사용된 쿠폰이 없어요"
        />
      );
    }

    return (
      <div className="flex flex-col gap-5">
        {groupByDate(state.usages).map(({ date, usages }) => (
          <section className="flex flex-col gap-2" key={date}>
            <h2 className="px-1 text-body-sm-mobile font-bold text-text-secondary">
              {formatHistoryDate(date)}
            </h2>
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
              {usages.map((usage) => (
                <UsageRow key={usage.id} usage={usage} />
              ))}
            </ul>
          </section>
        ))}
        <LoadMoreFooter
          hasMore={state.nextCursor !== null}
          loadingLabel="쿠폰 사용 이력을 더 불러오는 중"
          onLoadMore={loadMore}
          status={state.loadMore}
        />
      </div>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={onBack} title="쿠폰 사용 이력" />
      </div>
      <main className="flex flex-1 flex-col gap-4 px-page py-5">
        <SegmentedControl<PointHistoryPeriod>
          ariaLabel="조회 기간"
          items={historyPeriodItems}
          onValueChange={changePeriod}
          value={period}
        />
        {renderContent()}
      </main>
    </>
  );
};
