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

## 린트/포맷

- ESLint + Prettier 설정 적용
- 커밋 전 Husky pre-commit 훅 자동 실행
- `npm run lint` — 린트 검사
- `npm run format` — 포맷 적용
