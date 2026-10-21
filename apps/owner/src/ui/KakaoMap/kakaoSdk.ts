// 카카오 지도 JavaScript SDK를 불러온다. 위치 미리보기 지도와 입점 신청 매장 위치의 장소 검색이 같이 쓴다
// 서버 요청이 아니라 api가 아닌 여기에 둔다. ui는 api의 함수를 가져올 수 없어서 지도 컴포넌트 옆에 둔다
// 키는 브라우저에 그대로 노출되는 JavaScript 키라, 카카오 디벨로퍼스에 등록한 도메인에서만 동작한다
// (사용자 앱 ui/KakaoMap에서 점주 앱에 필요한 것만 가져왔다)

export type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

// 키워드 검색 결과의 장소 하나. 없는 값은 빈 문자열로 온다
export interface KakaoPlace {
  id: string;
  place_name: string;
  // 지번 주소
  address_name: string;
  road_address_name: string;
  phone: string;
  // 경도와 위도. 문자열로 온다
  x: string;
  y: string;
}

export interface KakaoServices {
  Places: new () => {
    keywordSearch: (
      keyword: string,
      callback: (result: KakaoPlace[], status: KakaoStatus) => void,
    ) => void;
  };
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMap {
  setCenter: (latLng: KakaoLatLng) => void;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

export interface KakaoMaps {
  load: (callback: () => void) => void;
  services: KakaoServices;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: {
      center: KakaoLatLng;
      level: number;
      // 끌어서 옮기기, 마우스 휠과 두 번 눌러 확대. 미리보기처럼 움직이지 않는 지도에서 끈다
      draggable?: boolean;
      scrollwheel?: boolean;
      disableDoubleClickZoom?: boolean;
    },
  ) => KakaoMap;
  // 지도 위에 직접 만든 요소를 올린다. clickable이면 요소를 눌러도 지도 클릭으로 넘어가지 않는다
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: HTMLElement;
    clickable?: boolean;
    // 요소의 어느 지점을 좌표에 맞출지 (0~1). 기본은 가운데(0.5), 핀 끝을 맞추려면 yAnchor 1
    yAnchor?: number;
  }) => KakaoCustomOverlay;
}

declare global {
  interface Window {
    kakao?: {
      // 스크립트가 비정상으로 내려오면 kakao만 있고 maps가 없을 수 있다
      maps?: KakaoMaps;
    };
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;

let sdkPromise: Promise<KakaoMaps> | null = null;

// SDK를 처음 쓸 때 한 번만 불러온다. 키가 없거나 불러오지 못하면 실패로 돌려주고, 다음에 다시 시도할 수 있게 비운다.
// 등록하지 않은 도메인이면 스크립트 요청이 401로 거절돼 불러오지 못한 것으로 온다
export const loadKakaoMaps = () => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<KakaoMaps>((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      reject(new Error('VITE_KAKAO_JS_KEY가 없습니다'));
      return;
    }

    const script = document.createElement('script');
    // autoload=false로 받아서 load가 끝난 뒤에 services를 쓴다
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      // maps가 없으면 load를 부르다 오류가 나고 promise가 끝나지 않아서, 먼저 실패로 돌려준다
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error('카카오 지도 SDK를 불러오지 못했습니다'));
        return;
      }
      maps.load(() => resolve(maps));
    };
    script.onerror = () =>
      reject(new Error('카카오 지도 SDK를 불러오지 못했습니다'));
    document.head.append(script);
  }).catch((error: unknown) => {
    sdkPromise = null;
    throw error;
  });

  return sdkPromise;
};
