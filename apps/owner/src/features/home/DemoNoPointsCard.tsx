import { useState } from 'react';
import { Button } from '@repo/ui';

import { startNoPointsDemo } from '@owner/api/demo';

// 목 모드(VITE_USE_MOCK=true) 전용 시연 버튼. 잔액 부족으로 캠페인이 멈추는 일은 00:00 예약에서 생겨
// 시연 중에는 저절로 볼 수 없으므로, 버튼을 누르면 목 서버가 그 상황의 시연 데이터로 바꾼다 (src/mocks/noPoints.ts)
export const isDemoNoPointsEnabled = import.meta.env.VITE_USE_MOCK === 'true';

interface DemoNoPointsCardProps {
  // 바꾼 뒤 홈 화면을 다시 불러온다
  onChanged: () => void;
}

export const DemoNoPointsCard = ({ onChanged }: DemoNoPointsCardProps) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'error'>('idle');

  const start = async () => {
    setStatus('pending');

    const result = await startNoPointsDemo();

    if (result.ok) {
      setStatus('idle');
      onChanged();
    } else {
      setStatus('error');
    }
  };

  return (
    <section
      aria-labelledby="demo-no-points-title"
      className="flex flex-col gap-2 rounded-xl border border-dashed border-border-subtle p-4"
    >
      <h2
        className="text-caption-mobile font-bold text-text-secondary"
        id="demo-no-points-title"
      >
        시연용
      </h2>
      <p className="text-body-sm-mobile break-keep text-text-secondary">
        포인트가 바닥나 캠페인이 멈춘 상황을 볼 수 있어요. 이 탭에서 바꾼 내용은
        처음 상태로 돌아가요.
      </p>
      <Button
        className="h-11"
        disabled={status === 'pending'}
        onClick={start}
        variant="neutral"
      >
        {status === 'pending' ? '바꾸는 중' : '잔액 부족 상황 보기'}
      </Button>
      {status === 'error' && (
        <p className="text-caption-mobile text-status-danger-fg" role="alert">
          바꾸지 못했어요. 다시 시도해 주세요
        </p>
      )}
    </section>
  );
};
