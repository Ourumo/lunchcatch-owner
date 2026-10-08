import { useState } from 'react';
import { BottomSheet, Button, ChoiceChip } from '@repo/ui';

// 결제 결과. 잔액은 부른 쪽이 결제 함수 안에서 받아 갱신한다
export type PointChargeResult = { ok: true } | { ok: false; message?: string };

export interface PointChargeSheetProps {
  // 충전 전 잔액. 없으면 현재 잔액과 충전 후 잔액을 숨긴다
  balance?: number;
  // 최소 충전 금액(원). 안내 문구에 쓴다
  minChargeAmount: number;
  // 결제 함수. 성공하면 시트를 닫고, 실패하면 시트 안에 오류 문구를 보여준다
  onCharge: (amount: number) => Promise<PointChargeResult>;
  onClose: () => void;
}

const CHARGE_AMOUNT_OPTIONS = [10000, 30000, 50000, 100000];

const DEFAULT_ERROR_MESSAGE = '결제하지 못했어요. 다시 시도해 주세요.';

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

// 포인트 충전 바텀시트. 홈, 가게 관리, 캠페인 등록에서 함께 쓴다.
// 실제 결제는 결제대행사 화면을 거칠 수 있어 시트는 금액 선택까지 맡고 결제는 넘겨받은 함수에 맡긴다.
// 열 때마다 새로 그려 선택값과 오류 문구를 초기화하므로 열려 있을 때만 렌더링한다
export const PointChargeSheet = ({
  balance,
  minChargeAmount,
  onCharge,
  onClose,
}: PointChargeSheetProps) => {
  const [amount, setAmount] = useState(CHARGE_AMOUNT_OPTIONS[0]);
  const [isCharging, setIsCharging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleCharge = async () => {
    setIsCharging(true);
    setErrorMessage(undefined);

    const result = await onCharge(amount);

    setIsCharging(false);

    if (result.ok) {
      onClose();
      return;
    }

    setErrorMessage(result.message ?? DEFAULT_ERROR_MESSAGE);
  };

  return (
    // 결제 중에는 배경, 드래그, Esc로 닫지 않는다
    <BottomSheet
      closeOnBackdrop={!isCharging}
      isOpen
      onClose={() => {
        if (!isCharging) {
          onClose();
        }
      }}
      title="포인트 충전"
    >
      <fieldset>
        <legend className="sr-only">충전 금액</legend>
        {/* 360px 폭에서도 금액이 잘리지 않도록 두 줄로 나눈다 */}
        <div className="grid grid-cols-2 gap-2">
          {CHARGE_AMOUNT_OPTIONS.map((option) => (
            <ChoiceChip
              checked={amount === option}
              disabled={isCharging}
              key={option}
              name="point-charge-amount"
              onChange={() => {
                setAmount(option);
                setErrorMessage(undefined);
              }}
              value={option}
            >
              {formatNumber(option)}P
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      {balance !== undefined && (
        <dl className="mt-5 flex flex-col gap-2 rounded-xl border border-border-subtle bg-bg-surface p-4 type-body-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">현재 잔액</dt>
            <dd>{formatNumber(balance)}P</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">충전 후 잔액</dt>
            <dd className="font-semibold">{formatNumber(balance + amount)}P</dd>
          </div>
        </dl>
      )}

      <ul className="mt-3 flex flex-col gap-1 type-caption text-text-secondary">
        <li>1원 = 1포인트로 충전돼요.</li>
        <li>최소 {formatNumber(minChargeAmount)}원부터 충전할 수 있어요.</li>
      </ul>

      {errorMessage && (
        <p className="mt-3 type-body-sm text-status-danger-fg" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        className="mt-5 h-12 w-full"
        isLoading={isCharging}
        onClick={handleCharge}
      >
        {formatNumber(amount)}원 결제하기
      </Button>
    </BottomSheet>
  );
};
