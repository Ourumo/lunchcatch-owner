import { useEffect, useState } from 'react';

// 카메라를 켜지 못한 이유. denied: 권한 거부, unavailable: 카메라 없음·다른 앱이 사용 중,
// insecure: HTTPS(또는 localhost)가 아니라 브라우저가 카메라를 막음
export type CameraErrorStatus = 'denied' | 'unavailable' | 'insecure';

export type CameraState =
  | { status: 'requesting' }
  | { status: 'active'; stream: MediaStream }
  | { status: CameraErrorStatus };

const stopStream = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => track.stop());
};

const getErrorStatus = (error: unknown): CameraErrorStatus =>
  error instanceof DOMException &&
  (error.name === 'NotAllowedError' || error.name === 'SecurityError')
    ? 'denied'
    : 'unavailable';

// 브라우저는 보안 연결에서만 카메라 API를 연다. 보안 연결이 아니면 navigator.mediaDevices가 없다
const getInitialState = (): CameraState =>
  window.isSecureContext && 'mediaDevices' in navigator
    ? { status: 'requesting' }
    : { status: 'insecure' };

// 후면 카메라를 켠다. 처음 켤 때 브라우저가 권한을 묻는다.
// 화면을 나가면 모든 트랙을 멈춰 기기의 카메라 사용 표시가 꺼지게 한다
export const useCamera = () => {
  const [state, setState] = useState(getInitialState);
  // 값이 바뀌면 다시 켠다
  const [requestId, setRequestId] = useState(0);
  const isSupported = state.status !== 'insecure';

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    let ignore = false;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      })
      .then((nextStream) => {
        // 켜지는 사이 화면을 나갔으면 바로 끈다
        if (ignore) {
          stopStream(nextStream);
          return;
        }

        stream = nextStream;
        setState({ status: 'active', stream: nextStream });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setState({ status: getErrorStatus(error) });
        }
      });

    return () => {
      ignore = true;

      if (stream) {
        stopStream(stream);
      }
    };
  }, [isSupported, requestId]);

  // 설정에서 권한을 허용한 뒤 다시 켠다
  const retry = () => {
    setState({ status: 'requesting' });
    setRequestId((id) => id + 1);
  };

  return { retry, state };
};
