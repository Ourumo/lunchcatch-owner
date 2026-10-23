import { useEffect, useEffectEvent, useRef } from 'react';

// 목록 끝에 이만큼 가까워지면 다음 구간을 미리 불러온다
const LOAD_MORE_ROOT_MARGIN = '200px';

// 목록 끝을 지켜보다가 화면에 가까워지면 다음 구간을 부른다. 이어 불러오기 영역(LoadMoreFooter)이 쓴다.
// 불러오는 동안에는 그리지 않고, 다 불러온 뒤 다시 그려질 때 아직 화면 안이면 바로 이어서 부른다
export const LoadMoreTrigger = ({ onLoadMore }: { onLoadMore: () => void }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const handleLoadMore = useEffectEvent(onLoadMore);

  useEffect(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: LOAD_MORE_ROOT_MARGIN },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div aria-hidden="true" className="h-px" ref={triggerRef} />;
};
