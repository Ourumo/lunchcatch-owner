import type { LoginValues } from '@owner/auth/validation';

// 목 모드(VITE_USE_MOCK=true)인지. 목 모드 로그인 화면은 시연 계정 값을 채운 채 입력을 막는다.
// 로그인 화면에서 보여줄 것이 없어, 둘러보는 사람이 입력 없이 로그인 버튼만 누르고 들어가게 한다
export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true';

// 화면에 보여줄 시연 계정. 목 서버는 어떤 값이 와도 같은 시연 계정으로 로그인시킨다 (src/mocks/handlers/auth.ts)
export const demoAccount: LoginValues = {
  email: 'demo@lunchcatch.com',
  password: 'lunchcatch-demo',
};
