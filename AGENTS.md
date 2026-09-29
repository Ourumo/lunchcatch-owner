# 런치캐치 (Lunch Catch)

위치 기반 점심 쿠폰 할인 서비스. 직장인이 주변 가게 쿠폰을 스와이프로 찜하고, 11:00 선착순 오픈에 발급받는 구조.

## 기술 스택

- React 19 + Vite 8 + TypeScript
- Tailwind CSS
- Storybook
- ESLint / Prettier / Husky


## 참고 문서

- docs/requirements-user.md — 사용자(직장인) 요구사항 명세서
- docs/requirements-owner.md — 점주 요구사항 명세서
- docs/requirements-admin.md — 관리자 요구사항 명세서
- docs/requirements-common.md — 공통/시스템 요구사항
- docs/folder-structure.md — 폴더 구조
- docs/conventions.md — 코딩/커밋/브랜치 규칙

## 핵심 규칙

- "가게" 사용 ("식당" X)
- 서빙 시간대: 10:00~12:59
- 쿠폰 발급은 찜 목록에서만 (피드 카드에 발급 버튼 없음)
- 11:00 선착순 오픈, 10:50 알림
- 브랜드 컬러: #F56B20 (src/styles/tokens.css)
- shared 컴포넌트 12종 이미 구현됨 (Button, Input, Toast, BottomSheet 등)

