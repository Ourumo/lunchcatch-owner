import type { ReactNode } from 'react';
import { Button } from '@repo/ui';

import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';

interface SignupFlowStatusProps {
  status: 'loading' | 'error';
  onRetry: () => void;
}

// 화면 틀은 입점 신청 화면(SignupFlowLayout)과 같은 폭으로 둔다
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh min-w-mobile-min">
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col items-center justify-center gap-3 bg-bg-page px-page pb-16 text-center">
      {children}
    </main>
  </div>
);

// 입점 신청에 들어올 때 저장한 값과 진행 상태를 불러오는 동안과 불러오지 못했을 때 보여준다.
// 불러오지 못한 채 진행하면 저장한 값을 빈 값으로 덮어쓸 수 있어 다시 시도하게 한다
export const SignupFlowStatus = ({
  onRetry,
  status,
}: SignupFlowStatusProps) => {
  // 이어갈 단계를 아직 몰라, 입점 신청 화면의 틀(상단 바, 진행 막대, 입력 칸, 하단 버튼)만 같은 자리에 그린다
  if (status === 'loading') {
    return (
      <div className="min-h-dvh min-w-mobile-min">
        <div
          aria-busy="true"
          className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page"
        >
          <span className="sr-only">입점 신청 정보를 불러오는 중</span>
          <div className="flex h-14 items-center bg-bg-surface px-page">
            <SkeletonBlock className="h-6 w-32" rounded="lg" />
          </div>
          <div aria-hidden="true" className="h-1 bg-surface-subtle" />
          <div className="flex flex-1 flex-col gap-4 px-page pt-6 pb-8">
            <SkeletonBlock className="h-12" />
            {[96, 96, 96].map((height, index) => (
              <SkeletonBlock height={height} key={index} />
            ))}
          </div>
          <div className="border-t border-border-subtle bg-bg-surface px-page pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <SkeletonBlock className="h-12" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Frame>
      <h1 className="text-body-mobile font-bold text-text-primary">
        입점 신청 정보를 불러오지 못했어요
      </h1>
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요
      </p>
      <Button className="mt-2" onClick={onRetry} variant="secondary">
        다시 시도
      </Button>
    </Frame>
  );
};
