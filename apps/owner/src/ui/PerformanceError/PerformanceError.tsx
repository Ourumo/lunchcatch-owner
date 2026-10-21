import { RotateCw } from 'lucide-react';

export interface PerformanceErrorProps {
  onRetry: () => void;
  className?: string;
}

// 성과를 불러오지 못했을 때 성과 자리에만 보여주는 안내. 캠페인 정보는 그대로 두고 성과만 다시 불러온다
export const PerformanceError = ({
  className,
  onRetry,
}: PerformanceErrorProps) => (
  <div
    className={[
      'flex items-center justify-between gap-3 rounded-lg bg-surface-subtle px-3 py-2.5',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    role="alert"
  >
    <span className="text-caption-mobile break-keep text-text-secondary">
      성과를 불러오지 못했어요
    </span>
    <button
      className="-my-2 flex h-11 shrink-0 items-center gap-1 rounded-full px-2 text-caption-mobile font-semibold text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
      onClick={onRetry}
      type="button"
    >
      <RotateCw aria-hidden="true" className="size-3.5" />
      다시 시도
    </button>
  </div>
);
