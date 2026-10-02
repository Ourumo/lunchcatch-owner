import { createContext } from 'react';

import type { CampaignStepKey, CampaignValues } from '@owner/api/campaign';

export interface CampaignFormContextValue {
  campaignId: string;
  values: CampaignValues;
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
