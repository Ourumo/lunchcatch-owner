import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BottomSheet } from './BottomSheet';

const meta = {
  title: 'Shared/BottomSheet',
  component: BottomSheet,
  args: {
    children: null,
    isOpen: true,
    onClose: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

function BottomSheetExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <button onClick={() => setIsOpen(true)} type="button">
        바텀시트 열기
      </button>
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="쿠폰 사용 안내"
      >
        쿠폰은 결제 화면에서 선택하여 사용할 수 있습니다.
      </BottomSheet>
    </div>
  );
}

export const Default: Story = {
  render: () => <BottomSheetExample />,
};

export const Opened: Story = {
  args: {
    children: '쿠폰은 결제 화면에서 선택하여 사용할 수 있습니다.',
    title: '쿠폰 사용 안내',
  },
};
