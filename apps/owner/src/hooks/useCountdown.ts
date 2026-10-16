import { useEffect, useEffectEvent, useState } from 'react';

// 1초마다 1씩 줄어드는 남은 초. 요청 제한(429)이 풀릴 때까지 기다리는 화면이 쓴다.
// 세는 중이 아니면 null이고, 다 세면 null로 돌아가며 onEnd를 부른다
export const useCountdown = (onEnd?: () => void) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const handleEnd = useEffectEvent(() => onEnd?.());

  useEffect(() => {
    if (remainingSeconds === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (remainingSeconds > 1) {
        setRemainingSeconds(remainingSeconds - 1);
        return;
      }

      setRemainingSeconds(null);
      handleEnd();
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [remainingSeconds]);

  // 0초 이하는 기다릴 필요가 없어 세지 않는다
  const start = (seconds: number) => {
    setRemainingSeconds(seconds > 0 ? seconds : null);
  };

  return { remainingSeconds, start };
};
