import type { ReactNode } from 'react';
import { BottomSheet, Button } from '@repo/ui';

import { StepActionBar } from '@owner/components/StepActionBar/StepActionBar';
import { TopBar } from '@owner/components/TopBar/TopBar';

import { StoreEditStatus } from './StoreEditStatus';
import type { StoreEdit } from './useStoreEdit';

interface LeaveEditSheetProps {
  onStay: () => void;
  onLeave: () => void;
}

// 바꾼 내용을 저장하지 않고 나가려 할 때 한 번 더 묻는다
const LeaveEditSheet = ({ onLeave, onStay }: LeaveEditSheetProps) => (
  <BottomSheet isOpen onClose={onStay} title="저장하지 않고 나갈까요?">
    <p className="text-center text-body-sm-mobile break-keep text-text-secondary">
      바꾼 내용은 저장되지 않아요.
    </p>
    <div className="mt-5 flex gap-2">
      <Button className="h-12 flex-1" onClick={onStay} variant="neutral">
        계속 수정
      </Button>
      <Button className="h-12 flex-1" onClick={onLeave}>
        나가기
      </Button>
    </div>
  </BottomSheet>
);

interface StoreEditLayoutProps<T> {
  title: string;
  edit: StoreEdit<T>;
  // 불러온 뒤에만 그린다
  children: ReactNode;
}

// 영업시간, 매장 사진, 대표 메뉴 수정 화면의 틀. 상단 바, 입력 내용, 저장 실패 문구, 하단 저장 버튼으로 이루어진다
export const StoreEditLayout = <T,>({
  children,
  edit,
  title,
}: StoreEditLayoutProps<T>) => {
  const { blocker, canSave, goBack, handleSave, isSaving, retry, saveError } =
    edit;

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={goBack} title={title} />
      </div>

      <main className="flex flex-1 flex-col">
        {edit.status === 'success' ? (
          <>
            {children}
            {/* 내용이 짧아도 저장 버튼 바로 위에 붙도록 아래로 민다 */}
            {saveError && (
              <p
                className="mt-auto px-page pb-3 text-center text-body-sm-mobile text-status-danger-fg"
                role="alert"
              >
                {saveError}
              </p>
            )}
          </>
        ) : (
          <StoreEditStatus onRetry={retry} status={edit.status} />
        )}
      </main>

      {edit.status === 'success' && (
        <StepActionBar
          isNextDisabled={!canSave}
          isNextLoading={isSaving}
          nextLabel="저장"
          onNext={handleSave}
        />
      )}

      {blocker.state === 'blocked' && (
        <LeaveEditSheet onLeave={blocker.proceed} onStay={blocker.reset} />
      )}
    </>
  );
};
