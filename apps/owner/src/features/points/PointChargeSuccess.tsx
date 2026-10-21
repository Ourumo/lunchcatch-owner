import { useSearchParams } from 'react-router';

import { getReturnPath } from '@owner/hooks/usePointCharge';
import { formatPoints } from '@owner/ui/campaignFormat';

import { ChargeResultLayout } from './ChargeResultLayout';
import {
  type ChargePaymentParams,
  useChargeConfirmation,
} from './useChargeConfirmation';

// 포인트 내역에서 충전을 확인하라는 안내. 결과를 확정하지 못했을 때 붙인다
const CHECK_HISTORY_MESSAGE =
  '결제가 완료됐다면 가게 관리 > 포인트 내역에 충전이 보여요.';

interface ConfirmationResultProps {
  params: ChargePaymentParams;
  returnTo: string;
}

const ConfirmationResult = ({ params, returnTo }: ConfirmationResultProps) => {
  const { retry, state } = useChargeConfirmation(params);

  switch (state.status) {
    case 'confirming':
      return (
        <ChargeResultLayout
          description="잠시만 기다려 주세요."
          returnTo={returnTo}
          title="결제를 확인하는 중이에요"
          tone="progress"
        />
      );
    case 'checking':
      return (
        <ChargeResultLayout
          description="결제 결과를 받는 중이에요. 확정되면 바로 알려 드릴게요."
          returnTo={returnTo}
          title="결제를 확인하고 있어요"
          tone="progress"
        />
      );
    case 'unresolved':
      return (
        <ChargeResultLayout
          action={{ label: '다시 확인', onClick: retry }}
          description={`결제 결과를 아직 받지 못했어요. 잠시 후 다시 확인해 주세요. ${CHECK_HISTORY_MESSAGE}`}
          returnTo={returnTo}
          title="결제를 확인하지 못했어요"
          tone="danger"
        />
      );
    case 'completed':
      return (
        <ChargeResultLayout
          description="충전한 포인트는 바로 쓸 수 있어요."
          returnLabel="확인"
          returnTo={returnTo}
          title="포인트를 충전했어요"
          tone="success"
        >
          <dl className="mt-8 flex w-full justify-between gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 text-left text-body-sm-mobile">
            <dt className="text-text-secondary">충전 포인트</dt>
            <dd className="font-bold text-text-primary">
              {formatPoints(state.chargedPoints)}
            </dd>
          </dl>
        </ChargeResultLayout>
      );
    case 'failed':
      return (
        <ChargeResultLayout
          description="결제가 완료되지 않아 포인트가 충전되지 않았어요. 다시 충전해 주세요."
          returnTo={returnTo}
          title="포인트가 충전되지 않았어요"
          tone="danger"
        />
      );
    case 'unverifiable':
      return (
        <ChargeResultLayout
          description={`결제 정보가 맞지 않아 충전을 확인할 수 없어요. ${CHECK_HISTORY_MESSAGE}`}
          returnTo={returnTo}
          title="결제를 확인할 수 없어요"
          tone="danger"
        />
      );
  }
};

// 결제창의 성공 주소. 결제 화면이 붙인 paymentId, returnTo와 토스가 붙인 orderId, paymentKey를 받는다
export const PointChargeSuccess = () => {
  const [searchParams] = useSearchParams();
  const returnTo = getReturnPath(searchParams.get('returnTo'));
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');

  if (!paymentId || !orderId || !paymentKey) {
    return (
      <ChargeResultLayout
        description={`결제 정보를 받지 못했어요. ${CHECK_HISTORY_MESSAGE}`}
        returnTo={returnTo}
        title="결제를 확인할 수 없어요"
        tone="danger"
      />
    );
  }

  return (
    <ConfirmationResult
      params={{ orderId, paymentId, paymentKey }}
      returnTo={returnTo}
    />
  );
};
