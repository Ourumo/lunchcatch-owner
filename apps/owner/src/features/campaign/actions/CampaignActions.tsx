import { useState } from 'react';
import { Link } from 'react-router';
import { Button, type ButtonVariant, Toast } from '@repo/ui';

import {
  type Campaign,
  cancelScheduledCampaign,
  changeDailyBudget,
  endCampaign,
  getDateValueFromToday,
  pauseCampaign,
  resumeCampaign,
} from '@owner/api/campaign';
import type { ApiResult } from '@owner/api/types';
import { formatPoints } from '@owner/ui/campaignFormat';

import { CampaignActionSheet } from './CampaignActionSheet';
import { DailyBudgetSheet } from './DailyBudgetSheet';

export interface CampaignActionsProps {
  campaign: Campaign;
  // 취소, 중단처럼 캠페인을 바꾼 뒤 목록이나 상세를 다시 불러온다
  onChanged: () => void;
  // card: 캠페인 탭의 현재 캠페인 카드 아래, bar: 캠페인 상세 화면 아래에 붙는 버튼 영역
  layout?: 'card' | 'bar';
  // 진행 중 캠페인의 하루 예산 변경을 둘지. 캠페인 상세에서만 켠다
  canChangeDailyBudget?: boolean;
}

type CampaignAction = 'cancel' | 'pause' | 'resume' | 'end';

interface CampaignActionConfig {
  buttonLabel: string;
  buttonVariant: ButtonVariant;
  sheetTitle: string;
  sheetDescription: string;
  confirmLabel: string;
  // 되돌릴 수 없으면 확인 버튼을 위험색으로 둔다
  isDestructive?: boolean;
  run: (id: string) => Promise<ApiResult<unknown>>;
}

const actionConfigs: Record<CampaignAction, CampaignActionConfig> = {
  // 다시 활성화를 요청하면 되돌릴 수 있어 위험색 대신 기본 버튼으로 둔다
  cancel: {
    buttonLabel: '대기 중 취소',
    buttonVariant: 'neutral',
    sheetTitle: '대기 중인 캠페인을 취소할까요?',
    sheetDescription:
      '작성 중으로 돌아가요. 고쳐서 다시 활성화를 요청할 수 있고, 시작일 전날 23:59까지 요청해야 시작일부터 노출돼요.',
    confirmLabel: '대기 중 취소',
    run: cancelScheduledCampaign,
  },
  pause: {
    buttonLabel: '캠페인 중단',
    buttonVariant: 'neutral',
    sheetTitle: '캠페인을 중단할까요?',
    sheetDescription:
      '다음 피드 요청부터 노출되지 않아요. 오늘 이미 쓴 포인트는 돌려받을 수 없어요.',
    confirmLabel: '중단',
    run: pauseCampaign,
  },
  resume: {
    buttonLabel: '다시 시작',
    buttonVariant: 'secondary',
    sheetTitle: '캠페인을 다시 시작할까요?',
    sheetDescription: '바로 다시 점심 손님에게 노출돼요.',
    confirmLabel: '다시 시작',
    run: resumeCampaign,
  },
  end: {
    buttonLabel: '캠페인 종료',
    buttonVariant: 'neutral',
    sheetTitle: '캠페인을 종료할까요?',
    sheetDescription:
      '종료하면 되돌릴 수 없고, 남은 집행 기간에도 노출되지 않아요. 종료한 뒤에는 새 캠페인을 만들 수 있어요.',
    confirmLabel: '종료',
    isDestructive: true,
    run: endCampaign,
  },
};

// 상태별로 둘 처리. 재개는 점주가 직접 중단한(OWNER) 캠페인만 할 수 있다.
// 잔액 부족(NO_POINTS)은 충전하면 자동으로 다시 시작되고, 관리자 중단(ADMIN)은 점주가 아무것도 할 수 없어 카드의 안내만 둔다
const getActions = ({
  pausedReason,
  status,
}: Pick<Campaign, 'pausedReason' | 'status'>): CampaignAction[] => {
  switch (status) {
    case 'SCHEDULED':
      return ['cancel'];
    case 'ACTIVE':
      return ['pause'];
    case 'PAUSED':
      if (pausedReason === 'OWNER') {
        return ['end', 'resume'];
      }

      return pausedReason === 'NO_POINTS' ? ['end'] : [];
    default:
      return [];
  }
};

const layoutClassNames = {
  card: { container: 'border-t border-border-subtle p-3', button: 'h-11' },
  // StepActionBar와 같은 모양. sticky로 붙으므로 화면 높이를 채우는 세로 flex 레이아웃(min-h-dvh)의 마지막에 둔다
  bar: {
    container:
      'sticky bottom-0 z-10 border-t border-border-subtle bg-bg-surface px-page pt-3 pb-[max(12px,env(safe-area-inset-bottom))]',
    button: 'h-12',
  },
};

// 이어서 작성 링크. 카드에서는 공통 Button의 secondary와, 상세 아래에서는 화면의 주 행동이라 primary와 같은 모양으로 둔다
const continueLinkClassNames = {
  card: 'flex h-11 w-full items-center justify-center rounded-md border border-action-primary bg-bg-surface text-body-sm-web font-medium text-action-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
  bar: 'flex h-12 w-full items-center justify-center rounded-md border border-transparent bg-action-primary text-body-sm-web font-medium text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
};

// 진행 중 캠페인의 하루 예산 변경 버튼. 확인 시트 대신 금액을 입력하는 시트를 연다
const DAILY_BUDGET_BUTTON = {
  label: '하루 예산 변경',
  variant: 'secondary',
} satisfies { label: string; variant: ButtonVariant };

