import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  PointChargeSheet,
  type PointChargeSheetProps,
} from './PointChargeSheet';

// 충전하기를 누르면 결제 화면으로 가므로, 고른 금액만 보여주고 시트를 닫는다
const ChargeSheetExample = (props: PointChargeSheetProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [chargedAmount, setChargedAmount] = useState<number>();

  return (
    <div className="p-4">
      <button onClick={() => setIsOpen(true)} type="button">
        충전 시트 열기
      </button>
      {chargedAmount !== undefined && (
        <p>{chargedAmount.toLocaleString('ko-KR')}원 결제 화면으로 이동</p>
      )}
      {isOpen && (
        <PointChargeSheet
          {...props}
          onCharge={(amount) => {
            setChargedAmount(amount);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
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
    onCharge: () => undefined,
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

// 충전 정책을 불러오는 동안. 금액을 고를 수 없어 충전 버튼을 막는다
export const PolicyLoading: Story = {
  args: {
    policy: { status: 'loading' },
  },
};

// 충전 정책을 불러오지 못했을 때. 다시 시도할 수 있고 충전 버튼은 막는다
export const PolicyFailed: Story = {
  args: {
    policy: { status: 'error', onRetry: () => undefined },
  },
};
