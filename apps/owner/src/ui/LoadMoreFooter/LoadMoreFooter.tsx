import { Button } from '@repo/ui';

import { LoadMoreTrigger } from '@owner/ui/LoadMoreTrigger/LoadMoreTrigger';

// 이어서 불러오기 상태. 처음 불러오기와 따로 두어 실패해도 이미 불러온 목록은 그대로 둔다
export type LoadMoreStatus = 'idle' | 'loading' | 'error';

export interface LoadMoreFooterProps {
  // 다음 구간이 남았는지
  hasMore: boolean;
  status: LoadMoreStatus;
  onLoadMore: () => void;
  // 이어서 불러오는 동안 스크린 리더에 읽을 문구. 예: 포인트 내역을 더 불러오는 중
  loadingLabel: string;
  // 끝까지 불러왔을 때 보여줄 문구. 없으면 아무것도 두지 않는다
  endMessage?: string;
}

// 커서로 이어 불러오는 목록의 아래: 이어서 불러오는 중, 이어서 불러오기 실패, 끝까지 봤을 때
export const LoadMoreFooter = ({
  endMessage,
  hasMore,
  loadingLabel,
  onLoadMore,
  status,
}: LoadMoreFooterProps) => {
  if (status === 'loading') {
    return (
      <div className="flex justify-center py-4" role="status">
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-text-tertiary border-r-transparent motion-reduce:animate-none"
        />
        <span className="sr-only">{loadingLabel}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <p className="text-body-sm-mobile text-text-secondary" role="alert">
          불러오지 못했어요
        </p>
        <Button onClick={onLoadMore} variant="secondary">
          다시 시도
        </Button>
      </div>
    );
  }

  if (hasMore) {
    return <LoadMoreTrigger onLoadMore={onLoadMore} />;
  }

  return endMessage ? (
    <p className="py-4 text-center text-body-sm-mobile text-text-secondary">
      {endMessage}
    </p>
  ) : null;
};
