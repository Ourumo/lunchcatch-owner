import type { ReactNode } from 'react';
import { Button } from '@repo/ui';

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
  if (status === 'loading') {
    return (
      <Frame>
        <p className="text-body-sm-mobile text-text-secondary" role="status">
          입점 신청 정보를 불러오는 중이에요
        </p>
      </Frame>
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
