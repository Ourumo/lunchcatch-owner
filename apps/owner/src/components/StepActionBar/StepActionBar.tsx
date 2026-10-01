import { Button } from '@repo/ui';

export interface StepActionBarProps {
  onNext: () => void;
  // 없으면 이전 버튼을 숨긴다 (첫 단계)
  onPrevious?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  // 버튼 위에 보여주는 안내. 다음으로 넘어가려면 무엇이 남았는지 알려줄 때 쓴다
  hint?: string;
}

// 여러 단계로 나뉜 입력 흐름의 하단 이전·다음 버튼.
// sticky로 붙으므로 화면 높이를 채우는 세로 flex 레이아웃(min-h-dvh)의 마지막에 둔다
export const StepActionBar = ({
  hint,
  isNextDisabled = false,
  isNextLoading = false,
  nextLabel = '다음',
  onNext,
  onPrevious,
}: StepActionBarProps) => {
  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-border-subtle bg-bg-surface px-page pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {/* 안내가 바뀔 때 스크린 리더가 읽도록 영역은 항상 두고, 안내가 없으면 화면에서만 숨긴다 */}
      <p
        aria-live="polite"
        className={
          hint ? 'text-center type-caption text-text-secondary' : 'sr-only'
        }
      >
        {hint}
      </p>
      <div className="flex gap-2">
        {onPrevious && (
          <Button
            className="h-12 flex-1"
            onClick={onPrevious}
            variant="secondary"
          >
            이전
          </Button>
        )}
        <Button
          className="h-12 flex-2"
          disabled={isNextDisabled}
          isLoading={isNextLoading}
          onClick={onNext}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
};
