import { type RefObject, useEffect, useRef, useState } from 'react';

import { type KakaoMap, type KakaoMaps, loadKakaoMaps } from './kakaoSdk';

export interface KakaoMapHandle {
  maps: KakaoMaps;
  map: KakaoMap;
}

export interface KakaoMapOptions {
  latitude: number;
  longitude: number;
  level: number;
  // false면 끌기와 확대를 막는다. 위치를 확인만 하는 미리보기에서 쓴다
  interactive?: boolean;
}

// 카카오 SDK를 불러와 container 안에 지도를 한 번 만든다
// 옵션은 처음 만들 때만 쓰고, 그 뒤로 위치를 옮기는 것은 쓰는 쪽에서 map으로 한다
// 불러오지 못하면 hasLoadError가 켜진다
export const useKakaoMap = (
  containerRef: RefObject<HTMLElement | null>,
  options: KakaoMapOptions,
) => {
  const [kakao, setKakao] = useState<KakaoMapHandle | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const initialOptions = useRef(options);

  useEffect(() => {
    let ignore = false;

    loadKakaoMaps()
      .then((maps) => {
        const container = containerRef.current;
        if (ignore || !container) return;
        const {
          interactive = true,
          latitude,
          level,
          longitude,
        } = initialOptions.current;
        const map = new maps.Map(container, {
          center: new maps.LatLng(latitude, longitude),
          level,
          draggable: interactive,
          scrollwheel: interactive,
          disableDoubleClickZoom: !interactive,
        });
        setKakao({ maps, map });
      })
      .catch(() => {
        if (!ignore) setHasLoadError(true);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [containerRef]);

  return { hasLoadError, kakao };
};
