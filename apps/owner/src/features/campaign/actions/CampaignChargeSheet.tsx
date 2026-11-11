import { useEffect, useState } from 'react';

import { getPointBalance } from '@owner/api/points';
import { useChargePolicy } from '@owner/hooks/useChargePolicy';
import { usePointCharge } from '@owner/hooks/usePointCharge';
import { PointChargeSheet } from '@owner/ui/PointChargeSheet/PointChargeSheet';

interface CampaignChargeSheetProps {
  dailyBudget: number | null;
  onClose: () => void;
}

// 잔액 부족으로 멈춘 캠페인의 충전 시트. 충전하면 서버가 그날 예약을 min(하루 예산, 잔액)으로 다시 잡아 캠페인이 다시 시작된다.
// 하루 예산에서 지금 잔액을 뺀 만큼을 부족분으로 넘겨, 오늘 하루 예산을 모두 채우는 금액을 미리 고른다.
// 잔액을 불러오지 못해도 충전할 수 있게 잔액 없이 연다(홈의 잔액 부족 경고와 같다). 열려 있을 때만 그려 열 때마다 잔액을 새로 부른다
export const CampaignChargeSheet = ({
  dailyBudget,
  onClose,
}: CampaignChargeSheetProps) => {
  const policy = useChargePolicy();
  const startCharge = usePointCharge();
  const [balance, setBalance] = useState<number>();

  useEffect(() => {
    let ignore = false;

    getPointBalance().then((result) => {
      if (!ignore && result.ok) {
        setBalance(result.data.balance);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <PointChargeSheet
      balance={balance}
      onCharge={startCharge}
      onClose={onClose}
      policy={policy}
      shortage={
        balance !== undefined && dailyBudget !== null
          ? dailyBudget - balance
          : undefined
      }
    />
  );
};
