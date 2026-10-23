import { useState } from 'react';
import { BottomSheet, Button } from '@repo/ui';

const DEFAULT_ERROR_MESSAGE =
  '로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.';

// 로그아웃 요청 결과. 실패하면 시트 안에 문구를 보여준다
export type LogoutResult = { ok: true } | { ok: false; message?: string };

export interface LogoutSheetProps {
  title: string;
  description: string;
  // 로그아웃을 요청한다. 성공하면 로그인 화면으로 보내는 일까지 부른 쪽이 맡는다 (ui는 요청 함수를 가져오지 않는다)
  onLogout: () => Promise<LogoutResult>;
  onClose: () => void;
}

// 로그아웃을 한 번 더 확인하는 시트. 가게 관리의 로그아웃과 입점 신청을 멈출 때 쓴다.
// 열 때마다 새로 그려 오류 문구를 초기화하므로 열려 있을 때만 렌더링한다
export const LogoutSheet = ({
  description,
  onClose,
  onLogout,
  title,
}: LogoutSheetProps) => {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  // 성공하면 부른 쪽이 화면을 옮겨 시트가 사라지므로 실패할 때만 처리 중 표시를 푼다
  const handleLogout = async () => {
    setIsPending(true);
    setErrorMessage(undefined);

    const result = await onLogout();

    if (!result.ok) {
      setIsPending(false);
      setErrorMessage(result.message ?? DEFAULT_ERROR_MESSAGE);
    }
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
      <p className="text-center text-body-sm-mobile break-keep text-text-secondary">
        {description}
      </p>

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
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </div>
    </BottomSheet>
  );
};
