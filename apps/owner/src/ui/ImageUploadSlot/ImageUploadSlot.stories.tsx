import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ImageValue } from '@owner/api/imageUpload';

import { ImageUploadSlot, type ImageUploadSlotProps } from './ImageUploadSlot';

// 네트워크 없이 미리보기를 보여주기 위한 예시 사진
const sampleFile = new File(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#ffd8c4"/><circle cx="200" cy="150" r="80" fill="#f56b20"/></svg>',
  ],
  'sample.svg',
  { type: 'image/svg+xml' },
);

const sampleImage: ImageValue = { status: 'selected', file: sampleFile };

// 이미 올라간 사진. 네트워크 없이 보이도록 data URL로 둔다
const uploadedImage: ImageValue = {
  status: 'saved',
  url: `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e7e5e4"/><rect x="120" y="90" width="160" height="120" rx="12" fill="#78716c"/></svg>',
  )}`,
};

// 고르거나 지우면 칸에 바로 반영되도록 상태를 붙여 보여준다
const ControlledImageUploadSlot = (props: ImageUploadSlotProps) => {
  const [image, setImage] = useState(props.image);

  return (
    <ImageUploadSlot
      {...props}
      image={image}
      onRemove={() => setImage(null)}
      onSelect={([file]) =>
        setImage(file ? { status: 'selected', file } : null)
      }
    />
  );
};

const meta = {
  title: 'Owner/ImageUploadSlot',
  component: ImageUploadSlot,
  args: {
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

// 가게 정보 수정에서 이미 올라간 사진을 주소로 보여준다. 누르면 새로 고른 파일로 바뀐다
export const Uploaded: Story = {
  args: {
    image: uploadedImage,
  },
};

// 올리기 시작한 매장 사진처럼 바꾸거나 지울 수 없는 칸. onSelect 없이 사진만 보여준다
export const ReadOnly: Story = {
  args: {
    image: uploadedImage,
    label: '매장 이미지 1',
    onSelect: undefined,
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 114 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <ImageUploadSlot {...args} />,
};

// 사진을 고르자마자 S3에 올리는 중. 진행률을 보여준다
export const Uploading: Story = {
  args: {
    image: { status: 'uploading', file: sampleFile, progress: 45 },
    onRemove: () => {},
  },
};

// 올리지 못한 사진. 다시 시도를 누르면 처음부터 다시 올린다
export const Failed: Story = {
  args: {
    image: { status: 'failed', file: sampleFile },
    onRemove: () => {},
    onRetry: () => {},
  },
};

// 매장 이미지처럼 3칸 그리드 한 칸 크기에서 실패한 사진
export const SmallFailed: Story = {
  args: {
    image: { status: 'failed', file: sampleFile },
    label: '매장 이미지 1',
    onRemove: () => {},
    onRetry: () => {},
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 114 }}>
        <Story />
      </div>
    ),
  ],
};

// 매장 이미지처럼 3칸 그리드 한 칸 크기
export const Small: Story = {
  args: {
    label: '매장 이미지 추가',
    size: 'sm',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 114 }}>
        <Story />
      </div>
    ),
  ],
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
