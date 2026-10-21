import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';

import { type Campaign, cancelScheduledCampaign } from '@owner/api/campaign';
import type { ApiResult } from '@owner/api/types';

import { CampaignActionSheet } from './CampaignActionSheet';

export interface CurrentCampaignActionsProps {
  campaign: Campaign;
  // 취소처럼 캠페인을 바꾼 뒤 목록을 다시 불러온다
  onChanged: () => void;
}

// 공통 Button의 secondary와 같은 모양의 링크
const secondaryLinkClassName =
  'flex h-11 w-full items-center justify-center rounded-md border border-action-primary bg-bg-surface text-body-sm-web font-medium text-action-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

// 캠페인 탭의 현재 캠페인 카드 아래 버튼. 작성 중이면 이어서 작성, 대기 중이면 대기 중 취소를 둔다.
// 작성 중 캠페인은 지우지 않고 남겨 두므로 삭제는 두지 않는다
export const CurrentCampaignActions = ({
  campaign,
  onChanged,
}: CurrentCampaignActionsProps) => {
  const { id, status } = campaign;
  const [openSheet, setOpenSheet] = useState<'cancel' | null>(null);
  // 취소하려는 사이 집행이 시작됐거나 캠페인을 찾을 수 없어 목록이 지금과 다르다. 시트에서 안내를 읽고 닫으면 목록을 다시 불러온다
  const [isStatusChanged, setIsStatusChanged] = useState(false);

  const closeSheet = () => {
    setOpenSheet(null);

    if (isStatusChanged) {
      setIsStatusChanged(false);
      onChanged();
    }
  };

  // 처리가 끝나면 목록을 다시 불러와 바뀐 상태(작성 중)를 보여준다
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

  if (status !== 'SCHEDULED') {
    return null;
  }

  return (
    <>
      <div className="border-t border-border-subtle p-3">
        <Button
          className="h-11 w-full"
          onClick={() => setOpenSheet('cancel')}
          variant="neutral"
        >
          대기 중 취소
        </Button>
      </div>

      {/* 다시 활성화를 요청하면 되돌릴 수 있어 위험색 대신 기본 버튼으로 둔다 */}
      {openSheet === 'cancel' && (
        <CampaignActionSheet
          confirmLabel="대기 중 취소"
          description="작성 중으로 돌아가요. 고쳐서 다시 활성화를 요청할 수 있고, 시작일 전날 23:59까지 요청해야 시작일부터 노출돼요."
          onClose={closeSheet}
          onConfirm={() => runAction(() => cancelScheduledCampaign(id))}
          title="대기 중인 캠페인을 취소할까요?"
        />
      )}
    </>
  );
};
