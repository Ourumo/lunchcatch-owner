import type { MyStore } from '@owner/api/store';

// Unsplash 음식 사진 (포스터 폭 360px 안팎의 2배 크기로 요청)
const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=720&q=70&fm=webp&fit=crop`;

export const mockStore: MyStore = {
  id: 'store-1',
  name: '카츠쿠라 역삼점',
  roadAddress: '서울 강남구 테헤란로 152',
  location: { latitude: 37.5003, longitude: 127.0363 },
  logoImageUrl: photo('1504674900247-0877df9cc836'),
  interiorImageUrls: [
    photo('1517248135467-4c7edcad34c4'),
    photo('1555396273-367ea4eb4db5'),
  ],
  businessHours: {
    openDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    openTime: '11:00',
    closeTime: '21:00',
  },
  menus: [
    {
      id: 'menu-1',
      name: '수제 치즈 돈까스',
      price: 11000,
      description: '모짜렐라 치즈를 가득 넣은 두툼한 수제 돈까스',
      imageUrl: photo('1504674900247-0877df9cc836'),
    },
    {
      id: 'menu-2',
      name: '로스카츠 정식',
      price: 9500,
      description: '',
      imageUrl: photo('1585032226651-759b368d7246'),
    },
    {
      id: 'menu-3',
      name: '냉메밀 소바 세트',
      price: 10000,
      description: '',
      imageUrl: photo('1569718212165-3a8278d5f624'),
    },
  ],
};
