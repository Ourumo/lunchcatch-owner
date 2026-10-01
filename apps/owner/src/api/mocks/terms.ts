import type { TermsItem } from '@owner/api/signupFlow';

// 점주 입점 신청에 필요한 약관 목록. 필수 약관을 먼저, 선택 약관을 뒤에 둔다
export const mockOwnerTerms: TermsItem[] = [
  {
    id: 'service',
    title: '점주 서비스 이용약관 동의',
    required: true,
    version: '1.0',
  },
  {
    // 포인트 충전, 노출당 과금, 예산 소진, 환불 기준
    id: 'paidService',
    title: '유료 서비스(포인트·광고) 이용약관 동의',
    required: true,
    version: '1.0',
  },
  {
    id: 'privacy',
    title: '개인정보 수집 및 이용 동의',
    required: true,
    version: '1.0',
  },
  {
    id: 'location',
    title: '위치기반서비스 이용약관 동의',
    required: false,
    version: '1.0',
  },
  {
    id: 'marketing',
    title: '광고성 정보 수신 동의',
    required: false,
    version: '1.0',
  },
];
