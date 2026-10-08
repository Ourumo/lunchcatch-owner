import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  type PointChargeResult,
  PointChargeSheet,
  type PointChargeSheetProps,
} from './PointChargeSheet';

const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

const chargeSuccess = async (): Promise<PointChargeResult> => {
  await wait();

  return { ok: true };
};

const chargeFailure = async (): Promise<PointChargeResult> => {
  await wait();

  return { ok: false, message: '결제가 취소되었습니다.' };
};

// 결제에 성공하면 시트가 닫히고 부른 쪽 잔액과 부족분이 바뀌도록 상태를 붙여 보여준다
const ChargeSheetExample = (props: PointChargeSheetProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [balance, setBalance] = useState(props.balance);
  const [shortage, setShortage] = useState(props.shortage);

  const handleCharge = async (amount: number) => {
    const result = await props.onCharge(amount);

    if (result.ok) {
      setBalance((prev) => (prev === undefined ? prev : prev + amount));
      setShortage((prev) =>
        prev === undefined ? prev : Math.max(0, prev - amount),
      );
    }

    return result;
  };

  return (
    <div className="p-4">
      <button onClick={() => setIsOpen(true)} type="button">
        충전 시트 열기
      </button>
      {balance !== undefined && <p>잔액 {balance.toLocaleString('ko-KR')}P</p>}
      {isOpen && (
        <PointChargeSheet
          {...props}
          balance={balance}
          onCharge={handleCharge}
          onClose={() => setIsOpen(false)}
          shortage={shortage}
        />
      )}
    </div>
  );
};

const meta = {
  title: 'Owner/PointChargeSheet',
  component: PointChargeSheet,
  args: {
    balance: 50000,
    minChargeAmount: 10000,
    onCharge: chargeSuccess,
    onClose: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => <ChargeSheetExample {...args} />,
} satisfies Meta<typeof PointChargeSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 캠페인 등록 중 포인트가 부족할 때. 부족분 11,500P를 1,000원 단위로 올려 첫 선택지로 미리 선택한다
export const WithShortage: Story = {
  args: {
    shortage: 11500,
  },
};

// 잔액을 넘겨받지 못하면 현재 잔액과 충전 후 잔액을 숨긴다
export const WithoutBalance: Story = {
  args: {
    balance: undefined,
  },
};

// 결제에 실패하면 시트를 연 채로 오류 문구를 보여준다
export const ChargeFailed: Story = {
  args: {
    onCharge: chargeFailure,
  },
};
