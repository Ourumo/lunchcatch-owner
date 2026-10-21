import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';

type ChargeResultTone = 'success' | 'danger' | 'progress';

const toneIcons: Record<ChargeResultTone, ReactNode> = {
  success: (
    <span className="flex size-20 items-center justify-center rounded-full bg-status-success-bg">
      <CircleCheck
        aria-hidden="true"
        className="size-9 text-status-success-fg"
      />
    </span>
  ),
  danger: (
    <span className="flex size-20 items-center justify-center rounded-full bg-status-danger-bg">
      <CircleAlert
        aria-hidden="true"
        className="size-9 text-status-danger-fg"
      />
    </span>
  ),
  progress: (
    <span className="flex size-20 items-center justify-center rounded-full bg-surface-brand">
      <LoaderCircle
        aria-hidden="true"
        className="size-9 animate-spin text-action-primary motion-reduce:animate-none"
      />
    </span>
  ),
};

interface ChargeResultLayoutProps {
  tone: ChargeResultTone;
  title: string;
  description: string;
  // 결과 아래에 두는 내용 (충전 금액 등)
  children?: ReactNode;
  // 결제를 시작한 화면. 결과 화면이 기록에 남지 않도록 바꿔치기해서 간다
  returnTo: string;
  returnLabel?: string;
  // 돌아가기 위에 두는 주 버튼 (다시 확인 등)
  action?: { label: string; onClick: () => void };
}

// 결제창에서 돌아온 뒤의 결과 화면 틀. 결과가 바뀌면 스크린 리더가 제목과 설명을 읽는다
export const ChargeResultLayout = ({
  action,
  children,
  description,
  returnLabel = '돌아가기',
  returnTo,
  title,
  tone,
}: ChargeResultLayoutProps) => (
  <main className="flex flex-1 flex-col px-page pt-16 pb-[max(24px,env(safe-area-inset-bottom))]">
    <div
      aria-live="polite"
      className="flex flex-1 flex-col items-center text-center"
    >
      {toneIcons[tone]}
      <h1 className="mt-5 text-h1 font-bold text-text-primary">{title}</h1>
      <p className="mt-2 text-body-sm-mobile break-keep text-text-secondary">
        {description}
      </p>
      {children}
    </div>

    {tone !== 'progress' && (
      <div className="flex flex-col gap-2">
        {action && (
          <Button className="h-12" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        <Link
          className={
            action
              ? 'flex h-12 items-center justify-center rounded-md text-body-sm-mobile font-medium text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary'
              : 'flex h-12 items-center justify-center rounded-md bg-action-primary text-body-sm-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary'
          }
          replace
          to={returnTo}
        >
          {returnLabel}
        </Link>
      </div>
    )}
  </main>
);
