import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  StoreImagesFields,
  type StoreImagesFieldsProps,
} from './StoreImagesFields';

// 네트워크 없이 미리보기를 보여주기 위한 예시 사진
const createSampleFile = (name: string, color: string) =>
  new File(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#ffd8c4"/><circle cx="200" cy="150" r="80" fill="${color}"/></svg>`,
    ],
    name,
    { type: 'image/svg+xml' },
  );

// 이미 올라간 사진 주소. 네트워크 없이 보이도록 data URL로 둔다
const createUploadedUrl = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e7e5e4"/><rect x="120" y="90" width="160" height="120" rx="12" fill="${color}"/></svg>`,
  )}`;

type StoryImage = File | string;

// 고르거나 지우면 바로 반영되도록 상태를 붙여 보여준다
const ControlledFields = (props: StoreImagesFieldsProps<StoryImage>) => {
  const [logoImage, setLogoImage] = useState(props.logoImage);
  const [interiorImages, setInteriorImages] = useState(props.interiorImages);

  return (
    <StoreImagesFields<StoryImage>
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
} satisfies Meta<typeof StoreImagesFields<StoryImage>>;

export default meta;
type Story = StoryObj<typeof meta>;

// 입점 등록 처음 화면
export const Empty: Story = {};

// 입점 등록에서 새로 고른 사진. 대표 이미지도 지울 수 있다
export const WithFiles: Story = {
  args: {
    logoImage: createSampleFile('logo.svg', '#f56b20'),
    interiorImages: [
      createSampleFile('interior-1.svg', '#78716c'),
      createSampleFile('interior-2.svg', '#a8a29e'),
    ],
  },
};

// 가게 관리: 이미 올라간 사진이 다 찬 상태. 대표 이미지는 바꾸기만 한다
export const Uploaded: Story = {
  args: {
    logoImage: createUploadedUrl('#f56b20'),
    interiorImages: [
      createUploadedUrl('#78716c'),
      createUploadedUrl('#a8a29e'),
      createUploadedUrl('#57534e'),
    ],
    onLogoRemove: undefined,
  },
};

// 가게 관리: 이미 올라간 사진과 새로 고른 사진이 섞인 상태
export const Mixed: Story = {
  args: {
    logoImage: createUploadedUrl('#f56b20'),
    interiorImages: [
      createUploadedUrl('#78716c'),
      createSampleFile('interior-new.svg', '#a8a29e'),
    ],
    onLogoRemove: undefined,
  },
};
