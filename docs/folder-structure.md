# 폴더 구조

pnpm workspaces와 Turborepo 기반 모노레포입니다. 역할(사용자, 점주, 관리자)마다 앱을 분리하고, 여러 앱이 함께 쓰는 코드와 설정은 `packages`에 둡니다.

## 전체 구조

```
lc-frontend/
├── apps/
│   ├── user/              # 사용자(직장인) 앱
│   ├── owner/             # 점주 앱
│   ├── admin/             # 관리자 앱
│   └── storybook/         # 컴포넌트 문서·테스트용 Storybook
├── packages/
│   ├── ui/                # @repo/ui: 공통 컴포넌트, 디자인 토큰, 전역 스타일, 테마
│   ├── utils/             # @repo/utils: React와 DOM에 의존하지 않는 순수 함수
│   ├── tsconfig/          # @repo/tsconfig: 공통 TypeScript 설정
│   └── eslint-config/     # @repo/eslint-config: 공통 ESLint 설정
├── docs/
├── turbo.json             # Turborepo 태스크 정의
├── pnpm-workspace.yaml    # 워크스페이스 경로, 공통 의존성 버전(catalog)
└── package.json           # 루트 스크립트와 공통 개발 도구
```

## 앱별 개발 서버 포트

| 앱 | 패키지 이름 | 포트 |
| --- | --- | --- |
| user | `user` | 5173 |
| owner | `owner` | 5174 |
| admin | `admin` | 5175 |
| storybook | `storybook-app` | 6006 |

포트가 이미 사용 중이면 다른 포트로 넘어가지 않고 에러로 멈춥니다(`strictPort`).

## 앱 내부 구조

`user`, `owner`, `admin`은 같은 구조를 따릅니다.

```
apps/<앱>/src/
├── app/          # 앱 진입점, 라우터, 전역 Provider
├── pages/        # 주소 하나에 대응하는 화면
├── features/     # 기능 단위 UI, 상태, 로직 묶음
├── components/   # 이 앱 안에서 여러 기능이 함께 쓰는 컴포넌트
├── layout/       # 여러 페이지를 감싸는 틀
├── api/          # 서버 요청 함수와 mock 데이터
├── auth/         # 로그인 상태와 접근 제어
├── index.css
└── main.tsx
```

| 폴더 | 들어가는 것 | 예시 |
| --- | --- | --- |
| `app` | 앱 전체에 한 번만 설정하는 것 | `App.tsx`, `router.tsx`, `providers.tsx` |
| `pages` | 라우터에 연결되는 화면. 직접 로직을 갖지 않고 `layout`과 `features`를 조합 | `LoginPage.tsx`, `SignupPage.tsx` |
| `features` | 특정 기능에 필요한 UI, 상태, 로직 | `features/signup/steps/BusinessHoursStep.tsx` |
| `components` | 특정 기능에 묶이지 않고 앱 안에서 재사용하는 컴포넌트 | 점주 헤더, 이미지 업로더, DataTable |
| `layout` | 페이지마다 반복되는 바깥 구조 | 사이드바 레이아웃, 하단 탭바 레이아웃 |
| `api` | 서버 요청 함수와 mock 데이터 | `store.ts`, `mocks/` |
| `auth` | 로그인 상태 제공과 비로그인 접근 차단 | `AuthProvider.tsx`, `RequireAuth.tsx` |

## 의존 방향

```
app → pages → features → components
                  │
                  └──→ api, auth

apps/* ──→ @repo/ui, @repo/utils
```

- 화살표 방향으로만 import합니다. `components`에서 `features`를 import하지 않습니다.
- 예외로 `components`는 `api`의 타입만 `import type`으로 가져올 수 있습니다. 여러 기능이 같은 데이터를 보여주는 컴포넌트(예: 캠페인 카드)가 타입을 따로 정의하지 않고 서버 응답 타입을 그대로 쓰기 위해서입니다. 요청 함수, 상수, mock 데이터는 가져오지 않습니다.
- `components`의 import 규칙은 각 앱의 `eslint.config.js`(`no-restricted-imports`)로 검사합니다.
- `features`끼리는 서로 import하지 않습니다. 두 기능이 같은 코드를 써야 하면 그 코드를 `components`나 `@repo/ui`로 옮깁니다.
- 앱끼리는 서로 import하지 않습니다.
- `packages`는 `apps`를 import하지 않습니다.

## Path alias(경로 별칭)

앱마다 자기 `src` 폴더를 가리키는 별칭이 있습니다.

| 앱 | 별칭 | 가리키는 폴더 |
| --- | --- | --- |
| user | `@user/` | `apps/user/src` |
| owner | `@owner/` | `apps/owner/src` |
| admin | `@admin/` | `apps/admin/src` |

```tsx
import { Header } from '@owner/components/Header';
```

- 앱마다 별칭 이름이 다른 이유는 Storybook이 세 앱의 컴포넌트를 한꺼번에 읽기 때문입니다. 모두 `@/`를 쓰면 어느 앱의 `src`인지 구분할 수 없습니다.
- 각 앱은 자기 별칭만 인식하므로, 다른 앱의 별칭을 import하면 타입 에러가 납니다.
- 별칭은 앱의 `tsconfig.app.json`(`paths`)에만 정의합니다. Vite와 Storybook은 `resolve.tsconfigPaths` 옵션으로 이 값을 그대로 읽으므로 따로 등록하지 않습니다.
- 앱을 추가하면 새 앱의 `tsconfig.app.json`에 `paths`를, `packages/eslint-config`의 import 정렬 그룹에 별칭 이름을 추가합니다.

## 컴포넌트 배치 기준

| 사용 범위 | 위치 |
| --- | --- |
| 두 개 이상의 앱에서 같은 형태와 동작으로 사용 | `packages/ui/src/components` |
| 한 앱 안에서 여러 기능이 사용 | `apps/<앱>/src/components` |
| 한 기능에서만 사용 | `apps/<앱>/src/features/<기능>` |

## 공통 패키지 사용

`@repo/ui`는 빌드하지 않고 소스를 그대로 export하며, 각 앱의 Vite가 직접 컴파일합니다.

```tsx
import { Button, initializeTheme } from '@repo/ui';
```

새 공통 컴포넌트를 만들면 `packages/ui/src/index.ts`에 export를 추가합니다.

앱의 `src/index.css`는 공통 스타일을 이렇게 불러옵니다.

```css
@import 'tailwindcss';
@import '@repo/ui/styles.css';

@source '../../../packages/ui/src';
```

`@source`가 없으면 앱 폴더 밖에 있는 `packages/ui`의 Tailwind 클래스가 빌드 결과에서 빠집니다.

디자인 토큰은 `packages/ui/src/styles/tokens.css`, 전역 기본 스타일은 `packages/ui/src/styles/global.css`에 있습니다.

## Storybook

스토리 파일(`*.stories.tsx`)은 컴포넌트 옆에 두고, `apps/storybook`이 아래 경로에서 모아 보여줍니다.

- `packages/ui/src/**`
- `apps/*/src/components/**`

`apps/storybook`에는 설정만 있고 스토리는 없습니다. 스토리 작성 범위는 [docs/conventions.md](/docs/conventions.md#storybook)를 참고합니다.
