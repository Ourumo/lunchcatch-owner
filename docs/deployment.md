# 배포

> 점주 앱의 배포 설정과 운영 시 알아 둘 점
>
> 원본 저장소에서는 세 앱을 Vercel 프로젝트로 나눠 배포했고, 서비스 도메인(`lunchcatch.com`)과 API 서버는 프로젝트가 끝나 내려갔습니다. 지금은 `lunchcatch-owner-demo.vercel.app`만 남아 있습니다.

[← 프로젝트 README로 돌아가기](../README.md#포팅-매뉴얼)

## Vercel 설정

<!-- TODO: 실제 Vercel 프로젝트 설정과 맞는지 확인 -->

- 점주 앱 Vercel 프로젝트 설정

| 항목 | 값 |
| --- | --- |
| Root Directory | `apps/owner` |
| Framework Preset | Vite |
| Install Command | `pnpm install` |
| Build Command | `pnpm build` (앱의 `tsc -b && vite build`) |
| Output Directory | `dist` |

- 환경 변수는 Settings > Environment Variables에 등록. 지금은 API 서버 없이 목 모드로 배포한다

| 변수 | 지금 값 | 설명 |
| --- | --- | --- |
| `VITE_USE_MOCK` | `true` | 목 모드. MSW가 서버 대신 시연 데이터로 답함 (`apps/owner/src/mocks`) |
| `VITE_API_BASE_URL` | 등록하지 않음 | 없으면 같은 주소의 `/v1`로 요청하고 MSW가 가로챔. API 서버를 다시 붙일 때만 그 주소를 넣음 |
| `VITE_KAKAO_JS_KEY` | 개인 카카오 앱의 JavaScript 키 | 입점 신청 매장 위치의 장소 검색 |
| `VITE_TOSS_CLIENT_KEY` | 토스 개발 문서에 공개된 테스트용 위젯 키 | 포인트 충전 결제위젯. 테스트 결제라 실제로 결제되지 않음 |

- 카카오 지도 키는 카카오 디벨로퍼스 [앱] > [플랫폼 키] > [JavaScript 키] > [JavaScript SDK 도메인]에 등록한 도메인에서만 동작한다. 지금은 `https://lunchcatch-owner-demo.vercel.app`만 등록돼 있어 로컬(`http://localhost:5174`)과 PR 미리보기에서는 장소 검색이 되지 않는다. 로컬에서 쓰려면 이 목록에 추가한다
- 토스 결제위젯
  - 목 모드에서는 결제위젯과 테스트 결제는 토스에서 실제로 진행되고, 결제 뒤 승인 확정만 MSW가 받아 포인트를 충전한다. 시크릿 키가 필요한 토스 승인 요청은 보내지 않는다
  - 퀵계좌이체는 토스가 테스트용 휴대폰 번호와 비밀번호(`000000`)를 안내해 앱이나 카드 없이 끝까지 해 볼 수 있다. 카드 · 간편결제는 테스트 환경에서도 카드사 · 토스 앱 인증이 필요하다
  - API 서버를 다시 붙이면 백엔드의 시크릿 키와 같은 쌍의 클라이언트 키로 바꾼다. 시크릿 키는 백엔드에만 두고 Vercel 환경 변수에는 넣지 않는다
- `VITE_`로 시작하는 값은 빌드 결과(브라우저 코드)에 그대로 들어가므로, 시크릿 키 같은 비밀 값은 넣지 않음
- 환경 변수는 빌드할 때 코드에 들어가므로, 값을 넣거나 바꾼 뒤에는 Deployments에서 Redeploy 필요
- 각 앱의 `vercel.json`이 모든 주소를 `index.html`로 보내 새로고침해도 화면 유지

## API 서버를 다시 붙일 때 알아 둘 점

- 인증 쿠키가 `lunchcatch.com` 아래 주소에만 발급되어, PR 미리보기(`*.vercel.app`)에서는 로그인 불가
- API 서버의 CORS도 `lunchcatch.com` 아래 주소만 허용
- 개발 API 서버(`api.dev.lunchcatch.com`)는 필요할 때만 켜 두므로, 연동 테스트 전에 인프라 담당에게 요청
