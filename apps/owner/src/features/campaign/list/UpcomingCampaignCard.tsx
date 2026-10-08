import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { ChevronRight, CircleAlert } from 'lucide-react';

import {
  type Campaign,
  cancelScheduledCampaign,
  deleteCampaignDraft,
} from '@owner/api/campaign';
import {
  formatCreatedDate,
  formatPeriod,
  formatShortDate,
  getDaysFromToday,
} from '@owner/components/campaignFormat';
import { CampaignStatusBadge } from '@owner/components/CampaignStatusBadge/CampaignStatusBadge';

import {
  type CampaignActionResult,
  CampaignActionSheet,
} from './CampaignActionSheet';

export interface UpcomingCampaignCardProps {
  campaign: Campaign;
  title: string;
  // 삭제처럼 캠페인을 바꾼 뒤 목록을 다시 불러온다
  onChanged: () => void;
}

// 공통 Button의 secondary와 같은 모양의 링크
const secondaryLinkClassName =
  'inline-flex h-11 flex-1 items-center justify-center rounded-md border border-action-primary bg-bg-surface text-body-sm-web font-medium text-action-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

const getScheduleLabel = ({ budget, createdAt, status }: Campaign) => {
  if (status === 'SCHEDULED' && budget.startDate) {
    const days = getDaysFromToday(budget.startDate);

    return days > 0
      ? `${formatShortDate(budget.startDate)} 시작 · ${days}일 뒤`
      : `${formatShortDate(budget.startDate)} 시작`;
  }

  return `${formatCreatedDate(createdAt)} 등록`;
};

// 다음 캠페인. 시작을 기다리거나(SCHEDULED) 작성 중인(DRAFT) 캠페인이다.
// 위쪽은 상세로 가는 링크이고, 아래에 상태별 버튼을 붙인다(링크 안에는 버튼을 둘 수 없어 나눈다)
export const UpcomingCampaignCard = ({
  campaign,
  onChanged,
  title,
}: UpcomingCampaignCardProps) => {
  const { budget, id, reviewFailReasons, status } = campaign;
  const isReviewFailed = status === 'DRAFT' && reviewFailReasons.length > 0;
  const [openSheet, setOpenSheet] = useState<'delete' | 'cancel' | null>(null);
  const closeSheet = () => setOpenSheet(null);

  // 처리가 끝나면 목록을 다시 불러와 바뀐 상태(빈 칸, 작성 중)를 보여준다
  const runAction = async (action: () => Promise<CampaignActionResult>) => {
    const result = await action();

    if (result.ok) {
      onChanged();
    }

    return result;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <Link
        className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
        to={`/campaigns/${id}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CampaignStatusBadge status={status} />
            <span className="truncate text-caption-mobile text-text-secondary">
              {getScheduleLabel(campaign)}
            </span>
          </div>
          <h3 className="mt-2 truncate text-body-mobile font-bold text-text-primary">
            {title}
          </h3>
          {isReviewFailed ? (
            <p className="mt-1 flex items-center gap-1 text-caption-mobile font-medium text-status-danger-fg">
              <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
              자동 검수를 통과하지 못했어요
            </p>
          ) : (
            <p className="mt-1 text-caption-mobile text-text-secondary">
              {formatPeriod(budget.startDate, budget.endDate)}
            </p>
          )}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-text-tertiary"
        />
      </Link>

      {status === 'DRAFT' && (
        <div className="flex gap-2 border-t border-border-subtle p-3">
          <Button
            className="h-11 flex-1"
            onClick={() => setOpenSheet('delete')}
            variant="neutral"
          >
            삭제
          </Button>
          {/* 등록 화면은 저장된 입력값을 불러와 첫 단계부터 보여준다 */}
          <Link className={secondaryLinkClassName} to={`/campaigns/${id}/edit`}>
            이어서 작성
          </Link>
        </div>
      )}

      {status === 'SCHEDULED' && (
        <div className="border-t border-border-subtle p-3">
          <Button
            className="h-11 w-full"
            onClick={() => setOpenSheet('cancel')}
            variant="neutral"
          >
            시작 대기 취소
          </Button>
        </div>
      )}

      {openSheet === 'delete' && (
        <CampaignActionSheet
          confirmLabel="삭제"
          description={
            <>
              <strong className="font-bold text-text-primary">{title}</strong>
              <br />
              입력한 내용은 되돌릴 수 없어요.
            </>
          }
          isDestructive
          onClose={closeSheet}
          onConfirm={() => runAction(() => deleteCampaignDraft(id))}
          title="작성 중인 캠페인을 삭제할까요?"
        />
      )}

      {/* 다시 활성화를 요청하면 되돌릴 수 있어 위험색 대신 기본 버튼으로 둔다 */}
      {openSheet === 'cancel' && (
        <CampaignActionSheet
          confirmLabel="시작 대기 취소"
          description="작성 중으로 돌아가요. 다시 노출하려면 활성화를 다시 요청해야 하고, 시작일 전날 23:59까지 요청해야 시작일부터 노출돼요."
          onClose={closeSheet}
          onConfirm={() => runAction(() => cancelScheduledCampaign(id))}
          title="시작 대기를 취소할까요?"
        />
      )}
    </div>
  );
};
