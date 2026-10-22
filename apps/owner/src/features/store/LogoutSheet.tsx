import { useState } from 'react';
import { BottomSheet, Button } from '@repo/ui';

import { logout } from '@owner/api/auth';

const DEFAULT_ERROR_MESSAGE =
  '로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.';

export interface LogoutSheetProps {
  // 로그아웃에 성공하면 부른다. 로그인 화면으로 보내는 일은 부른 쪽이 맡는다
  onLogout: () => void;
  onClose: () => void;
}

// 로그아웃을 한 번 더 확인하는 시트.
// 열 때마다 새로 그려 오류 문구를 초기화하므로 열려 있을 때만 렌더링한다
export const LogoutSheet = ({ onClose, onLogout }: LogoutSheetProps) => {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleLogout = async () => {
    setIsPending(true);
    setErrorMessage(undefined);

    const result = await logout();

    if (result.ok) {
      onLogout();
      return;
    }

    setIsPending(false);
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
      title="로그아웃할까요?"
    >
      <p className="text-center text-body-sm-mobile break-keep text-text-secondary">
        다시 이용하려면 이메일과 비밀번호로 로그인해야 해요.
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
