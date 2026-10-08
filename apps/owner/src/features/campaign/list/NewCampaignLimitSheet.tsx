import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BottomSheet, Button } from '@repo/ui';

import { type Campaign, deleteCampaignDraft } from '@owner/api/campaign';
import { formatShortDate } from '@owner/components/campaignFormat';

const NEW_CAMPAIGN_PATH = '/campaigns/new';

const DEFAULT_ERROR_MESSAGE = '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.';

const linkClassName =
  'flex h-12 w-full items-center justify-center rounded-md text-body-sm-mobile font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

export interface NewCampaignLimitSheetProps {
  // 자리를 차지하고 있는 다음 캠페인 (작성 중 또는 시작 대기)
  campaign: Campaign;
  title: string;
  onClose: () => void;
}

// 다음 캠페인 자리가 차 있을 때 "새 캠페인"을 누르면 띄운다.
// 버튼을 막지 않고 자리를 비우는 다음 행동(이어서 작성, 삭제, 시작 대기 취소)으로 바로 잇기 위해서다
export const NewCampaignLimitSheet = ({
  campaign,
  onClose,
  title,
}: NewCampaignLimitSheetProps) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const { budget, id, status } = campaign;

  const handleDeleteAndCreate = async () => {
    setIsDeleting(true);
    setErrorMessage(undefined);

    const result = await deleteCampaignDraft(id);

    if (result.ok) {
      navigate(NEW_CAMPAIGN_PATH);
      return;
    }

    setIsDeleting(false);
    setErrorMessage(result.message ?? DEFAULT_ERROR_MESSAGE);
  };

  return (
    // 삭제 중에는 배경, 드래그, Esc로 닫지 않는다
    <BottomSheet
      closeOnBackdrop={!isDeleting}
      isOpen
      onClose={() => {
        if (!isDeleting) {
          onClose();
        }
      }}
      title="이미 준비 중인 캠페인이 있어요"
    >
      <p className="text-center text-body-sm-mobile break-keep text-text-secondary">
        {status === 'SCHEDULED'
          ? `${formatShortDate(budget.startDate)}에 시작할 "${title}" 캠페인이 있어요. 다음 캠페인은 1개만 준비할 수 있어서, 시작 대기를 취소해야 새로 만들 수 있어요.`
          : `작성 중인 "${title}" 캠페인이 있어요. 다음 캠페인은 1개만 준비할 수 있어요.`}
      </p>

      {errorMessage && (
        <p
          className="mt-3 text-center text-body-sm-mobile text-status-danger-fg"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        {status === 'SCHEDULED' ? (
          <Link
            className={`${linkClassName} border border-border-subtle bg-bg-surface text-text-primary hover:bg-surface-subtle`}
            to={`/campaigns/${id}`}
          >
            캠페인 보기
          </Link>
        ) : (
          <>
            {/* 등록 화면은 저장된 입력값을 불러와 첫 단계부터 보여준다 */}
            <Link
              className={`${linkClassName} bg-action-primary text-text-inverse hover:bg-action-primary-hover`}
              to={`/campaigns/${id}/edit`}
            >
              이어서 작성
            </Link>
            <Button
              className="h-12 w-full"
              isLoading={isDeleting}
              onClick={handleDeleteAndCreate}
              variant="neutral"
            >
              삭제하고 새로 만들기
            </Button>
          </>
        )}
      </div>
    </BottomSheet>
  );
};
