import type { ReactNode } from 'react';
import { Button } from '@repo/ui';

export interface StatusMessageProps {
  title: string;
  description: string;
  // 있으면 "다시 시도" 버튼을 둔다. 다시 시도해도 같은 안내(빈 목록, 권한 없음)면 넘기지 않는다
  onRetry?: () => void;
  // 다시 시도 옆에 둘 버튼이나 링크
  action?: ReactNode;
  // 화면의 남은 높이를 채워 가운데에 둔다. 없으면 목록 자리에 위아래 여백을 두고 보여준다
  fill?: boolean;
}

// 불러오지 못했을 때와 보여줄 내용이 없을 때의 안내. 제목, 설명, 버튼을 가운데에 둔다
export const StatusMessage = ({
  action,
  description,
  fill = false,
  onRetry,
  title,
}: StatusMessageProps) => (
  <div
    className={`flex flex-col items-center gap-3 px-page text-center ${fill ? 'flex-1 justify-center pb-16' : 'py-12'}`}
  >
    <p className="text-body-mobile font-bold text-text-primary">{title}</p>
    <p className="text-body-sm-mobile break-keep text-text-secondary">
      {description}
    </p>
    {(onRetry || action) && (
      <div className="mt-2 flex gap-2">
        {onRetry && (
          <Button onClick={onRetry} variant="secondary">
            다시 시도
          </Button>
        )}
        {action}
      </div>
    )}
  </div>
);
