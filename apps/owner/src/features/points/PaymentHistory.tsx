import { Button, StatusBadge, type StatusBadgeVariant } from '@repo/ui';
import { Info } from 'lucide-react';

import type {
  PaymentDisplayStatus,
  PaymentHistoryItem,
} from '@owner/api/payments';
import { formatNumber } from '@owner/ui/campaignFormat';
import { LoadMoreTrigger } from '@owner/ui/LoadMoreTrigger/LoadMoreTrigger';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { formatHistoryDateTime } from './pointHistoryFormat';
import { usePaymentHistory } from './usePaymentHistory';
import type { LoadMoreStatus } from './usePointHistory';

const skeletonClassName =
  'animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none';

const statusBadges: Record<
  PaymentDisplayStatus,
  { label: string; variant: StatusBadgeVariant }
> = {
  IN_PROGRESS: { label: '결제 중', variant: 'info' },
  CONFIRMING: { label: '확인 중', variant: 'warning' },
  COMPLETED: { label: '충전 완료', variant: 'success' },
  FAILED: { label: '실패', variant: 'danger' },
  CANCELLED: { label: '취소', variant: 'neutral' },
};

// 상태에 따라 요청 시각 아래에 덧붙이는 줄. 충전 완료는 승인 시각, 취소는 취소 시각, 실패는 실패 사유
const getStatusDetail = ({
  approvedAt,
  canceledAt,
  displayStatus,
  failureReason,
}: PaymentHistoryItem) => {
  if (displayStatus === 'COMPLETED' && approvedAt) {
    return `${formatHistoryDateTime(approvedAt)} 승인`;
  }

  if (displayStatus === 'CANCELLED' && canceledAt) {
    return `${formatHistoryDateTime(canceledAt)} 취소`;
  }

  if (displayStatus === 'FAILED') {
    return failureReason ?? '결제하지 못했어요';
  }

  return null;
};

const PaymentRow = ({ item }: { item: PaymentHistoryItem }) => {
  const { label, variant } = statusBadges[item.displayStatus];
  const detail = getStatusDetail(item);

  return (
    <li className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-mobile font-bold text-text-primary">
          {formatNumber(item.amount)}원
        </span>
        <StatusBadge variant={variant}>{label}</StatusBadge>
      </div>
      <p className="text-body-sm-mobile text-text-secondary">
        {formatHistoryDateTime(item.requestedAt)} 요청
      </p>
      {detail && (
        <p className="text-caption-mobile break-keep text-text-tertiary">
          {detail}
        </p>
      )}
    </li>
  );
};

interface PaymentHistoryFooterProps {
  hasMore: boolean;
  loadMore: LoadMoreStatus;
  onLoadMore: () => void;
}

// 목록 아래: 이어서 불러오는 중, 이어서 불러오기 실패. 끝까지 불러왔으면 아무것도 두지 않는다
const PaymentHistoryFooter = ({
  hasMore,
  loadMore,
  onLoadMore,
}: PaymentHistoryFooterProps) => {
  if (loadMore === 'loading') {
    return (
      <div className="flex justify-center py-4" role="status">
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-text-tertiary border-r-transparent motion-reduce:animate-none"
        />
        <span className="sr-only">결제 내역을 더 불러오는 중</span>
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

const PaymentHistorySkeleton = () => (
  <div aria-busy="true">
    <span className="sr-only">결제 내역을 불러오는 중</span>
    <div aria-hidden="true" className={`h-60 ${skeletonClassName}`} />
  </div>
);

const PaymentHistoryMessage = ({
  description,
  onRetry,
  title,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center gap-3 px-page py-12 text-center">
    <p className="text-body-mobile font-bold text-text-primary">{title}</p>
    <p className="text-body-sm-mobile break-keep text-text-secondary">
      {description}
    </p>
    {onRetry && (
      <Button className="mt-2" onClick={onRetry} variant="secondary">
        다시 시도
      </Button>
    )}
  </div>
);

// 확인 중인 결제가 있으면 서버가 새 충전 주문을 받지 않는다
const ConfirmingNotice = () => (
  <p className="flex gap-2 rounded-xl bg-surface-subtle p-4 text-body-sm-mobile break-keep text-text-primary">
    <Info
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-text-secondary"
    />
    결제 결과를 확인하고 있어요. 확인이 끝날 때까지 새로 충전할 수 없어요.
  </p>
);

interface PaymentHistoryProps {
  onBack: () => void;
}

// 가게 관리 > 결제 내역. 포인트 충전 결제를 최근 순으로 보여주고, 목록 끝에 가까워지면 다음 구간을 이어 붙인다.
// 결제창에서 승인을 시도하기 전에 닫은 주문은 서버가 내려주지 않는다
export const PaymentHistory = ({ onBack }: PaymentHistoryProps) => {
  const { loadMore, retry, state } = usePaymentHistory();

  const renderContent = () => {
    if (state.status === 'loading') {
      return <PaymentHistorySkeleton />;
    }

    if (state.status === 'error') {
      return (
        <PaymentHistoryMessage
          description="잠시 후 다시 시도해 주세요"
          onRetry={retry}
          title="결제 내역을 불러오지 못했어요"
        />
      );
    }

    if (state.items.length === 0) {
      return (
        <PaymentHistoryMessage
          description="포인트를 충전하면 여기에 결제 내역이 쌓여요"
          title="결제 내역이 없어요"
        />
      );
    }

    return (
      <>
        {state.items.some(
          ({ displayStatus }) => displayStatus === 'CONFIRMING',
        ) && <ConfirmingNotice />}
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          {state.items.map((item) => (
            <PaymentRow item={item} key={item.paymentId} />
          ))}
        </ul>
        <PaymentHistoryFooter
          hasMore={state.nextCursor !== null}
          loadMore={state.loadMore}
          onLoadMore={loadMore}
        />
      </>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={onBack} title="결제 내역" />
      </div>
      <main className="flex flex-1 flex-col gap-3 px-page py-5">
        {renderContent()}
      </main>
    </>
  );
};
