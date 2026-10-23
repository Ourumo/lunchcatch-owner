import { Button } from '@repo/ui';
import { Check, X } from 'lucide-react';

import type { RedeemedCoupon, RedeemFailureCode } from '@owner/api/redeem';
import type { ApiResult } from '@owner/api/types';
import { formatNumber } from '@owner/ui/campaignFormat';

// 사장님이 계산대에서 손님에게 바로 말할 수 있는 문구로 쓴다
const failureContents: Record<
  RedeemFailureCode,
  { title: string; description: string }
> = {
  QR_EXPIRED: {
    title: 'QR이 만료됐거나 쓸 수 없어요',
    description: '손님 화면에서 QR을 새로 띄워 달라고 해 주세요.',
  },
  INVALID_QR: {
    title: '쿠폰 QR이 아니에요',
    description: '손님 화면의 런치캐치 쿠폰 QR을 비춰 주세요.',
  },
  INVALID_LOCATION: {
    title: '가게 위치를 확인하지 못했어요',
    description: '가게 위치를 다시 불러와 시도해 주세요.',
  },
  NETWORK: {
    title: '사용 처리 결과를 받지 못했어요',
    description:
      '다시 시도해 주세요. 이미 처리됐다면 이미 사용한 쿠폰으로 나와요.',
  },
};

// 손님이 QR을 다시 띄우지 않아도 같은 QR로 다시 보낼 수 있는 실패. 위치 오류는 가게 위치를 다시 불러와 보낸다
const isRetryable = (code?: string) =>
  code === 'NETWORK' || code === 'INVALID_LOCATION';

// 서버가 사유 코드 없이 거절하면(이미 사용한 쿠폰, 다른 가게 쿠폰 등) 서버 문구를 보여준다
const getFailureContent = (code?: string, message?: string) => {
  if (code && code in failureContents) {
    return failureContents[code as RedeemFailureCode];
  }

  return {
    title: '사용 처리하지 못했어요',
    description: message ?? '잠시 후 다시 스캔해 주세요.',
  };
};

// 오후 12:34. 가게 시각으로 보여준다
const formatUsedTime = (usedAt: string) =>
  new Date(usedAt).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  });

interface RedeemResultProps {
  result: ApiResult<RedeemedCoupon>;
  // 다음 손님 스캔, 다시 스캔. 화면을 나가지 않고 바로 다시 읽는다
  onScanAgain: () => void;
  // 같은 QR로 다시 보낸다
  onRetry: () => void;
}

// 사용 처리 결과. 계산대에서 한눈에 알 수 있게 크게 보여준다
export const RedeemResult = ({
  onRetry,
  onScanAgain,
  result,
}: RedeemResultProps) => {
  const canRetry = !result.ok && isRetryable(result.code);
  const content = result.ok
    ? {
        title: '사용 처리했어요',
        description: `${formatNumber(result.data.discountAmount)}원 할인`,
      }
    : getFailureContent(result.code, result.message);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-inverse/70 px-page">
      <section
        aria-labelledby="redeem-result-title"
        className="flex w-full flex-col items-center rounded-2xl bg-bg-surface px-5 pt-8 pb-5 text-center text-text-primary"
      >
        <span
          aria-hidden="true"
          className={`flex size-20 items-center justify-center rounded-full ${
            result.ok
              ? 'bg-status-success-bg text-status-success-fg'
              : 'bg-status-danger-bg text-status-danger-fg'
          }`}
        >
          {result.ok ? (
            <Check className="size-12" strokeWidth={3} />
          ) : (
            <X className="size-12" strokeWidth={3} />
          )}
        </span>
        {/* 결과가 나오면 화면 읽기 프로그램이 바로 읽는다 */}
        <div role={result.ok ? 'status' : 'alert'}>
          <h2
            className="mt-5 text-h2-mobile font-bold"
            id="redeem-result-title"
          >
            {content.title}
          </h2>
          <p
            className={`mt-2 break-keep ${
              result.ok
                ? 'text-h3-mobile font-bold'
                : 'text-body-mobile text-text-secondary'
            }`}
          >
            {content.description}
          </p>
          {result.ok && (
            <p className="mt-1 text-body-sm-mobile text-text-secondary">
              {formatUsedTime(result.data.usedAt)} 사용 처리
            </p>
          )}
        </div>
        {/* 다음 손님을 바로 받거나 바로 다시 시도하도록 주 버튼에 초점을 둔다 */}
        {canRetry ? (
          <div className="mt-8 flex w-full gap-2">
            <Button
              className="h-12 flex-1"
              onClick={onScanAgain}
              variant="neutral"
            >
              다시 스캔
            </Button>
            <Button autoFocus className="h-12 flex-1" onClick={onRetry}>
              다시 시도
            </Button>
          </div>
        ) : (
          <Button autoFocus className="mt-8 h-12 w-full" onClick={onScanAgain}>
            {result.ok ? '다음 손님 스캔' : '다시 스캔'}
          </Button>
        )}
      </section>
    </div>
  );
};
