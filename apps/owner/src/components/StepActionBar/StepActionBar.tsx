import { Button } from '@repo/ui';

export interface StepActionBarProps {
  onNext: () => void;
  // 없으면 이전 버튼을 숨긴다 (첫 단계)
  onPrevious?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

// 여러 단계로 나뉜 입력 흐름의 하단 고정 이전·다음 버튼
export const StepActionBar = ({
  isNextDisabled = false,
  isNextLoading = false,
  nextLabel = '다음',
  onNext,
  onPrevious,
}: StepActionBarProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-mobile min-w-mobile-min gap-2 border-t border-border-subtle bg-bg-surface px-page pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
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
  );
};
