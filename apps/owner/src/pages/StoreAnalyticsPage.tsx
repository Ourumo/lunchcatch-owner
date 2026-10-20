import { StoreAnalytics } from '@owner/features/analytics/StoreAnalytics';
import { STORE_PATH } from '@owner/features/store/storePaths';
import { useGoBack } from '@owner/hooks/useGoBack';

// 가게 관리 > 분석. 주소로 바로 들어오면 뒤로 가기는 가게 관리로 간다
const StoreAnalyticsPage = () => {
  const goBack = useGoBack(STORE_PATH);

  return <StoreAnalytics onBack={goBack} />;
};

export default StoreAnalyticsPage;
