import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  type MenuFormRules,
  MenuFormSheet,
  type MenuFormSheetProps,
} from './MenuFormSheet';

// components는 api의 값을 가져오지 않으므로 api/signupFlow의 menuInputRules를 줄여 옮긴 규칙을 둔다
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

// 이미 올라간 사진 주소. 네트워크 없이 보이도록 data URL로 둔다
const uploadedImageUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e7e5e4"/><rect x="120" y="90" width="160" height="120" rx="12" fill="#78716c"/></svg>',
)}`;

type StoryImage = File | string;

// 확인하면 시트가 닫히고 입력한 메뉴를 보여주도록 상태를 붙인다
const SheetExample = (props: MenuFormSheetProps<StoryImage>) => {
  const [isOpen, setIsOpen] = useState(true);
  const [saved, setSaved] = useState<string>();

  return (
    <div className="p-4">
      <button onClick={() => setIsOpen(true)} type="button">
        메뉴 시트 열기
      </button>
      {saved && <p>{saved}</p>}
      {isOpen && (
        <MenuFormSheet<StoryImage>
          {...props}
          onClose={() => setIsOpen(false)}
          onSave={({ name, price }) => {
            setSaved(`${name} ${Number(price).toLocaleString('ko-KR')}원`);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

const meta = {
  title: 'Owner/MenuFormSheet',
  component: MenuFormSheet,
  args: {
    rules,
    onClose: () => undefined,
    onSave: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => <SheetExample {...args} />,
} satisfies Meta<typeof MenuFormSheet<StoryImage>>;

export default meta;
type Story = StoryObj<typeof meta>;

// 새 메뉴 추가
export const Add: Story = {};

// 가게 관리에서 이미 올라간 사진이 있는 메뉴를 고칠 때
export const Edit: Story = {
  args: {
    initialMenu: {
      image: uploadedImageUrl,
      name: '수제 치즈 돈까스',
      price: '11000',
    },
  },
};
