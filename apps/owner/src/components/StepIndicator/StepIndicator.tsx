export interface StepIndicatorProps {
  // 1부터 시작하는 현재 단계 번호
  current: number;
  total: number;
  // 현재 단계 이름
  title?: string;
  // 진행 막대를 스크린 리더에 알릴 이름
  label?: string;
}

// 여러 단계로 나뉜 입력 흐름에서 현재 단계와 진행률을 보여준다
export const StepIndicator = ({
  current,
  label = '진행 단계',
  title,
  total,
}: StepIndicatorProps) => {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 1), safeTotal);
  const progress = (safeCurrent / safeTotal) * 100;

  return (
    <div className="flex flex-col gap-2 px-page py-3">
      <div className="flex items-center gap-2">
        {title && (
          <span className="min-w-0 flex-1 truncate type-body-sm font-semibold text-text-primary">
            {title}
          </span>
        )}
        <span className="ml-auto shrink-0 type-caption text-text-primary">
          <span className="font-semibold">{safeCurrent}</span> / {safeTotal}
        </span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={safeTotal}
        aria-valuemin={1}
        aria-valuenow={safeCurrent}
        aria-valuetext={`${safeTotal}단계 중 ${safeCurrent}단계`}
        className="h-1 w-full overflow-hidden rounded-full bg-surface-subtle"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-action-primary transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
