import { getDb } from './db';
import { fail, unauthenticated } from './response';
import { type MockDb, ONBOARDING_STEPS, type OnboardingStep } from './seed';

// 입점 신청 진행 상태를 다루는 규칙. 서버가 하는 검사를 핸들러마다 똑같이 쓰도록 모았다.
// 화면(features/signup)은 서버가 거절한 이유(code)를 보고 안내하거나 진행 상태를 다시 불러오므로, 같은 코드로 거절한다

// 아직 마치지 않은 첫 단계. 모두 마쳤지만 최종 등록 전이면 마지막 단계(MENU)에 머문다.
// 화면은 마지막 단계 완료 뒤 바로 최종 등록을 보내고, 실패해 다시 누르면 마지막 단계 완료부터 다시 보낸다
const findResumeStep = (steps: MockDb['store']['onboarding']['steps']) =>
  steps.find(({ completed }) => !completed)?.step ??
  ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];

const isCompleted = (db: MockDb, step: OnboardingStep) =>
  db.store.onboarding.steps.some(
    (current) => current.step === step && current.completed,
  );

// 입점 신청 중인 점주만 부를 수 있는 요청인지 검사한다. 통과하면 null, 아니면 거절 응답
export const checkOnboardingOwner = () => {
  const { isLoggedIn, status } = getDb().owner;

  if (!isLoggedIn) return unauthenticated();
  if (status !== 'ONBOARDING') {
    return fail(403, 'OWNER-002', '입점 신청 중인 점주만 이용할 수 있습니다.');
  }

  return null;
};

// 보낸 버전이 지금 버전과 다르면 다른 창에서 먼저 저장한 것이다 (409 STORE-001)
export const checkVersion = (version: unknown) =>
  version === getDb().store.onboarding.version
    ? null
    : fail(409, 'STORE-001', '다른 곳에서 먼저 저장했습니다.');

// 앞 단계를 모두 마쳤는지. 아니면 409 STORE-002로 거절해, 화면이 진행 상태를 다시 불러와 이어갈 단계로 옮긴다
export const checkPreviousSteps = (step: OnboardingStep) => {
  const db = getDb();
  const previous = ONBOARDING_STEPS.slice(0, ONBOARDING_STEPS.indexOf(step));

  return previous.every((current) => isCompleted(db, current))
    ? null
    : fail(409, 'STORE-002', '앞 단계를 먼저 완료해 주세요.');
};

// 사진 · 메뉴 단계 완료는 서버의 지금 단계가 그 단계일 때만 받는다 (409 STORE-002)
export const checkCurrentStep = (step: OnboardingStep) =>
  getDb().store.onboarding.resumeStep === step
    ? null
    : fail(409, 'STORE-002', '지금 진행 중인 단계가 아닙니다.');

// 단계를 마친 것으로 표시하고 버전을 올린다. updateDb 안에서 부른다
export const completeStep = (db: MockDb, step: OnboardingStep) => {
  const { onboarding } = db.store;

  onboarding.steps = onboarding.steps.map((current) =>
    current.step === step ? { ...current, completed: true } : current,
  );
  onboarding.version += 1;
  onboarding.resumeStep = findResumeStep(onboarding.steps);
};

// 최종 등록에 필요한 단계를 모두 마쳤는지
export const isOnboardingDone = (db: MockDb) =>
  ONBOARDING_STEPS.every((step) => isCompleted(db, step));
