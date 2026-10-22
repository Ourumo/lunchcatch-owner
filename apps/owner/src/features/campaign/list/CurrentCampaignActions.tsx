import { useState } from 'react';
import { Link } from 'react-router';
import { Button, type ButtonVariant } from '@repo/ui';

import {
  type Campaign,
  cancelScheduledCampaign,
  endCampaign,
  pauseCampaign,
  resumeCampaign,
} from '@owner/api/campaign';
import type { ApiResult } from '@owner/api/types';

import { CampaignActionSheet } from './CampaignActionSheet';

export interface CurrentCampaignActionsProps {
  campaign: Campaign;
  // 취소, 중단처럼 캠페인을 바꾼 뒤 목록을 다시 불러온다
  onChanged: () => void;
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

// 공통 Button의 secondary와 같은 모양의 링크
const secondaryLinkClassName =
  'flex h-11 w-full items-center justify-center rounded-md border border-action-primary bg-bg-surface text-body-sm-web font-medium text-action-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

// 캠페인 탭의 현재 캠페인 카드 아래 버튼. 작성 중이면 이어서 작성을, 그 밖에는 상태별 처리(getActions)를 둔다.
// 작성 중 캠페인은 지우지 않고 남겨 두므로 삭제는 두지 않는다
export const CurrentCampaignActions = ({
  campaign,
  onChanged,
}: CurrentCampaignActionsProps) => {
  const { id, status } = campaign;
  const [openAction, setOpenAction] = useState<CampaignAction | null>(null);
  // 처리하려는 사이 상태가 바뀌었거나 캠페인을 찾을 수 없어 목록이 지금과 다르다. 시트에서 안내를 읽고 닫으면 목록을 다시 불러온다
  const [isStatusChanged, setIsStatusChanged] = useState(false);
  const actions = getActions(campaign);

  const closeSheet = () => {
    setOpenAction(null);

    if (isStatusChanged) {
      setIsStatusChanged(false);
      onChanged();
    }
  };

  // 처리가 끝나면 목록을 다시 불러와 바뀐 상태를 보여준다. 실패하면 시트에 안내를 남기고 상태는 그대로 둔다
  const runAction = async (action: () => Promise<ApiResult<unknown>>) => {
    const result = await action();

    if (result.ok) {
      onChanged();
    } else if (
      result.code === 'CAMPAIGN-006' ||
      result.code === 'CAMPAIGN-005'
    ) {
      setIsStatusChanged(true);
    }

    return result;
  };

  if (status === 'DRAFT') {
    return (
      <div className="border-t border-border-subtle p-3">
        {/* 등록 화면은 저장된 입력값을 불러와 첫 단계부터 보여준다 */}
        <Link className={secondaryLinkClassName} to={`/campaigns/${id}/edit`}>
          이어서 작성
        </Link>
      </div>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  const openConfig = openAction && actionConfigs[openAction];

  return (
    <>
      <div className="flex gap-2 border-t border-border-subtle p-3">
        {actions.map((action) => (
          <Button
            className="h-11 flex-1"
            key={action}
            onClick={() => setOpenAction(action)}
            variant={actionConfigs[action].buttonVariant}
          >
            {actionConfigs[action].buttonLabel}
          </Button>
        ))}
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
    </>
  );
};
