// 화면 코드에서 읽는 환경변수. Vite는 VITE_로 시작하는 값만 화면 코드에 넣어 준다
interface ImportMetaEnv {
  // API 서버 주소 (예: https://api.lunchcatch.com). 개발에서는 비워 두고 Vite 프록시를 쓴다
  readonly VITE_API_BASE_URL?: string;
  // 카카오 지도 JavaScript 키. 입점 신청 매장 위치의 장소 검색에 쓴다 (카카오 디벨로퍼스에 등록한 도메인에서만 동작)
  readonly VITE_KAKAO_JS_KEY?: string;
  // 토스페이먼츠 결제위젯 클라이언트 키. 포인트 충전 결제창에 쓴다 (시크릿 키는 백엔드에만 둔다)
  readonly VITE_TOSS_CLIENT_KEY?: string;
  // 개발용 로그인 상태 (ACTIVE, ONBOARDING). 로컬 개발에서만 읽는다 (api/auth.ts getMe)
  readonly VITE_MOCK_OWNER_STATUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
