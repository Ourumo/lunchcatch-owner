// 로그인·로그아웃을 같은 브라우저의 다른 탭에 알린다.
// 인증 쿠키는 탭끼리 같이 쓰지만 로그인 상태는 탭마다 따로 들고 있어, 알림을 받은 탭이 내 정보 조회로 상태를 다시 받는다.
// 토큰이나 계정 정보는 싣지 않고 바뀌었다는 것만 알린다. 보낸 탭에는 메시지가 오지 않는다.
// BroadcastChannel이 없는 브라우저에서는 알리지 않는다. 다른 탭은 다음 요청에서 바뀐 쿠키로 알게 된다
const AUTH_CHANGED_MESSAGE = 'auth-changed';

const channel =
  typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel('lunchcatch-owner-auth');

export const notifyAuthChanged = () => {
  channel?.postMessage(AUTH_CHANGED_MESSAGE);
};

export const onAuthChanged = (listener: () => void) => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data === AUTH_CHANGED_MESSAGE) {
      listener();
    }
  };

  channel?.addEventListener('message', handleMessage);
  return () => {
    channel?.removeEventListener('message', handleMessage);
  };
};
