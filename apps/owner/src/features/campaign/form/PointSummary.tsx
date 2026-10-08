import { type ReactNode, useState } from 'react';
import { Button } from '@repo/ui';
import { CircleCheck } from 'lucide-react';

import type { PointBalance } from '@owner/api/points';
import { formatPoints } from '@owner/components/campaignFormat';

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 text-body-sm-mobile">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="font-bold text-text-primary">{value}</dd>
  </div>
);

export interface PointSummaryProps {
  requiredPoints: number;
  balance: Loadable<PointBalance>;
}

// 필요 포인트(하루 예산 x 집행 일수)와 잔액을 비교한다. 하루 예산 단계와 확인 단계에서 함께 쓴다.
// 잔액이 모자라도 저장과 활성화는 막지 않고 부족분과 충전 버튼만 보여준다
export const PointSummary = ({
  balance,
  requiredPoints,
}: PointSummaryProps) => {
  const [isChargeNoticeVisible, setIsChargeNoticeVisible] = useState(false);
  const shortage = balance ? requiredPoints - balance.balance : 0;

  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
      <h3 className="text-body-sm-mobile font-bold text-text-primary">
        필요 포인트
      </h3>
      <dl className="mt-3 flex flex-col gap-2">
        <InfoRow
          label="하루 예산 × 집행 일수"
          value={formatPoints(requiredPoints)}
        />
        <InfoRow
          label="보유 잔액"
          value={
            balance === undefined
              ? '불러오는 중'
              : balance === null
                ? '조회 실패'
                : formatPoints(balance.balance)
          }
        />
      </dl>
      {balance && shortage > 0 && (
        <div className="mt-3 rounded-lg bg-status-danger-bg px-3 py-3">
          <p className="flex items-center justify-between gap-2 text-body-sm-mobile">
            <span className="font-medium text-status-danger-fg">
              부족한 포인트
            </span>
            <strong className="font-bold text-status-danger-fg">
              {formatPoints(shortage)}
            </strong>
          </p>
          <p className="mt-1 text-caption-mobile break-keep text-text-primary">
            잔액이 모자라도 저장할 수 있어요. 집행일 00:00에 잔액만큼만 예약돼
            노출되고, 잔액이 노출 단가보다 적으면 노출이 멈춰요.
          </p>
          <Button
            className="mt-2 w-full"
            onClick={() => setIsChargeNoticeVisible(true)}
            variant="secondary"
          >
            포인트 충전하기
          </Button>
          {isChargeNoticeVisible && (
            <p
              className="mt-2 text-center text-caption-mobile text-text-secondary"
              role="status"
            >
              포인트 충전 화면은 준비 중이에요.
            </p>
          )}
        </div>
      )}
      {balance && shortage <= 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-caption-mobile font-medium text-status-success-fg">
          <CircleCheck aria-hidden="true" className="size-3.5" />
          집행 기간 동안 쓸 포인트가 충분해요
        </p>
      )}
      {balance === null && (
        <p className="mt-3 text-caption-mobile text-text-secondary">
          잔액을 불러오지 못해 부족한 포인트를 계산하지 못했어요.
        </p>
      )}
    </section>
  );
};
