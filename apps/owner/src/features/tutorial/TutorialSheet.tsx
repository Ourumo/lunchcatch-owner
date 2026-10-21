import { type ReactNode, useState } from 'react';
import { BottomSheet, Button } from '@repo/ui';
import { ChartColumn, CircleAlert, Clock, Coins, Ticket } from 'lucide-react';

import { useAuth } from '@owner/auth/useAuth';

interface TutorialStep {
  icon: ReactNode;
  title: string;
  description: string;
  // 내용 아래에 보여줄 시간표. 강조할 항목은 highlighted
  timeline?: { label: string; highlighted?: boolean }[];
}

// 점주가 처음 홈에 들어왔을 때 알아야 할 순서대로 보여준다.
// 쿠폰 사용 처리는 실제로 매장 기기에서 손님이 직접 하고 점주 앱 QR 스캔은 시연용이라, 스캔 방법은 말하지 않고 결과를 보는 곳만 알려준다
const tutorialSteps: TutorialStep[] = [
  {
    icon: <Clock />,
    title: '런치캐치는 이렇게 동작해요',
    description:
      '주변 직장인이 가게 캠페인을 찜해 두고, 11시 선착순 오픈에 쿠폰을 받아요. 피드에는 점심 시간대에만 보여요.',
    timeline: [
      { label: '10:00 노출 시작' },
      { label: '11:00 선착순 오픈', highlighted: true },
      { label: '12:59 마감' },
    ],
  },
  {
    icon: <Ticket />,
    title: '캠페인으로 손님을 모아요',
    description:
      '캠페인 탭에서 쿠폰 조건, 노출 대상, 하루 예산과 기간을 정하면 점심 피드에 가게 쿠폰이 올라가요.',
  },
  {
    icon: <Coins />,
    title: '포인트를 미리 충전해 두세요',
    description:
      '쿠폰이 손님에게 보일 때마다 포인트가 쓰여요. 포인트가 부족하면 캠페인이 멈추니, 홈 위의 포인트에서 미리 충전해 두세요.',
  },
  {
    icon: <ChartColumn />,
    title: '쿠폰 사용은 홈에서 확인해요',
    description:
      '손님이 매장에서 쿠폰을 사용하면 홈의 최근 성과에 바로 쌓여요. 오늘 몇 장이 쓰였는지 여기서 확인하세요.',
  },
];

const SAVE_FAILED_MESSAGE =
  '완료를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

// 최초 튜토리얼. 홈 위에 시트로 띄워 단계를 넘긴다.
// 마지막 단계의 시작하기와 건너뛰기, 시트를 닫는 동작(Esc, 아래로 끌기)을 모두 완료로 보고 서버에 저장한다.
// 저장에 성공하면 로그인 상태의 tutorialViewed가 바뀌어 쓰는 쪽이 시트를 내린다. 실패하면 시트에 남아 다시 시도하게 한다
export const TutorialSheet = () => {
  const { completeTutorial } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const step = tutorialSteps[stepIndex];
  const isLastStep = stepIndex === tutorialSteps.length - 1;

  const complete = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setHasFailed(false);

    const result = await completeTutorial();

    // 성공하면 쓰는 쪽이 시트를 내리므로 상태를 되돌리지 않는다
    if (!result.ok) {
      setIsSaving(false);
      setHasFailed(true);
    }
  };

  const goTo = (index: number) => {
    setHasFailed(false);
    setStepIndex(index);
  };

  return (
    // 배경을 잘못 눌러 넘어가지 않도록 배경으로는 닫지 않는다
    <BottomSheet
      closeOnBackdrop={false}
      isOpen
      onClose={complete}
      title="런치캐치 둘러보기"
    >
      <div className="flex flex-col">
        <div className="flex min-h-11 items-center justify-between">
          <p className="type-body-sm font-medium text-text-secondary">
            <span className="sr-only">단계 </span>
            {stepIndex + 1} / {tutorialSteps.length}
          </p>
          {!isLastStep && (
            <Button disabled={isSaving} onClick={complete} variant="tertiary">
              건너뛰기
            </Button>
          )}
        </div>

        <span
          aria-hidden="true"
          className="mt-2 flex size-14 items-center justify-center rounded-2xl bg-surface-brand text-action-primary [&>svg]:size-7"
        >
          {step.icon}
        </span>
        <h3 className="mt-4 text-h3-mobile font-bold break-keep text-text-primary">
          {step.title}
        </h3>
        <p className="mt-2 type-body-sm break-keep text-text-secondary">
          {step.description}
        </p>
        {step.timeline && (
          <ul aria-label="점심 시간표" className="mt-4 flex flex-wrap gap-2">
            {step.timeline.map(({ highlighted, label }) => (
              <li
                className={`flex h-8 items-center rounded-full px-3 text-caption-mobile ${highlighted ? 'bg-surface-brand font-bold' : 'bg-surface-subtle font-medium'} text-text-primary`}
                key={label}
              >
                {label}
              </li>
            ))}
          </ul>
        )}

        <div aria-hidden="true" className="mt-7 flex justify-center gap-1.5">
          {tutorialSteps.map(({ title }, index) => (
            <span
              className={`h-2 rounded-full ${index === stepIndex ? 'w-5 bg-action-primary' : 'w-2 bg-border-subtle'}`}
              key={title}
            />
          ))}
        </div>

        {hasFailed && (
          <p
            className="mt-5 flex gap-2 rounded-xl bg-status-danger-bg px-3.5 py-3 type-body-sm break-keep text-status-danger-fg"
            role="alert"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            {SAVE_FAILED_MESSAGE}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {stepIndex > 0 && (
            <Button
              className="h-12"
              disabled={isSaving}
              onClick={() => goTo(stepIndex - 1)}
              variant="secondary"
            >
              이전
            </Button>
          )}
          <Button
            className={`h-12 ${stepIndex > 0 ? 'col-span-2' : 'col-span-3'}`}
            isLoading={isSaving}
            onClick={
              isLastStep || hasFailed ? complete : () => goTo(stepIndex + 1)
            }
          >
            {hasFailed ? '다시 시도' : isLastStep ? '시작하기' : '다음'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
