import type { OwnerStatus } from '@owner/api/auth';

export interface MockOwner {
  email: string;
  password: string;
  status: OwnerStatus;
  tutorialViewed: boolean;
}

// 화면 확인용 계정. 비밀번호는 모두 lunchcatch1
export const mockOwners: MockOwner[] = [
  {
    email: 'owner@lunchcatch.com',
    password: 'lunchcatch1',
    status: 'ACTIVE',
    tutorialViewed: true,
  },
  {
    email: 'new@lunchcatch.com',
    password: 'lunchcatch1',
    status: 'ACTIVE',
    tutorialViewed: false,
  },
  {
    email: 'onboarding@lunchcatch.com',
    password: 'lunchcatch1',
    status: 'ONBOARDING',
    tutorialViewed: false,
  },
  {
    email: 'suspended@lunchcatch.com',
    password: 'lunchcatch1',
    status: 'SUSPENDED',
    tutorialViewed: false,
  },
];
