import { useEffect, useEffectEvent, useState } from 'react';

// 1초마다 줄어드는 남은 초. 요청 제한(429)이 풀릴 때까지 기다리는 화면이 쓴다.
// 세는 중이 아니면 null이고, 다 세면 null로 돌아가며 onEnd를 부른다
export const useCountdown = (onEnd?: () => void) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  // start로 받은 초. 같은 값으로 다시 시작해도 새로 세도록 객체로 둔다
  const [countdown, setCountdown] = useState<{ seconds: number } | null>(null);
  const handleEnd = useEffectEvent(() => onEnd?.());

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    // 백그라운드 탭에서는 타이머가 늦게 실행될 수 있어, 실행된 횟수가 아니라 끝나는 시각으로 남은 시간을 계산한다
    const endsAt = Date.now() + countdown.seconds * 1000;

    const timer = window.setInterval(() => {
      const seconds = Math.ceil((endsAt - Date.now()) / 1000);

      if (seconds > 0) {
        setRemainingSeconds(seconds);
        return;
      }

      window.clearInterval(timer);
      setCountdown(null);
      setRemainingSeconds(null);
      handleEnd();
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdown]);

  // 0초 이하는 기다릴 필요가 없어 세지 않는다
  const start = (seconds: number) => {
    if (seconds <= 0) {
      setCountdown(null);
      setRemainingSeconds(null);
      return;
    }

    setCountdown({ seconds });
    setRemainingSeconds(seconds);
  };

  return { remainingSeconds, start };
};
