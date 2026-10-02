import { Navigate, useParams } from 'react-router';

import { ActivationComplete } from '@owner/features/campaign/complete/ActivationComplete';

const CampaignCompletePage = () => {
  const { id } = useParams();

  if (!id) {
    return <Navigate replace to="/campaigns" />;
  }

  return <ActivationComplete campaignId={id} key={id} />;
};

export default CampaignCompletePage;
