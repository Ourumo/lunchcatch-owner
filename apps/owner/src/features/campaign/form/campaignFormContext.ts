import { createContext } from 'react';

import type { CampaignStepKey, CampaignValues } from '@owner/api/campaign';
import type { PlatformSettings } from '@owner/api/platform';

export interface CampaignFormContextValue {
  campaignId: string;
  values: CampaignValues;
  // 노출 단가, 최소 하루 예산 등 운영의 플랫폼 설정값
  platformSettings: PlatformSettings;
  // 한 단계의 값 중 바뀐 필드만 넘기면 나머지 값은 유지된다
  updateStepValues: <TStepKey extends Exclude<CampaignStepKey, 'poster'>>(
    stepKey: TStepKey,
    patch: Partial<CampaignValues[TStepKey]>,
  ) => void;
  // 포스터는 없을 수도(null) 있어 부분 수정 대신 통째로 바꾼다
  setPoster: (poster: CampaignValues['poster']) => void;
}

export const CampaignFormContext =
  createContext<CampaignFormContextValue | null>(null);
