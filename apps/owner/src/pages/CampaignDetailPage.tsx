import { Navigate, useParams } from 'react-router';

import { CampaignDetail } from '@owner/features/campaign/detail/CampaignDetail';

const CampaignDetailPage = () => {
  const { id } = useParams();

  if (!id) {
    return <Navigate replace to="/campaigns" />;
  }

  // 다른 캠페인으로 바로 이동해도 이전 캠페인 내용이 남지 않도록 id마다 새로 그린다
  return <CampaignDetail id={id} key={id} />;
};

export default CampaignDetailPage;
