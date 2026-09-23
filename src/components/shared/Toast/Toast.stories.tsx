import type { Meta, StoryObj } from '@storybook/react-vite';

import { Toast } from './Toast';

const meta = {
  title: 'Shared/Toast',
  component: Toast,
  args: {
    description: '변경사항이 정상 반영되었습니다.',
    onClose: () => undefined,
    title: '저장되었습니다',
    variant: 'success',
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Info: Story = {
  args: {
    description: '새로운 정보를 확인해 주세요.',
    title: '안내',
    variant: 'info',
  },
};

export const Warning: Story = {
  args: {
    description: '입력 내용을 다시 확인해 주세요.',
    title: '확인이 필요합니다',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    description: '잠시 후 다시 시도해 주세요.',
    title: '처리하지 못했습니다',
    variant: 'danger',
  },
};
