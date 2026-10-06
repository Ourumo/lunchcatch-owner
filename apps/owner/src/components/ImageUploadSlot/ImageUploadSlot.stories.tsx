import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ImageUploadSlot, type ImageUploadSlotProps } from './ImageUploadSlot';

// 네트워크 없이 미리보기를 보여주기 위한 예시 사진
const sampleImage = new File(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#ffd8c4"/><circle cx="200" cy="150" r="80" fill="#f56b20"/></svg>',
  ],
  'sample.svg',
  { type: 'image/svg+xml' },
);

// 고르거나 지우면 칸에 바로 반영되도록 상태를 붙여 보여준다
const ControlledImageUploadSlot = (props: ImageUploadSlotProps) => {
  const [image, setImage] = useState(props.image);

  return (
    <ImageUploadSlot
      {...props}
      image={image}
      onRemove={() => setImage(null)}
      onSelect={(files) => setImage(files[0] ?? null)}
    />
  );
};

const meta = {
  title: 'Owner/ImageUploadSlot',
  component: ImageUploadSlot,
  args: {
    className: 'aspect-[4/3]',
    image: null,
    label: '대표 이미지',
    onSelect: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  render: (args) => <ControlledImageUploadSlot {...args} />,
} satisfies Meta<typeof ImageUploadSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithImage: Story = {
  args: {
    image: sampleImage,
  },
};

export const WithError: Story = {
  args: {
    errorMessage: '최대 3장까지 등록할 수 있어요',
    label: '매장 이미지 추가',
    multiple: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    image: sampleImage,
  },
};
