// 화면 코드에서 읽는 환경변수. Vite는 VITE_로 시작하는 값만 화면 코드에 넣어 준다
interface ImportMetaEnv {
  // API 서버 주소 (예: https://api.lunchcatch.com). 개발에서는 비워 두고 Vite 프록시를 쓴다
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
