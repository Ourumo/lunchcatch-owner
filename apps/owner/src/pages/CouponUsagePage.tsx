import { CouponUsageHistory } from '@owner/features/couponUsage/CouponUsageHistory';
import { STORE_PATH } from '@owner/features/store/storePaths';
import { useGoBack } from '@owner/hooks/useGoBack';

// 가게 관리 > 쿠폰 사용 이력. 주소로 바로 들어오면 뒤로 가기는 가게 관리로 간다
const CouponUsagePage = () => {
  const goBack = useGoBack(STORE_PATH);

  return <CouponUsageHistory onBack={goBack} />;
};

export default CouponUsagePage;
