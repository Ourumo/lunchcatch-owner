import { SignupCompleteAction } from '@owner/features/signup/SignupCompleteAction';

// 가게 최종 등록을 마친 뒤의 임시 화면. 등록 정보 요약은 이후 작업에서 추가한다
const SignupCompletePage = () => (
  <div className="min-h-dvh min-w-mobile-min">
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col items-center gap-3 bg-bg-page px-page pt-20 text-center">
      <h1 className="type-h1 text-text-primary">매장 등록이 완료되었어요!</h1>
      <SignupCompleteAction />
    </main>
  </div>
);

export default SignupCompletePage;
