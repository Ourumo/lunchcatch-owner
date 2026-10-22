import { Button } from '@repo/ui';

import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';

interface StoreEditStatusProps {
  status: 'loading' | 'error';
  onRetry: () => void;
}

// 가게 관리의 수정·보기 화면에서 가게 정보를 불러오는 중이거나 불러오지 못했을 때의 화면
export const StoreEditStatus = ({ onRetry, status }: StoreEditStatusProps) => {
  if (status === 'loading') {
    return (
      <div aria-busy="true" className="flex flex-col gap-4 px-page py-6">
        <span className="sr-only">가게 정보를 불러오는 중</span>
        {[72, 72].map((height, index) => (
          <SkeletonBlock height={height} key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
      <p className="text-body-mobile font-bold text-text-primary">
        가게 정보를 불러오지 못했어요
      </p>
      <p className="text-body-sm-mobile text-text-secondary">
        잠시 후 다시 시도해 주세요
      </p>
      <Button className="mt-2" onClick={onRetry} variant="secondary">
        다시 시도
      </Button>
    </div>
  );
};
