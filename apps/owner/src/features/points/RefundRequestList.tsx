import { Button, StatusBadge, type StatusBadgeVariant } from '@repo/ui';

import type { RefundRequestItem, RefundRequestStatus } from '@owner/api/refund';
import { formatNumber, formatPoints } from '@owner/ui/campaignFormat';
import { formatHistoryDateTime } from '@owner/ui/historyFormat';
import { LoadMoreTrigger } from '@owner/ui/LoadMoreTrigger/LoadMoreTrigger';

import type { LoadMoreStatus } from './usePointHistory';
import type { RefundRequestsState } from './useRefundRequests';

const skeletonClassName =
  'animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none';

const statusBadges: Record<
  RefundRequestStatus,
  { label: string; variant: StatusBadgeVariant }
> = {
  REQUESTED: { label: '대기', variant: 'warning' },
  APPROVED: { label: '승인', variant: 'info' },
  REJECTED: { label: '거절', variant: 'danger' },
  COMPLETED: { label: '완료', variant: 'success' },
};

const RefundRequestRow = ({ item }: { item: RefundRequestItem }) => {
  const { label, variant } = statusBadges[item.status];

  return (
    <li className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-mobile font-bold text-text-primary">
          {formatPoints(item.amount)}
        </span>
        <StatusBadge variant={variant}>{label}</StatusBadge>
      </div>
      <p className="text-body-sm-mobile text-text-secondary">
        {formatHistoryDateTime(item.requestedAt)} 요청 · 수수료{' '}
        {formatNumber(item.fee)}원
      </p>
      {item.processedAt && (
        <p className="text-caption-mobile text-text-tertiary">
          {formatHistoryDateTime(item.processedAt)} {label}
        </p>
      )}
      {item.status === 'REJECTED' && item.rejectReason && (
        <p className="text-caption-mobile break-keep text-status-danger-fg">
          거절 사유: {item.rejectReason}
        </p>
      )}
    </li>
  );
};

interface ListFooterProps {
  hasMore: boolean;
  loadMore: LoadMoreStatus;
  onLoadMore: () => void;
}

// 목록 아래: 이어서 불러오는 중, 이어서 불러오기 실패. 끝까지 불러왔으면 아무것도 두지 않는다
const ListFooter = ({ hasMore, loadMore, onLoadMore }: ListFooterProps) => {
  if (loadMore === 'loading') {
    return (
      <div className="flex justify-center py-4" role="status">
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-text-tertiary border-r-transparent motion-reduce:animate-none"
        />
        <span className="sr-only">환불 요청 내역을 더 불러오는 중</span>
      </div>
    );
  }

  if (loadMore === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <p className="text-body-sm-mobile text-text-secondary" role="alert">
          불러오지 못했어요
        </p>
        <Button onClick={onLoadMore} variant="secondary">
          다시 시도
        </Button>
      </div>
    );
  }

  return hasMore ? <LoadMoreTrigger onLoadMore={onLoadMore} /> : null;
};

const ListMessage = ({
  description,
  onRetry,
  title,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center gap-2 py-8 text-center">
    <p className="text-body-sm-mobile font-bold text-text-primary">{title}</p>
    {description && (
      <p className="text-caption-mobile break-keep text-text-secondary">
        {description}
      </p>
    )}
    {onRetry && (
      <Button className="mt-1" onClick={onRetry} variant="secondary">
        다시 시도
      </Button>
    )}
  </div>
);

interface RefundRequestListProps {
  state: RefundRequestsState;
  onRetry: () => void;
  onLoadMore: () => void;
}

// 내 환불 요청 내역. 요청 시각, 금액, 수수료, 상태와 처리 시각을 보여주고, 거절이면 거절 사유를 함께 보여준다.
// 목록 끝에 가까워지면 다음 구간을 이어 붙인다
export const RefundRequestList = ({
  onLoadMore,
  onRetry,
  state,
}: RefundRequestListProps) => {
  const renderContent = () => {
    if (state.status === 'loading') {
      return (
        <div aria-busy="true">
          <span className="sr-only">환불 요청 내역을 불러오는 중</span>
          <div aria-hidden="true" className={`h-32 ${skeletonClassName}`} />
        </div>
      );
    }

    if (state.status === 'error') {
      return (
        <ListMessage
          description="잠시 후 다시 시도해 주세요"
          onRetry={onRetry}
          title="요청 내역을 불러오지 못했어요"
        />
      );
    }

    if (state.items.length === 0) {
      return <ListMessage title="환불 요청 내역이 없어요" />;
    }

    return (
      <>
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          {state.items.map((item) => (
            <RefundRequestRow item={item} key={item.id} />
          ))}
        </ul>
        <ListFooter
          hasMore={state.nextCursor !== null}
          loadMore={state.loadMore}
          onLoadMore={onLoadMore}
        />
      </>
    );
  };

  return (
    <section
      aria-labelledby="refund-requests-title"
      className="mt-5 flex flex-col gap-3"
    >
      <h2
        className="text-body-mobile font-bold text-text-primary"
        id="refund-requests-title"
      >
        요청 내역
      </h2>
      {renderContent()}
    </section>
  );
};
