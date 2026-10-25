import { useAuth } from '@owner/auth/useAuth';

import { TutorialSheet } from './TutorialSheet';

// 입점을 마친(ACTIVE) 점주가 튜토리얼을 아직 보지 않았으면 홈에 들어올 때 튜토리얼을 띄운다.
// 로그인 직후와 새로고침 뒤(내 정보 조회로 되살린 경우) 모두 같은 로그인 상태를 본다.
// 닫으면 tutorialViewed를 바로 true로 바꿔 내리고 완료를 서버에 저장한다. ONBOARDING에는 띄우지 않는다
export const FirstVisitTutorial = () => {
  const { completeTutorial, owner } = useAuth();

  if (owner?.status !== 'ACTIVE' || owner.tutorialViewed) {
    return null;
  }

  return <TutorialSheet onClose={() => void completeTutorial()} />;
};
