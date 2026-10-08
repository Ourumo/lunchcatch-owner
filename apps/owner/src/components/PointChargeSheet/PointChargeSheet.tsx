import { useState } from 'react';
import { BottomSheet, Button, ChoiceChip } from '@repo/ui';

// 결제 결과. 잔액은 부른 쪽이 결제 함수 안에서 받아 갱신한다
export type PointChargeResult = { ok: true } | { ok: false; message?: string };

export interface PointChargeSheetProps {
  // 충전 전 잔액. 없으면 현재 잔액과 충전 후 잔액을 숨긴다
  balance?: number;
  // 최소 충전 금액(원). 안내 문구와 부족분 선택지 금액에 쓴다
  minChargeAmount: number;
  // 부족한 포인트. 넘겨받으면 부족분을 첫 선택지로 두고 미리 선택한다 (캠페인 등록)
  shortage?: number;
  // 결제 함수. 성공하면 시트를 닫고, 실패하면 시트 안에 오류 문구를 보여준다
  onCharge: (amount: number) => Promise<PointChargeResult>;
  onClose: () => void;
}

interface ChargeOption {
  amount: number;
  isShortage: boolean;
}

const CHARGE_AMOUNTS = [10000, 30000, 50000, 100000];

// 부족분은 1,000원 단위로 올림한다
const SHORTAGE_UNIT = 1000;

const DEFAULT_ERROR_MESSAGE = '결제하지 못했어요. 다시 시도해 주세요.';

const formatNumber = (value: number) => value.toLocaleString('ko-KR');

// 부족분이 있으면 맨 앞에 둔다. 최소 충전 금액보다 작으면 최소 금액으로 맞추고,
// 기본 선택지와 금액이 같으면 같은 금액이 두 번 보이지 않도록 기본 선택지를 뺀다
const getChargeOptions = (
  minChargeAmount: number,
  shortage?: number,
): ChargeOption[] => {
  const presets = CHARGE_AMOUNTS.map((amount) => ({
    amount,
    isShortage: false,
  }));

  if (!shortage || shortage <= 0) {
    return presets;
  }

  const shortageAmount = Math.max(
    minChargeAmount,
    Math.ceil(shortage / SHORTAGE_UNIT) * SHORTAGE_UNIT,
  );

  return [
    { amount: shortageAmount, isShortage: true },
    ...presets.filter((option) => option.amount !== shortageAmount),
  ];
};

// 포인트 충전 바텀시트. 홈, 가게 관리, 캠페인 등록에서 함께 쓴다.
// 실제 결제는 결제대행사 화면을 거칠 수 있어 시트는 금액 선택까지 맡고 결제는 넘겨받은 함수에 맡긴다.
// 열 때마다 새로 그려 선택값과 오류 문구를 초기화하므로 열려 있을 때만 렌더링한다
export const PointChargeSheet = ({
  balance,
  minChargeAmount,
  onCharge,
  onClose,
  shortage,
}: PointChargeSheetProps) => {
  const options = getChargeOptions(minChargeAmount, shortage);
  const [amount, setAmount] = useState(options[0].amount);
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
        {/* 360px 폭에서도 금액이 잘리지 않도록 두 줄로 나누고, 부족분은 한 줄을 다 쓴다 */}
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <ChoiceChip
              checked={amount === option.amount}
              className={option.isShortage ? 'col-span-2' : undefined}
              disabled={isCharging}
              key={option.amount}
              name="point-charge-amount"
              onChange={() => {
                setAmount(option.amount);
                setErrorMessage(undefined);
              }}
              value={option.amount}
            >
              {option.isShortage && '부족분 '}
              {formatNumber(option.amount)}P
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
