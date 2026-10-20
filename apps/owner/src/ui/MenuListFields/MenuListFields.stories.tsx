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

type StoryImage = ImageValue;

const uploadedMenus: MenuListItem<StoryImage>[] = [
  {
    id: 'menu-1',
    image: createUploadedImage('#f56b20'),
    name: '수제 치즈 돈까스',
    price: '11000',
  },
  {
    id: 'menu-2',
    image: createUploadedImage('#78716c'),
    name: '로스카츠 정식',
    price: '13000',
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
      },
    ],
  },
};

// 가게 관리: 할인 중인 캠페인이 쓰는 메뉴는 수정과 삭제 버튼 대신 안내를 보여준다
export const Locked: Story = {
  args: {
    menus: uploadedMenus,
    canEdit: (menu) => menu.id !== 'menu-1',
    getLockNotice: (menu) =>
      menu.id === 'menu-1'
        ? '할인 중인 캠페인에 쓰이고 있어 수정하거나 삭제할 수 없어요'
        : undefined,
  },
};
