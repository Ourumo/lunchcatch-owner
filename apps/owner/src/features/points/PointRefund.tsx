import { useId, useState } from 'react';
import { BottomSheet, Button, Toast, type ToastVariant } from '@repo/ui';
import { Info } from 'lucide-react';

import {
  REFUND_REASON_MAX_LENGTH,
  type RefundBlockedReason,
  type RefundPreview,
  requestRefund,
} from '@owner/api/refund';
import { formatNumber, formatPoints } from '@owner/ui/campaignFormat';
import { StepActionBar } from '@owner/ui/StepActionBar/StepActionBar';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { RefundRequestList } from './RefundRequestList';
import { useRefundPreview } from './useRefundPreview';
import { useRefundRequests } from './useRefundRequests';

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

interface ReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// 사유는 선택이다. 서버가 255자까지만 받아 입력에서 막는다
const ReasonField = ({ onChange, value }: ReasonFieldProps) => {
  const labelId = useId();
  const countId = useId();

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-caption-web font-medium text-text-primary"
        htmlFor={labelId}
      >
        환불 사유 (선택)
      </label>
      <textarea
        aria-describedby={countId}
        className="min-h-24 w-full resize-none rounded-md border border-border-subtle bg-bg-surface px-3 py-2.5 text-caption-web text-text-primary placeholder:text-text-secondary focus:border-action-primary focus:outline-none"
        id={labelId}
        maxLength={REFUND_REASON_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예) 가게 운영을 잠시 쉬어요."
        rows={4}
        value={value}
      />
      <p
        className="-mt-1 mr-1 text-right text-caption-mobile text-text-secondary"
        id={countId}
      >
        {value.length}/{REFUND_REASON_MAX_LENGTH}
      </p>
    </div>
  );
};

interface ConfirmRefundSheetProps {
  preview: RefundPreview;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// 요청하면 잔액 전액이 환불 대상이 되고, 관리자가 승인해야 처리된다는 것을 한 번 더 알린다
const ConfirmRefundSheet = ({
  isSubmitting,
  onClose,
  onConfirm,
  preview,
}: ConfirmRefundSheetProps) => (
  <BottomSheet
    closeOnBackdrop={!isSubmitting}
    isOpen
    onClose={isSubmitting ? () => {} : onClose}
    title="환불을 요청할까요?"
  >
    <p className="text-center text-body-sm-mobile break-keep text-text-secondary">
      잔액 {formatPoints(preview.refundablePoint)} 전액을 환불 요청해요.
      수수료를 빼고 {formatNumber(preview.expectedRefundAmount)}원이 환불되고,
      관리자가 승인한 뒤에 처리돼요.
    </p>
    <div className="mt-5 flex gap-2">
      <Button
        className="h-12 flex-1"
        disabled={isSubmitting}
        onClick={onClose}
        variant="neutral"
      >
        취소
      </Button>
      <Button
        className="h-12 flex-1"
        isLoading={isSubmitting}
        onClick={onConfirm}
      >
        환불 요청
      </Button>
    </div>
  </BottomSheet>
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
// 잔액 전액만 환불할 수 있어, 서버 미리보기로 환불 대상 포인트와 수수료, 예상 환불액을 보여주고 그 아래에 요청 내역을 둔다
export const PointRefund = ({ onBack }: PointRefundProps) => {
  const { reload, state } = useRefundPreview();
  const requests = useRefundRequests();
  const [reason, setReason] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 요청 결과 안내. 다음 요청이나 입력 전까지 둔다
  const [result, setResult] = useState<{
    variant: ToastVariant;
    title: string;
    description: string;
  } | null>(null);
  const canRequest =
    state.status === 'success' && state.preview.canRequest && !isSubmitting;

  // 응답을 받지 못했으면 처리됐는지 알 수 없어 자동으로 다시 보내지 않고, 점주가 다시 누르게 한다
  const submit = async () => {
    setIsSubmitting(true);

    const response = await requestRefund(reason);

    setIsSubmitting(false);
    setIsConfirmOpen(false);

    if (response.ok) {
      setReason('');
      setResult({
        variant: 'success',
        title: '환불을 요청했어요',
        description: '관리자가 승인한 뒤에 처리돼요.',
      });
      reload();
      // 새 요청이 맨 위에 대기로 보이도록 내역도 처음부터 다시 받는다
      requests.reload();
      return;
    }

    if (response.code && response.code in refundBlockedMessages) {
      // 미리보기를 본 뒤 상태가 바뀌었다. 바뀐 상태를 다시 받아 보여준다
      setResult({
        variant: 'danger',
        title: '환불을 요청하지 못했어요',
        description:
          refundBlockedMessages[response.code as RefundBlockedReason],
      });
      reload();
      return;
    }

    setResult({
      variant: 'danger',
      title: '환불을 요청하지 못했어요',
      description: '잠시 후 다시 시도해 주세요.',
    });
  };

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
        {preview.canRequest && (
          <ReasonField
            onChange={(value) => {
              setReason(value);
              setResult(null);
            }}
            value={reason}
          />
        )}
        {isConfirmOpen && (
          <ConfirmRefundSheet
            isSubmitting={isSubmitting}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={submit}
            preview={preview}
          />
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
        {result && (
          <Toast
            description={result.description}
            onClose={() => setResult(null)}
            style={{ maxWidth: 'none' }}
            title={result.title}
            variant={result.variant}
          />
        )}
        {renderPreview()}
        <RefundRequestList
          onLoadMore={requests.loadMore}
          onRetry={requests.reload}
          state={requests.state}
        />
      </main>
      <StepActionBar
        isNextDisabled={!canRequest}
        nextLabel="환불 요청"
        onNext={() => {
          setResult(null);
          setIsConfirmOpen(true);
        }}
      />
    </>
  );
};
