import { useSearchParams } from 'react-router';

import { getReturnPath } from '@owner/hooks/usePointCharge';

import { ChargeResultLayout } from './ChargeResultLayout';

// 점주가 결제창에서 결제를 취소함
const USER_CANCELED_CODE = 'PAY_PROCESS_CANCELED';

// 결제창의 실패 주소. 결제 화면이 붙인 returnTo와 토스가 붙인 오류 코드(code)와 문구(message)를 받는다.
// 승인 확정 전에 끝났으므로 포인트는 충전되지 않았다. 다시 충전하면 새 주문을 만든다
export const PointChargeFail = () => {
  const [searchParams] = useSearchParams();
  const returnTo = getReturnPath(searchParams.get('returnTo'));
  const isCanceled = searchParams.get('code') === USER_CANCELED_CODE;
  // 토스 문구는 점주에게 바로 보여줄 수 있는 문장이다 (예: 결제 중 오류)
  const reason = searchParams.get('message');

  return (
    <ChargeResultLayout
      description={
        isCanceled || !reason
          ? '포인트는 충전되지 않았어요.'
          : `포인트는 충전되지 않았어요. (${reason})`
      }
      returnTo={returnTo}
      title={isCanceled ? '결제를 취소했어요' : '결제하지 못했어요'}
      tone="danger"
    />
  );
};
