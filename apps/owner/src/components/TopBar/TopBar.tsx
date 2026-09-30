import { ChevronLeft } from 'lucide-react';

export interface TopBarProps {
  title: string;
  onBack?: () => void;
}

// 화면 상단 제목과 뒤로 가기 버튼. user 앱 TopBar와 같은 모양이다
export const TopBar = ({ onBack, title }: TopBarProps) => {
  return (
    <header className="flex h-14 items-center gap-3 bg-bg-surface px-page">
      {onBack && (
        <button
          aria-label="뒤로 가기"
          className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-h3-mobile font-bold text-text-primary">
        {title}
      </h1>
    </header>
  );
};
