import { useContext } from 'react';

import { CampaignFormContext } from './campaignFormContext';

export const useCampaignForm = () => {
  const context = useContext(CampaignFormContext);

  if (!context) {
    throw new Error(
      'useCampaignForm은 CampaignFormProvider 안에서 사용해야 합니다.',
    );
  }

  return context;
};
