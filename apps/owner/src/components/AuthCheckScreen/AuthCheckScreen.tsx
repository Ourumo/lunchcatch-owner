import type { ReactNode } from 'react';
import { Button } from '@repo/ui';

export type AuthCheckScreenProps =
  { status: 'checking' } | { status: 'failed'; onRetry: () => void };

// 화면 틀은 MainLayout과 같게 둔다. 라우터 밖에서 그려져 레이아웃을 쓸 수 없다
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh min-w-mobile-min">
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col items-center justify-center gap-3 bg-bg-page px-page pb-16 text-center">
      {children}
    </main>
  </div>
);

// 앱을 열 때 내 정보 조회로 로그인 상태를 확인하는 동안과 확인하지 못했을 때 보여준다.
// 확인하지 못했으면 로그인 전인지 알 수 없어 로그인 화면이나 보호 화면으로 보내지 않고 다시 시도하게 한다
export const AuthCheckScreen = (props: AuthCheckScreenProps) => {
  if (props.status === 'checking') {
    return (
      <Frame>
        <p className="text-body-sm-mobile text-text-secondary" role="status">
          로그인 정보를 확인하는 중이에요
        </p>
      </Frame>
    );
  }

  return (
    <Frame>
      <h1 className="text-body-mobile font-bold text-text-primary">
        로그인 정보를 확인하지 못했어요
      </h1>
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요
      </p>
      <Button className="mt-2" onClick={props.onRetry} variant="secondary">
        다시 시도
      </Button>
    </Frame>
  );
};
