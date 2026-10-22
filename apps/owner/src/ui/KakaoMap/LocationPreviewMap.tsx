import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

import { MapOverlay } from './MapOverlay';
import { useKakaoMap } from './useKakaoMap';

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
}

// 건물 몇 개와 길 이름이 보이는 정도
const PREVIEW_MAP_LEVEL = 3;

// 고른 위치가 맞는지 보여주는 지도. 확인만 하는 곳이라 끌거나 확대할 수 없다
// 지도를 불러오지 못하면 자리를 비워 두지 않고 숨긴다. 아래 주소만으로도 확인할 수 있다
export const LocationPreviewMap = ({
  latitude,
  longitude,
}: LocationPreviewMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { hasLoadError, kakao } = useKakaoMap(containerRef, {
    latitude,
    longitude,
    level: PREVIEW_MAP_LEVEL,
    interactive: false,
  });

  // 다른 위치를 고르면 핀과 함께 지도 가운데도 옮긴다
  useEffect(() => {
    kakao?.map.setCenter(new kakao.maps.LatLng(latitude, longitude));
  }, [kakao, latitude, longitude]);

  if (hasLoadError) return null;

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle">
      {/* 카카오 지도가 이 안에 그려진다. 지도가 넣는 요소와 섞이지 않게 불러오는 중 표시는 밖에 둔다 */}
      <div
        aria-label="고른 가게 위치 지도"
        className="absolute inset-0"
        ref={containerRef}
        role="img"
      />
      {kakao ? (
        <MapOverlay
          clickable={false}
          kakao={kakao}
          latitude={latitude}
          longitude={longitude}
          yAnchor={1}
        >
          {/* 지도는 다크 모드에서도 밝아서 핀 테두리를 흰색으로 고정한다 */}
          <MapPin
            aria-hidden="true"
            className="size-9 fill-action-primary text-white drop-shadow-md"
            strokeWidth={1.5}
          />
        </MapOverlay>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-surface-subtle motion-reduce:animate-none"
        />
      )}
    </div>
  );
};
