import { Button } from '@repo/ui';
import { Info } from 'lucide-react';

import type { RefundBlockedReason, RefundPreview } from '@owner/api/refund';
import { formatNumber, formatPoints } from '@owner/ui/campaignFormat';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { useRefundPreview } from './useRefundPreview';

const skeletonClassName =
  'animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none';

// 지금 환불을 요청할 수 없는 이유. 요청이 같은 이유로 거절됐을 때도 쓴다
const refundBlockedMessages: Record<RefundBlockedReason, string> = {
  NO_BALANCE: '환불할 수 있는 포인트가 없어요.',
  ACTIVE_CAMPAIGN:
    '집행 중인 캠페인이 있어 환불을 요청할 수 없어요. 캠페인이 끝나거나 종료한 뒤에 요청해 주세요.',
  PENDING_REQUEST:
    '처리를 기다리는 환불 요청이 있어요. 처리가 끝난 뒤에 다시 요청할 수 있어요.',
};

const PreviewRow = ({
  isHighlighted = false,
  label,
  value,
}: {
  label: string;
  value: string;
  isHighlighted?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-3">
    <dt
      className={
        isHighlighted
          ? 'text-body-mobile font-bold text-text-primary'
          : 'text-body-sm-mobile text-text-secondary'
      }
    >
      {label}
    </dt>
    <dd
      className={`shrink-0 font-bold text-text-primary ${
        isHighlighted ? 'text-h3-mobile' : 'text-body-mobile'
      }`}
    >
      {value}
    </dd>
  </div>
);

// 서버가 계산한 값을 그대로 보여준다. 수수료 정책 문구는 넣지 않는다
const PreviewCard = ({ preview }: { preview: RefundPreview }) => (
  <section
    aria-label="환불 미리보기"
    className="rounded-xl border border-border-subtle bg-bg-surface p-4"
  >
    <dl className="flex flex-col gap-2.5">
      <PreviewRow
        label="환불 가능 포인트"
        value={formatPoints(preview.refundablePoint)}
      />
      <PreviewRow label="수수료" value={`${formatNumber(preview.fee)}원`} />
      <div className="border-t border-border-subtle pt-2.5">
        <PreviewRow
          isHighlighted
          label="예상 환불액"
          value={`${formatNumber(preview.expectedRefundAmount)}원`}
        />
      </div>
    </dl>
  </section>
);

const Notice = ({ children }: { children: string }) => (
  <p className="flex gap-2 rounded-xl bg-surface-subtle p-4 text-body-sm-mobile break-keep text-text-primary">
    <Info
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-text-secondary"
    />
    {children}
  </p>
);

const PreviewSkeleton = () => (
  <div aria-busy="true">
    <span className="sr-only">환불 미리보기를 불러오는 중</span>
    <div aria-hidden="true" className={`h-36 ${skeletonClassName}`} />
  </div>
);

const PreviewError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-col items-center gap-3 px-page py-12 text-center">
    <p className="text-body-mobile font-bold text-text-primary">
      환불 정보를 불러오지 못했어요
    </p>
    <p className="text-body-sm-mobile break-keep text-text-secondary">
      잠시 후 다시 시도해 주세요
    </p>
    <Button className="mt-2" onClick={onRetry} variant="secondary">
      다시 시도
    </Button>
  </div>
);

interface PointRefundProps {
  onBack: () => void;
}

// 가게 관리 > 포인트 환불 (docs/requirements-owner.md "포인트 환불 요청").
// 잔액 전액만 환불할 수 있어, 서버 미리보기로 환불 대상 포인트와 수수료, 예상 환불액을 보여준다
export const PointRefund = ({ onBack }: PointRefundProps) => {
  const { reload, state } = useRefundPreview();

  const renderPreview = () => {
    if (state.status === 'loading') {
      return <PreviewSkeleton />;
    }

    if (state.status === 'error') {
      return <PreviewError onRetry={reload} />;
    }

    const { preview } = state;

    return (
      <>
        <PreviewCard preview={preview} />
        {preview.blockedReason && (
          <Notice>{refundBlockedMessages[preview.blockedReason]}</Notice>
        )}
      </>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={onBack} title="포인트 환불" />
      </div>
      <main className="flex flex-1 flex-col gap-3 px-page py-5">
        {renderPreview()}
      </main>
    </>
  );
};
