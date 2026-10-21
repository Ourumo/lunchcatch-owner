import type { ReactNode } from 'react';

import type { MyStore } from '@owner/api/store';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { StoreEditStatus } from './StoreEditStatus';
import type { StoreView } from './useStoreView';

interface StoreViewLayoutProps {
  title: string;
  view: StoreView;
  // 불러온 뒤에만 그린다
  children: (store: MyStore) => ReactNode;
}

// 매장 사진, 대표 메뉴 보기 화면의 틀. 상단 바, 바꿀 수 없다는 안내, 내용으로 이루어진다.
// 입점 신청을 마친(ACTIVE) 가게는 사진과 메뉴를 바꾸지 않아 저장 버튼이 없다
export const StoreViewLayout = ({
  children,
  title,
  view,
}: StoreViewLayoutProps) => {
  const { goBack, retry, state } = view;

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={goBack} title={title} />
      </div>

      <main className="flex flex-1 flex-col">
        {state.status === 'success' ? (
          <div className="flex flex-col gap-6 px-page pt-6 pb-8">
            <p className="rounded-xl bg-surface-subtle px-4 py-3 text-body-sm-mobile break-keep text-text-secondary">
              입점 신청 때 등록한 사진과 메뉴는 바꿀 수 없어요
            </p>
            {children(state.store)}
          </div>
        ) : (
          <StoreEditStatus onRetry={retry} status={state.status} />
        )}
      </main>
    </>
  );
};
