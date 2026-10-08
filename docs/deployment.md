# 배포

> 프론트 세 앱의 배포 설정과 운영 시 알아 둘 점 (팀 내부용)

[← 프로젝트 README로 돌아가기](../README.md#포팅-매뉴얼)

## Vercel 설정

<!-- TODO: 실제 Vercel 프로젝트 설정과 맞는지 확인 -->

- 세 앱은 Vercel 프로젝트를 하나씩 만들어 따로 배포하며, 프로젝트마다 아래처럼 설정

| 항목 | 값 |
| --- | --- |
| Root Directory | `apps/user`, `apps/owner`, `apps/admin` 중 하나 |
| Framework Preset | Vite |
| Install Command | `pnpm install` |
| Build Command | `pnpm build` (앱의 `tsc -b && vite build`) |
| Output Directory | `dist` |

- 환경 변수 `VITE_API_BASE_URL`은 프로젝트마다 Settings > Environment Variables에 등록

| 환경 | 브랜치 | 값 |
| --- | --- | --- |
| Production | `main` | `https://api.lunchcatch.com` |
| Preview | `develop` | `https://api.dev.lunchcatch.com` |

- 환경 변수는 빌드할 때 코드에 들어가므로, 값을 넣거나 바꾼 뒤에는 Deployments에서 Redeploy 필요
- 각 앱의 `vercel.json`이 모든 주소를 `index.html`로 보내 새로고침해도 화면 유지

## 알아 둘 점

- 인증 쿠키가 `lunchcatch.com` 아래 주소에만 발급되어, PR 미리보기(`*.vercel.app`)에서는 로그인 불가
- API 서버의 CORS도 `lunchcatch.com` 아래 주소만 허용
- 카카오 로그인 콜백 경로는 사용자 앱의 `/oauth/callback`이며, 바꾸면 백엔드와 카카오 콘솔 설정도 함께 변경 필요
- 개발 API 서버(`api.dev.lunchcatch.com`)는 필요할 때만 켜 두므로, 연동 테스트 전에 인프라 담당에게 요청
