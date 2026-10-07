const MOCK_DELAY_MS = 600;

// 화면에서 로딩 상태를 확인할 수 있도록 mock 응답을 늦춘다
export const mockDelay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });
