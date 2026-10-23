import { useEffect, useState } from 'react';

import {
  type BudgetStepValues,
  isBudgetStepComplete,
} from '@owner/api/campaign';
import type { PlatformSettings } from '@owner/api/platform';
import { getPointBalance, type PointBalance } from '@owner/api/points';
import { formatPoints, getPeriodDays } from '@owner/ui/campaignFormat';

// 불러오는 중이면 undefined, 실패하면 null
export type BalanceLoadable = PointBalance | null | undefined;

// 확인 단계 화면(Outlet)에 넘기는 값. 레이아웃이 불러온 잔액을 확인 단계가 그대로 보여준다
export interface ReviewOutletContext {
  balance: BalanceLoadable;
  retryBalance: () => void;
}

// 활성화하는 동안 쓸 포인트(하루 예산 x 집행 일수). 하루 예산과 집행 기간을 다 채우지 않았으면 null
export const getRequiredPoints = (
  budget: BudgetStepValues,
  settings: PlatformSettings,
) =>
  isBudgetStepComplete(budget, settings) && budget.dailyBudget !== null
    ? budget.dailyBudget * getPeriodDays(budget.startDate, budget.endDate)
    : null;

// 잔액 때문에 활성화를 요청할 수 없으면 그 이유를, 요청할 수 있으면 null을 돌려준다.
// 서버는 잔액을 검사하지 않아, 잔액을 모르거나(불러오는 중, 실패) 필요 포인트보다 적으면 화면에서 막는다
export const getBalanceBlockReason = (
  balance: BalanceLoadable,
  requiredPoints: number,
) => {
  if (balance === undefined) {
    return '잔액을 확인하는 중이에요';
  }

  if (balance === null) {
    return '잔액을 확인하지 못해 활성화할 수 없어요';
  }

  const shortage = requiredPoints - balance.balance;

  return shortage > 0
    ? `포인트가 ${formatPoints(shortage)} 부족해요. 충전하면 활성화할 수 있어요`
    : null;
};

// 확인 단계에 들어올 때마다 잔액을 새로 불러온다. 충전하러 다녀오면 새 기록 항목이 되어 다시 불러온다.
// 불러온 결과는 어느 요청의 결과인지(requestKey) 함께 두어, 다른 요청의 결과면 불러오는 중으로 본다
export const useReviewBalance = (isReview: boolean, locationKey: string) => {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<{
    requestKey: string;
    balance: PointBalance | null;
  }>();
  const requestKey = `${locationKey}:${retryCount}`;

  useEffect(() => {
    if (!isReview) {
      return;
    }

    let ignore = false;

    getPointBalance().then((balanceResult) => {
      if (!ignore) {
        setResult({
          requestKey,
          balance: balanceResult.ok ? balanceResult.data : null,
        });
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [isReview, requestKey]);

  return {
    balance: result?.requestKey === requestKey ? result.balance : undefined,
    retryBalance: () => setRetryCount((count) => count + 1),
  };
};
