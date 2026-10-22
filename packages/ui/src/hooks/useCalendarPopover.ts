import { useLayoutEffect, useRef } from 'react';

const calendarWidth = 296;
const viewportMargin = 8;

/** 날짜·기간 선택기가 같은 화면 경계와 스크롤 배치 규칙을 사용하도록 관리한다. */
export const useCalendarPopover = (
  isOpen: boolean,
  align: 'start' | 'end' = 'start',
) => {
  const fieldRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const popup = popupRef.current;
    const field = fieldRef.current;
    if (!isOpen || !popup || !field) return;

    // 부모의 스크롤 영역에 잘리지 않도록 최상위 레이어에 표시한다.
    popup.showPopover();
    const updatePosition = () => {
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? document.documentElement.clientWidth;
      const height = viewport?.height ?? window.innerHeight;
      const margin = viewportMargin;
      // 폭 제한으로 달력 높이가 달라질 수 있으므로 크기를 먼저 적용한 뒤 측정한다.
      popup.style.width = `${Math.min(calendarWidth, Math.max(0, width - margin * 2))}px`;
      popup.style.maxHeight = `${Math.max(0, height - margin * 2)}px`;
      const fieldRect = field.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const bottom = top + height - margin;
      const below = fieldRect.bottom + margin;
      const above = fieldRect.top - margin - popupRect.height;
      // 아래 공간이 부족하면 위로 열고, 양쪽 모두 부족하면 화면 안으로 보정한다.
      const preferredTop = below + popupRect.height <= bottom ? below : above;
      const preferredLeft =
        align === 'end' ? fieldRect.right - popupRect.width : fieldRect.left;
      popup.style.left = `${Math.max(left + margin, Math.min(preferredLeft, left + width - margin - popupRect.width))}px`;
      popup.style.top = `${Math.max(top + margin, Math.min(preferredTop, bottom - popupRect.height))}px`;
    };
    updatePosition();
    // 월별 주 수가 바뀌거나 스크롤·확대가 발생해도 입력란과 화면 경계를 따라간다.
    const observer = new ResizeObserver(updatePosition);
    observer.observe(popup);
    observer.observe(field);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
      popup.hidePopover();
    };
  }, [isOpen, align]);

  return { fieldRef, popupRef };
};
