import type { ReactNode } from 'react';
import { Button } from '@repo/ui';

export interface PageNoticeProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

// 화면 전체를 차지하는 안내(없는 주소, 화면 오류). 로그인 상태와 상관없이 같은 모양이라 하단 탭이나 상단 바 없이
// 가운데에 안내와 버튼 하나만 둔다. 틀은 AuthCheckScreen과 같게 둔다
export const PageNotice = ({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: PageNoticeProps) => (
  <div className="min-h-dvh min-w-mobile-min">
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col items-center justify-center gap-3 bg-bg-page px-page pb-16 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-2xl bg-surface-brand text-action-primary [&>svg]:size-7"
      >
        {icon}
      </span>
      <h1 className="mt-2 text-body-mobile font-bold break-keep text-text-primary">
        {title}
      </h1>
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        {description}
      </p>
      <Button className="mt-2" onClick={onAction} variant="secondary">
        {actionLabel}
      </Button>
    </main>
  </div>
);
