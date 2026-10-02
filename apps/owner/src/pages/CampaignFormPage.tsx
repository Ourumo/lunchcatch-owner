import { Navigate, useParams } from 'react-router';

import { CampaignFormLayout } from '@owner/features/campaign/form/CampaignFormLayout';
import { CampaignFormProvider } from '@owner/features/campaign/form/CampaignFormProvider';

// 등록 단계 화면들을 하나의 Provider 아래에 두어, 단계를 오가도 입력값이 유지되게 한다
const CampaignFormPage = () => {
  const { id } = useParams();

  if (!id) {
    return <Navigate replace to="/campaigns" />;
  }

  // 다른 캠페인으로 바로 이동해도 이전 캠페인의 입력값이 남지 않도록 id마다 새로 그린다
  return (
    <CampaignFormProvider campaignId={id} key={id}>
      <CampaignFormLayout />
    </CampaignFormProvider>
  );
};

export default CampaignFormPage;
