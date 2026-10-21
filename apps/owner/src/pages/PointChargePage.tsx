import { PointCheckout } from '@owner/features/points/PointCheckout';

// 포인트 충전 결제. 홈, 가게 관리, 포인트 내역, 캠페인 등록의 충전 시트에서 금액을 고르면 들어온다
const PointChargePage = () => {
  return <PointCheckout />;
};

export default PointChargePage;