// 하루 예산을 바꿀 수 있는지. 바꾼 값은 다음 날 00:00부터 적용되어, 진행 중이어도 집행 마지막 날이면 적용할 날이 없다
const canChangeDailyBudgetOf = ({
  budget,
  status,
}: Pick<Campaign, 'budget' | 'status'>) =>
  status === 'ACTIVE' &&
  budget.dailyBudget !== null &&
  budget.endDate > getDateValueFromToday(0);

// 캠페인 탭의 현재 캠페인 카드와 캠페인 상세 아래 버튼. 작성 중이면 이어서 작성을, 그 밖에는 상태별 처리(getActions)를 둔다.
// 작성 중 캠페인은 지우지 않고 남겨 두므로 삭제는 두지 않는다
export const CampaignActions = ({
  campaign,
  canChangeDailyBudget = false,
  layout = 'card',
  onChanged,
}: CampaignActionsProps) => {
  const { budget, id, status } = campaign;
  const [openAction, setOpenAction] = useState<
    CampaignAction | 'dailyBudget' | null
  >(null);
  // 하루 예산을 바꾼 뒤의 안내. 서버가 바꾼 값을 주지 않아 상세에서 볼 수 없으므로 점주가 닫거나 다른 처리를 할 때까지 둔다
  const [dailyBudgetNotice, setDailyBudgetNotice] = useState<string | null>(
    null,
  );
  // 처리하려는 사이 상태가 바뀌었거나 캠페인을 찾을 수 없어 화면이 실제와 다르다. 시트에서 안내를 읽고 닫으면 다시 불러온다
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const actions = getActions(campaign);
  const showDailyBudget =
    canChangeDailyBudget && canChangeDailyBudgetOf(campaign);
  const classNames = layoutClassNames[layout];

  const closeSheet = () => {
    setOpenAction(null);

    if (isStatusChanged) {
      setIsStatusChanged(false);
      onChanged();
    }
  };

  const markIfStatusChanged = (result: ApiResult<unknown>) => {
    if (
      !result.ok &&
      (result.code === 'CAMPAIGN-006' || result.code === 'CAMPAIGN-005')
    ) {
      setIsStatusChanged(true);
    }
  };

  // 처리가 끝나면 목록이나 상세를 다시 불러와 바뀐 상태를 보여준다. 실패하면 시트에 안내를 남기고 상태는 그대로 둔다
  const runAction = async (action: () => Promise<ApiResult<unknown>>) => {
    const result = await action();

    if (result.ok) {
      // 중단하면 바꾼 하루 예산이 00:00에 적용되지 않을 수 있어 안내를 지운다
      setDailyBudgetNotice(null);
      onChanged();
    }

    markIfStatusChanged(result);

    return result;
  };

  // 바꾼 하루 예산은 다음 날부터 적용되고 지금 화면의 값은 그대로라 다시 불러오지 않는다
  const saveDailyBudget = async (dailyBudget: number) => {
    const result = await changeDailyBudget(id, dailyBudget);

    if (result.ok) {
      setDailyBudgetNotice(
        `내일 00:00부터 하루 예산이 ${formatPoints(dailyBudget)}로 바뀌어요.`,
      );
    }

    markIfStatusChanged(result);

    return result;
  };

  if (status === 'DRAFT') {
    return (
      <div className={classNames.container}>
        {/* 등록 화면은 저장된 입력값을 불러와 첫 단계부터 보여준다 */}
        <Link
          className={continueLinkClassNames[layout]}
          to={`/campaigns/${id}/edit`}
        >
          이어서 작성
        </Link>
      </div>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  const openConfig =
    openAction && openAction !== 'dailyBudget' && actionConfigs[openAction];

  return (
    <>
      <div className={`flex flex-col gap-2 ${classNames.container}`}>
        {/* 다시 불러와 진행 중이 아니게 되면(그사이 중단 등) 00:00에 적용되지 않을 수 있어 안내를 숨긴다 */}
        {showDailyBudget && dailyBudgetNotice && (
          <Toast
            className="break-keep"
            description={dailyBudgetNotice}
            onClose={() => setDailyBudgetNotice(null)}
            style={{ maxWidth: 'none' }}
            title="하루 예산을 바꿨어요"
            variant="success"
          />
        )}
        <div className="flex gap-2">
          {actions.map((action) => (
            <Button
              className={`${classNames.button} flex-1`}
              key={action}
              onClick={() => setOpenAction(action)}
              variant={actionConfigs[action].buttonVariant}
            >
              {actionConfigs[action].buttonLabel}
            </Button>
          ))}
          {showDailyBudget && (
            <Button
              className={`${classNames.button} flex-1`}
              onClick={() => setOpenAction('dailyBudget')}
              variant={DAILY_BUDGET_BUTTON.variant}
            >
              {DAILY_BUDGET_BUTTON.label}
            </Button>
          )}
        </div>
      </div>

      {openConfig && (
        <CampaignActionSheet
          confirmLabel={openConfig.confirmLabel}
          description={openConfig.sheetDescription}
          isDestructive={openConfig.isDestructive}
          onClose={closeSheet}
          onConfirm={() => runAction(() => openConfig.run(id))}
          title={openConfig.sheetTitle}
        />
      )}

      {openAction === 'dailyBudget' && budget.dailyBudget !== null && (
        <DailyBudgetSheet
          currentDailyBudget={budget.dailyBudget}
          onClose={closeSheet}
          onSave={saveDailyBudget}
        />
      )}
    </>
  );
};
