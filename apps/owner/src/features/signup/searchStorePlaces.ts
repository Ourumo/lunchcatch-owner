import type { StorePlace } from '@owner/api/signupFlow';
import type { ApiResult } from '@owner/api/types';
import { type KakaoPlace, loadKakaoMaps } from '@owner/ui/KakaoMap/kakaoSdk';

// 입점 신청 매장 위치를 카카오맵 장소 검색(키워드 검색)으로 찾는다.
// 카카오 SDK는 서버 요청이 아니라 ui/KakaoMap에 있고 api는 ui를 가져올 수 없어, 쓰는 기능 옆에 둔다

// 키가 없거나, 등록하지 않은 도메인이거나, 네트워크 문제로 SDK를 불러오지 못했을 때
const SDK_UNAVAILABLE_MESSAGE =
  '지금은 장소를 검색할 수 없어요. 잠시 후 다시 시도해주세요.';
const SEARCH_FAILED_MESSAGE = '검색하지 못했어요. 다시 시도해주세요.';

const searchPlaces = (keyword: string) =>
  loadKakaoMaps().then(
    (maps) =>
      new Promise<KakaoPlace[] | null>((resolve) => {
        new maps.services.Places().keywordSearch(keyword, (result, status) => {
          if (status === 'ERROR') resolve(null);
          else resolve(status === 'OK' ? result : []);
        });
      }),
  );

const toStorePlace = (place: KakaoPlace): StorePlace => ({
  kakaoPlaceId: place.id,
  placeName: place.place_name,
  roadAddress: place.road_address_name,
  address: place.address_name,
  phone: place.phone,
  latitude: Number(place.y),
  longitude: Number(place.x),
});

// 주소나 상호명으로 가게 위치를 찾는다. 검색어가 비어 있거나 결과가 없으면 빈 목록을 돌려준다
export const searchStorePlaces = async (
  query: string,
): Promise<ApiResult<StorePlace[]>> => {
  const keyword = query.trim();

  if (!keyword) {
    return { ok: true, data: [] };
  }

  let places: KakaoPlace[] | null;

  try {
    places = await searchPlaces(keyword);
  } catch {
    return { ok: false, message: SDK_UNAVAILABLE_MESSAGE };
  }

  return places
    ? { ok: true, data: places.map(toStorePlace) }
    : { ok: false, message: SEARCH_FAILED_MESSAGE };
};
