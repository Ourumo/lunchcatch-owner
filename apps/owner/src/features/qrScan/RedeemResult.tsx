import { Button } from '@repo/ui';
import { Check, X } from 'lucide-react';

import type { RedeemedCoupon, RedeemFailureCode } from '@owner/api/redeem';
import type { ApiResult } from '@owner/api/types';

// 사장님이 계산대에서 손님에게 바로 말할 수 있는 문구로 쓴다
const failureContents: Record<
  RedeemFailureCode,
  { title: string; description: string }
> = {
  QR_EXPIRED: {
    title: 'QR이 만료됐어요',
    description: '손님 화면에서 QR을 새로 띄워 달라고 해 주세요.',
  },
  QR_ALREADY_USED: {
    title: '이미 사용된 QR이에요',
    description:
      'QR은 한 번만 쓸 수 있어요. 손님 화면에서 QR을 새로 띄워 달라고 해 주세요.',
  },
  COUPON_ALREADY_REDEEMED: {
    title: '이미 사용한 쿠폰이에요',
    description:
      '이 쿠폰은 사용 처리가 끝났어요. 같은 쿠폰은 한 번만 쓸 수 있어요.',
  },
  OTHER_STORE_COUPON: {
    title: '다른 가게 쿠폰이에요',
    description: '우리 가게에서 받은 쿠폰인지 손님께 확인해 주세요.',
  },
  OUTSIDE_USABLE_TIME: {
    title: '지금은 쓸 수 없는 쿠폰이에요',
    description: '쿠폰에 적힌 사용 가능 시간에만 쓸 수 있어요.',
  },
  INVALID_QR: {
    title: '쿠폰 QR이 아니에요',
    description: '손님 화면의 런치캐치 쿠폰 QR을 비춰 주세요.',
  },
};

// 사유 코드가 없거나 모르는 코드일 때 (서버 오류, 연결 끊김 등)
const unknownFailure = {
  title: '사용 처리하지 못했어요',
  description: '잠시 후 다시 스캔해 주세요.',
};

const getFailureContent = (code?: string) =>
  code && code in failureContents
    ? failureContents[code as RedeemFailureCode]
    : unknownFailure;

// 오후 12:34
const formatRedeemedTime = (redeemedAt: string) =>
  new Date(redeemedAt).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  });

interface RedeemResultProps {
  result: ApiResult<RedeemedCoupon>;
  // 다음 손님 스캔, 다시 스캔. 화면을 나가지 않고 바로 다시 읽는다
  onScanAgain: () => void;
}

// 사용 처리 결과. 계산대에서 한눈에 알 수 있게 크게 보여준다
export const RedeemResult = ({ onScanAgain, result }: RedeemResultProps) => {
  const content = result.ok
    ? {
        title: '사용 처리했어요',
        description: result.data.couponTitle,
      }
    : getFailureContent(result.code);

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
              {formatRedeemedTime(result.data.redeemedAt)} 사용 처리
            </p>
          )}
        </div>
        {/* 다음 손님을 바로 받도록 버튼에 초점을 둔다 */}
        <Button autoFocus className="mt-8 h-12 w-full" onClick={onScanAgain}>
          {result.ok ? '다음 손님 스캔' : '다시 스캔'}
        </Button>
      </section>
    </div>
  );
};
