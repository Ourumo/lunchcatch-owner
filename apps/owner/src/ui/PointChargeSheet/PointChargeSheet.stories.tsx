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
    onCharge: chargeSuccess,
    onClose: () => undefined,
    policy: {
      status: 'success',
      minChargeAmount: 10000,
      chargeAmounts: [10000, 30000, 50000, 100000],
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => <ChargeSheetExample {...args} />,
} satisfies Meta<typeof PointChargeSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 캠페인 등록 중 포인트가 부족할 때. 부족분 18,500P 이상인 가장 작은 충전 상품 30,000P를 미리 선택한다
export const WithShortage: Story = {
  args: {
    shortage: 18500,
  },
};

// 부족분이 가장 큰 충전 상품보다 클 때. 가장 큰 금액을 미리 선택하고 한 번 더 충전해야 한다고 알린다
export const ShortageOverMaxProduct: Story = {
  args: {
    shortage: 130000,
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

// 충전 정책을 불러오는 동안. 금액을 고를 수 없어 결제 버튼을 막는다
export const PolicyLoading: Story = {
  args: {
    policy: { status: 'loading' },
  },
};

// 충전 정책을 불러오지 못했을 때. 다시 시도할 수 있고 결제 버튼은 막는다
export const PolicyFailed: Story = {
  args: {
    policy: { status: 'error', onRetry: () => undefined },
  },
};
