import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ImageValue } from '@owner/api/imageUpload';

import {
  StoreImagesFields,
  type StoreImagesFieldsProps,
} from './StoreImagesFields';

// 네트워크 없이 미리보기를 보여주기 위한 예시 사진
const createFile = (name: string, color: string) =>
  new File(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#ffd8c4"/><circle cx="200" cy="150" r="80" fill="${color}"/></svg>`,
    ],
    name,
    { type: 'image/svg+xml' },
  );

const createSampleImage = (name: string, color: string): ImageValue => ({
  status: 'selected',
  file: createFile(name, color),
});

// 이미 올라간 사진. 네트워크 없이 보이도록 data URL로 둔다
const createUploadedImage = (color: string): ImageValue => ({
  status: 'saved',
  url: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e7e5e4"/><rect x="120" y="90" width="160" height="120" rx="12" fill="${color}"/></svg>`,
  )}`,
});

// 고르거나 지우면 바로 반영되도록 상태를 붙여 보여준다
const ControlledFields = (props: StoreImagesFieldsProps) => {
  const [logoImage, setLogoImage] = useState(props.logoImage);
  const [interiorImages, setInteriorImages] = useState(props.interiorImages);

  return (
    <StoreImagesFields
      {...props}
      interiorImages={interiorImages}
      logoImage={logoImage}
      onInteriorImagesChange={setInteriorImages}
      onLogoRemove={props.onLogoRemove && (() => setLogoImage(null))}
      onLogoSelect={setLogoImage}
    />
  );
};

const meta = {
  title: 'Owner/StoreImagesFields',
  component: StoreImagesFields,
  args: {
    logoImage: null,
    interiorImages: [],
    maxInteriorImages: 3,
    onLogoSelect: () => {},
    onLogoRemove: () => {},
    onInteriorImagesChange: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  render: (args) => <ControlledFields {...args} />,
} satisfies Meta<typeof StoreImagesFields>;

export default meta;
type Story = StoryObj<typeof meta>;

// 입점 등록 처음 화면
export const Empty: Story = {};

// 입점 등록에서 새로 고른 사진. 대표 이미지도 지울 수 있다
export const WithFiles: Story = {
  args: {
    logoImage: createSampleImage('logo.svg', '#f56b20'),
    interiorImages: [
      createSampleImage('interior-1.svg', '#78716c'),
      createSampleImage('interior-2.svg', '#a8a29e'),
    ],
  },
};

// 입점 신청을 이어서 할 때: 이미 올라간 사진이 다 찬 상태. 대표 이미지는 바꾸기만 한다
export const Uploaded: Story = {
  args: {
    logoImage: createUploadedImage('#f56b20'),
    interiorImages: [
      createUploadedImage('#78716c'),
      createUploadedImage('#a8a29e'),
      createUploadedImage('#57534e'),
    ],
    onLogoRemove: undefined,
  },
};

// 사진마다 업로드 상태가 다른 상태: 올리는 중, 실패, 가게에 붙음
export const UploadStates: Story = {
  args: {
    logoImage: {
      status: 'uploading',
      file: createFile('logo.svg', '#f56b20'),
      progress: 70,
    },
    interiorImages: [
      { status: 'failed', file: createFile('interior-1.svg', '#78716c') },
      {
        status: 'uploading',
        file: createFile('interior-2.svg', '#a8a29e'),
        progress: 20,
      },
      {
        status: 'attached',
        file: createFile('interior-3.svg', '#57534e'),
      },
    ],
    onRetry: () => {},
  },
};

// 입점 신청을 이어서 할 때: 이미 올라간 사진과 새로 고른 사진이 섞인 상태
export const Mixed: Story = {
  args: {
    logoImage: createUploadedImage('#f56b20'),
    interiorImages: [
      createUploadedImage('#78716c'),
      createSampleImage('interior-new.svg', '#a8a29e'),
    ],
    onLogoRemove: undefined,
  },
};
