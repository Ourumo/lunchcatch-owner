export type StepIndicatorVariant = 'default' | 'attached';

export interface StepIndicatorProps {
  // 1부터 시작하는 현재 단계 번호
  current: number;
  total: number;
  // 현재 단계 이름
  title?: string;
  // 진행 막대를 스크린 리더에 알릴 이름
  label?: string;
  // attached: 여백과 문구 없이 진행 막대만 화면 폭에 맞춰 보여준다 (헤더 바로 아래에 붙일 때)
  variant?: StepIndicatorVariant;
}

// 여러 단계로 나뉜 입력 흐름에서 현재 단계와 진행률을 보여준다
export const StepIndicator = ({
  current,
  label = '진행 단계',
  title,
  total,
  variant = 'default',
}: StepIndicatorProps) => {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 1), safeTotal);
  const progress = (safeCurrent / safeTotal) * 100;
  const isAttached = variant === 'attached';

  const progressBar = (
    <div
      aria-label={label}
      aria-valuemax={safeTotal}
      aria-valuemin={1}
      aria-valuenow={safeCurrent}
      aria-valuetext={`${safeTotal}단계 중 ${safeCurrent}단계`}
      className={`h-1 w-full overflow-hidden bg-surface-subtle ${
        isAttached ? '' : 'rounded-full'
      }`}
      role="progressbar"
    >
      <div
        className={`h-full bg-action-primary transition-[width] ${
          isAttached ? '' : 'rounded-full'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  if (isAttached) {
    return progressBar;
  }

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
      {progressBar}
    </div>
  );
};
