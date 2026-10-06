import type { StorePlace } from '@owner/api/signupFlow';

// 카카오맵 장소 검색 결과를 흉내 낸 역삼·강남 일대 가게 목록
export const mockStorePlaces: StorePlace[] = [
  {
    kakaoPlaceId: '1000001',
    placeName: '카츠쿠라 역삼점',
    roadAddress: '서울 강남구 테헤란로 152',
    address: '서울 강남구 역삼동 737',
    phone: '02-555-1234',
    latitude: 37.500025,
    longitude: 127.036394,
  },
  {
    kakaoPlaceId: '1000002',
    placeName: '역삼 뚝배기집',
    roadAddress: '서울 강남구 논현로85길 12',
    address: '서울 강남구 역삼동 735-17',
    phone: '02-563-2468',
    latitude: 37.500862,
    longitude: 127.035112,
  },
  {
    kakaoPlaceId: '1000003',
    placeName: '강남 쌀국수',
    roadAddress: '서울 강남구 강남대로 396',
    address: '서울 강남구 역삼동 825',
    phone: '02-3478-0011',
    latitude: 37.497942,
    longitude: 127.027621,
  },
  {
    kakaoPlaceId: '1000004',
    placeName: '선릉 국밥',
    roadAddress: '서울 강남구 선릉로 428',
    address: '서울 강남구 대치동 889-41',
    phone: '02-501-7788',
    latitude: 37.504503,
    longitude: 127.049008,
  },
  {
    kakaoPlaceId: '1000005',
    placeName: '역삼 샐러드 키친',
    roadAddress: '서울 강남구 테헤란로 211',
    address: '서울 강남구 역삼동 702-2',
    phone: '',
    latitude: 37.501702,
    longitude: 127.039839,
  },
];
