import { type ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { KakaoMapHandle } from './useKakaoMap';

interface MapOverlayProps {
  kakao: KakaoMapHandle;
  latitude: number;
  longitude: number;
  // false면 눌러도 지도 클릭으로 넘긴다 (위치 표시처럼 누를 일이 없는 표시)
  clickable?: boolean;
  // 요소의 어느 높이를 좌표에 맞출지. 핀처럼 아래 끝이 위치를 가리키면 1
  yAnchor?: number;
  children: ReactNode;
}

// 카카오 지도의 커스텀 오버레이 자리에 React 요소를 그린다
// 오버레이에 넘긴 빈 요소 안으로 포털을 열어서, 스타일을 React 그대로 쓴다
export const MapOverlay = ({
  children,
  clickable = true,
  kakao,
  latitude,
  longitude,
  yAnchor = 0.5,
}: MapOverlayProps) => {
  const [element] = useState(() => document.createElement('div'));

  useEffect(() => {
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(latitude, longitude),
      content: element,
      clickable,
      yAnchor,
    });
    overlay.setMap(kakao.map);
    return () => overlay.setMap(null);
  }, [clickable, element, kakao, latitude, longitude, yAnchor]);

  return createPortal(children, element);
};
