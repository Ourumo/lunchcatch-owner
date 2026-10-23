import { type ReactNode, useState } from 'react';
import { Button } from '@repo/ui';
import { CircleCheck, RotateCw } from 'lucide-react';

import type { PointBalance } from '@owner/api/points';
import { useChargePolicy } from '@owner/hooks/useChargePolicy';
import { usePointCharge } from '@owner/hooks/usePointCharge';
import { formatPoints } from '@owner/ui/campaignFormat';
import { PointChargeSheet } from '@owner/ui/PointChargeSheet/PointChargeSheet';

import { saveCampaignDraft } from './campaignDraftStorage';
import { useCampaignForm } from './useCampaignForm';

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 text-body-sm-mobile">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="font-bold text-text-primary">{value}</dd>
  </div>
);

// 잔액이 모자랄 때의 안내. 하루 예산 단계는 저장은 되고, 확인 단계는 충전해야 활성화를 요청할 수 있다
const shortageNotices = {
  budget:
    '잔액이 모자라도 저장할 수 있어요. 활성화를 요청하기 전에 충전해 주세요.',
  review: '충전하면 활성화를 요청할 수 있어요.',
};

export interface PointSummaryProps {
  requiredPoints: number;
  balance: Loadable<PointBalance>;
  // 어느 단계에서 보여주는지. 잔액이 모자랄 때의 안내가 다르다
  step: keyof typeof shortageNotices;
  // 잔액을 불러오지 못했을 때 다시 부른다
  onRetry: () => void;
}

// 필요 포인트(하루 예산 x 집행 일수)와 잔액을 비교한다. 하루 예산 단계와 확인 단계에서 함께 쓴다.
// 잔액이 모자라면 부족분과 충전 버튼을 보여준다. 저장은 막지 않고, 활성화 요청은 확인 단계 레이아웃이 막는다.
// 충전은 결제 화면을 거쳐 이 단계로 돌아온다. 떠나기 전에 작성 중인 값을 저장해 두고,
// 돌아오면 그 값으로 이어 쓰며 잔액을 다시 불러와 부족분을 다시 계산한다
export const PointSummary = ({
  balance,
  onRetry,
  requiredPoints,
  step,
}: PointSummaryProps) => {
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const chargePolicy = useChargePolicy();
  const startCharge = usePointCharge();
  const { campaignId, values } = useCampaignForm();
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
            {shortageNotices[step]}
          </p>
          <Button
            className="mt-2 w-full"
            onClick={() => setIsChargeOpen(true)}
            variant="secondary"
          >
            포인트 충전하기
          </Button>
        </div>
      )}
      {balance && shortage <= 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-caption-mobile font-medium text-status-success-fg">
          <CircleCheck aria-hidden="true" className="size-3.5" />
          집행 기간 동안 쓸 포인트가 충분해요
        </p>
      )}
      {balance === null && (
        // 누르는 영역은 높이 44px로 두되 줄 높이가 커지지 않도록 바깥 여백을 당긴다
        <div
          className="mt-1 -mb-2 flex items-center justify-between gap-2"
          role="status"
        >
          <span className="text-caption-mobile text-text-secondary">
            잔액을 불러오지 못했어요
          </span>
          <button
            className="flex h-11 shrink-0 items-center gap-1 rounded-full px-2 text-caption-mobile font-semibold text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
            onClick={onRetry}
            type="button"
          >
            <RotateCw aria-hidden="true" className="size-3.5" />
            다시 시도
          </button>
        </div>
      )}
      {balance && isChargeOpen && (
        <PointChargeSheet
          balance={balance.balance}
          policy={chargePolicy}
          onCharge={(amount) => {
            saveCampaignDraft(campaignId, values);
            startCharge(amount);
          }}
          onClose={() => setIsChargeOpen(false)}
          shortage={shortage}
        />
      )}
    </section>
  );
};
