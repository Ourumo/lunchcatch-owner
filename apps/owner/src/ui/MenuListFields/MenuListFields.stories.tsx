import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { ImageValue } from '@owner/api/imageUpload';
import type { MenuFormRules } from '@owner/ui/MenuFormSheet/MenuFormSheet';

import {
  MenuListFields,
  type MenuListFieldsProps,
  type MenuListItem,
} from './MenuListFields';

// ui는 api의 값을 가져오지 않으므로 api/signupFlow의 menuInputRules를 줄여 옮긴 규칙을 둔다
const rules: MenuFormRules = {
  nameMaxLength: 20,
  priceMax: 1_000_000,
  descriptionMaxLength: 500,
  getErrors: ({ image, name, price }) => ({
    image: image ? undefined : '메뉴 사진을 등록해주세요',
    name: name.trim() ? undefined : '메뉴명을 입력해주세요',
    price:
      Number(price) >= 100 && Number(price) <= 1_000_000
        ? undefined
        : '가격은 100원 이상 1,000,000원 이하로 입력해주세요',
  }),
};

// 이미 올라간 사진. 네트워크 없이 보이도록 data URL로 둔다
const createUploadedImage = (color: string): ImageValue => ({
  status: 'saved',
  url: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e7e5e4"/><rect x="120" y="90" width="160" height="120" rx="12" fill="${color}"/></svg>`,
  )}`,
});

// 새로 고른 사진. 네트워크 없이 미리보기를 보여주기 위한 예시 파일
const createFile = (name: string, color: string) =>
  new File(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#ffd8c4"/><circle cx="200" cy="150" r="80" fill="${color}"/></svg>`,
    ],
    name,
    { type: 'image/svg+xml' },
  );

// 사진이 없는 메뉴(입점 등록에서 사진을 올리기 전)도 보여준다
type StoryImage = ImageValue | null;

const uploadedMenus: MenuListItem<StoryImage>[] = [
  {
    id: 'menu-1',
    image: createUploadedImage('#f56b20'),
    name: '수제 치즈 돈까스',
    price: '11000',
    description: '모짜렐라 치즈를 가득 넣은 두툼한 수제 돈까스',
  },
  {
    id: 'menu-2',
    image: createUploadedImage('#78716c'),
    name: '로스카츠 정식',
    price: '13000',
    description: '',
  },
];

// 추가·수정·삭제가 바로 반영되도록 상태를 붙여 보여준다
const ControlledFields = (props: MenuListFieldsProps<StoryImage>) => {
  const [menus, setMenus] = useState(props.menus);

  return (
    <MenuListFields<StoryImage> {...props} menus={menus} onChange={setMenus} />
  );
};

const meta = {
  title: 'Owner/MenuListFields',
  component: MenuListFields,
  args: {
    menus: [],
    maxMenus: 3,
    rules,
    onChange: () => undefined,
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
} satisfies Meta<typeof MenuListFields<StoryImage>>;

export default meta;
type Story = StoryObj<typeof meta>;

// 입점 등록 처음 화면
export const Empty: Story = {};

export const WithMenus: Story = {
  args: {
    menus: uploadedMenus,
  },
};

// 최대 개수를 채우면 추가 버튼이 사라진다
export const Full: Story = {
  args: {
    menus: [
      ...uploadedMenus,
      {
        id: 'menu-3',
        image: createUploadedImage('#a8a29e'),
        name: '냉메밀 소바 세트',
        price: '9500',
        description: '',
      },
    ],
  },
};

// 입점 등록: 등록한 메뉴는 바꿀 수 없고, 메뉴마다 사진 업로드 상태를 보여준다.
// 올리는 중, 올리지 못함(다시 시도), 사진 없음(새로고침으로 고른 파일이 사라진 경우, 사진 등록)
export const UploadStates: Story = {
  args: {
    menus: [
      {
        id: 'menu-1',
        image: {
          status: 'uploading',
          file: createFile('menu-1.svg', '#f56b20'),
          progress: 40,
        },
        name: '수제 치즈 돈까스',
        price: '11000',
        description: '',
      },
      {
        id: null,
        image: { status: 'failed', file: createFile('menu-2.svg', '#78716c') },
        name: '로스카츠 정식',
        price: '13000',
        description: '',
      },
      {
        id: 'menu-3',
        image: null,
        name: '냉메밀 소바 세트',
        price: '9500',
        description: '',
      },
    ],
    canEdit: () => false,
    notice: '등록한 메뉴는 지금은 바꾸거나 지울 수 없어요',
    onRetry: () => {},
    onImageSelect: () => {},
    disabled: true,
  },
};
