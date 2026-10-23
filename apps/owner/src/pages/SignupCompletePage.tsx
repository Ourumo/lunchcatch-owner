import { Store } from 'lucide-react';

import { SignupCompleteAction } from '@owner/features/signup/SignupCompleteAction';

// 가게 최종 등록을 마친 뒤의 안내 화면. 캠페인 활성화 완료 화면과 같은 구성(아이콘, 제목, 설명, 화면 아래 주 버튼)이다
const SignupCompletePage = () => (
  <div className="min-h-dvh min-w-mobile-min">
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page px-page pt-16 pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-surface-brand">
          <Store aria-hidden="true" className="size-9 text-action-primary" />
        </span>
        <h1 className="mt-5 text-h1 font-bold text-text-primary">
          가게 등록을 마쳤어요
        </h1>
        <p className="mt-2 text-body-sm-mobile break-keep text-text-secondary">
          이제 캠페인을 만들어 주변 직장인에게 쿠폰을 보여줄 수 있어요.
        </p>
      </div>
      <SignupCompleteAction />
    </main>
  </div>
);

export default SignupCompletePage;
