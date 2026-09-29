# 코딩/커밋/브랜치 규칙

## 커밋 컨벤션

### 타입 (소문자 영어)

feat / fix / docs / style / refactor / test / chore / design / rename / remove

### 규칙

- 제목은 한국어로 작성
- 제목 끝에 마침표 없음
- 제목 60자 이내
- 본문도 한국어로 작성
- 여러 항목은 bullet point 사용

### 예시

```
feat: 카카오 로그인 화면 구현

- 카카오 SDK 초기화
- 로그인 버튼 컴포넌트 추가
- 로그인 상태 관리 훅 작성
```

## 브랜치 전략

- `main`: 배포용 (직접 푸시 금지)
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치 (develop에서 분기)

## 코딩 규칙

- 컴포넌트: 함수형 + arrow function
- 스타일: Tailwind 유틸리티 클래스 사용
- 상태관리: useState / useContext (외부 라이브러리 X)
- API: 이번 스프린트는 mock 데이터 사용
- 타입: interface 우선 (type은 유니온/인터섹션에만)
- 파일명: 컴포넌트는 PascalCase, 유틸/훅은 camelCase
- import 경로 (앱 코드):
  - 같은 폴더나 하위 폴더는 상대 경로(`./`)로 가져옵니다.
  - 상위 폴더로 올라가야 하면 `../` 대신 앱 경로 별칭(`@user/`, `@owner/`, `@admin/`)으로 가져옵니다.
  - `../` import는 ESLint에서 에러로 처리됩니다. `packages`는 별칭이 없으므로 이 규칙을 적용하지 않습니다.

```tsx
// apps/owner/src/features/signup/steps/TermsStep.tsx
import { ImageUploader } from '@owner/components/ImageUploader';
import { useSignupForm } from '@owner/features/signup/useSignupForm';

import { TermsItem } from './TermsItem';
```

## 린트/포맷

- ESLint + Prettier 설정 적용
- 커밋 전 Husky pre-commit 훅에서 스테이징된 파일에 ESLint, Prettier 자동 실행
- 푸시 전 Husky pre-push 훅에서 전체 타입 검사 자동 실행
- `pnpm lint` — 린트 검사
- `pnpm lint:fix` — 린트 자동 수정
- `pnpm typecheck` — 타입 검사
- `pnpm format` — 포맷 적용
- `pnpm format:check` — 포맷 검사

## 패키지 관리

### 처음 설정

pnpm은 corepack으로 설치합니다. 버전은 루트 `package.json`의 `packageManager`에 적힌 버전이 자동으로 사용됩니다.

```bash
# Node 25 이상이라면 먼저 실행
npm install -g corepack

sudo corepack enable pnpm
pnpm install
```

### 명령어

루트에서 실행하면 Turborepo가 해당 스크립트가 있는 앱과 패키지에서 태스크를 실행합니다.

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | user, owner, admin 앱 개발 서버 실행 (Storybook 제외) |
| `pnpm dev:user` | user 앱 개발 서버만 실행 |
| `pnpm dev:owner` | owner 앱 개발 서버만 실행 |
| `pnpm dev:admin` | admin 앱 개발 서버만 실행 |
| `pnpm build` | user, owner, admin 앱 빌드 (Storybook 제외) |
| `pnpm storybook` | Storybook 개발 서버 실행 |
| `pnpm build-storybook` | Storybook 빌드 |
| `pnpm test:storybook` | Storybook 테스트 실행 |

그 밖에 특정 앱이나 패키지에서만 태스크를 실행하려면 `--filter`로 패키지 이름을 지정합니다.

```bash
pnpm exec turbo run build --filter=admin
```

### 의존성 추가

- 각 앱과 패키지는 코드에서 import하는 의존성을 자기 `package.json`에 직접 선언합니다. pnpm은 선언하지 않은 패키지를 import할 수 없습니다.
- 외부 패키지 버전은 `pnpm-workspace.yaml`의 `catalog`에서 관리하고, `package.json`에는 `"catalog:"`로 적습니다.
- 저장소 안의 패키지(`@repo/*`)는 `"workspace:*"`로 적습니다.
- `pnpm-lock.yaml`은 직접 수정하지 않습니다. 머지 충돌이 나면 충돌을 정리한 뒤 `pnpm install`을 다시 실행합니다.

```bash
# catalog에 이미 있는 패키지를 owner 앱에 추가
pnpm add lucide-react@catalog: --filter owner
```

처음 쓰는 외부 패키지는 `pnpm-workspace.yaml`의 `catalog`에 버전을 먼저 추가한 뒤, `package.json`에 `"catalog:"`로 적고 `pnpm install`을 실행합니다.

### 설치 시 보안 정책

- 공개된 지 하루가 지나지 않은 버전은 설치되지 않습니다(`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`). 예외를 두지 않고 이전 버전을 사용합니다.
- 패키지의 설치 스크립트는 기본으로 막혀 있습니다(`ERR_PNPM_IGNORED_BUILDS`). 어떤 패키지인지 확인한 뒤 `pnpm approve-builds <패키지명>`으로 허용하며, 허용 목록은 `pnpm-workspace.yaml`의 `allowBuilds`에 기록됩니다.

## Storybook

- 스토리는 `packages/ui`와 각 앱의 `components`에 있는 컴포넌트에만 작성합니다. `pages`, `features`에는 작성하지 않습니다.
- 스토리 파일은 컴포넌트 파일 옆에 `<컴포넌트명>.stories.tsx`로 둡니다.
- 스토리 제목은 공통 컴포넌트는 `Shared/...`, 앱 컴포넌트는 `Admin/...`처럼 위치에 맞게 시작합니다.
