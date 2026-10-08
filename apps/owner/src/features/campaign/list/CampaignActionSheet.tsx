import { type ReactNode, useState } from 'react';
import { BottomSheet, Button } from '@repo/ui';

// 처리 결과. 성공하면 시트를 닫고, 실패하면 시트 안에 문구를 보여준다
export type CampaignActionResult =
  { ok: true } | { ok: false; message?: string };

export interface CampaignActionSheetProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  // 되돌릴 수 없는 처리(삭제 등)는 위험색 버튼으로 보여준다
  isDestructive?: boolean;
  onConfirm: () => Promise<CampaignActionResult>;
  onClose: () => void;
}

const DEFAULT_ERROR_MESSAGE = '처리하지 못했어요. 잠시 후 다시 시도해 주세요.';

// 캠페인 삭제, 시작 대기 취소처럼 되돌리기 어려운 처리를 한 번 더 확인하는 시트.
// 열 때마다 새로 그려 오류 문구를 초기화하므로 열려 있을 때만 렌더링한다
export const CampaignActionSheet = ({
  confirmLabel,
  description,
  isDestructive = false,
  onClose,
  onConfirm,
  title,
}: CampaignActionSheetProps) => {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleConfirm = async () => {
    setIsPending(true);
    setErrorMessage(undefined);

    const result = await onConfirm();

    setIsPending(false);

    if (result.ok) {
      onClose();
      return;
    }

    setErrorMessage(result.message ?? DEFAULT_ERROR_MESSAGE);
  };

  return (
    // 처리 중에는 배경, 드래그, Esc로 닫지 않는다
    <BottomSheet
      closeOnBackdrop={!isPending}
      isOpen
      onClose={() => {
        if (!isPending) {
          onClose();
        }
      }}
      title={title}
    >
      <div className="text-center text-body-sm-mobile break-keep text-text-secondary">
        {description}
      </div>

      {errorMessage && (
        <p
          className="mt-3 text-center text-body-sm-mobile text-status-danger-fg"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <Button
          className="h-12 flex-1"
          disabled={isPending}
          onClick={onClose}
          variant="neutral"
        >
          닫기
        </Button>
        <Button
          className="h-12 flex-1"
          isLoading={isPending}
          onClick={handleConfirm}
          variant={isDestructive ? 'danger' : 'primary'}
        >
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  );
};
