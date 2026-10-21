import { PointChargeFail } from '@owner/features/points/PointChargeFail';

// 포인트 충전 결제창의 실패 주소. 결제를 취소했거나 결제 중 오류가 났다고 알린다
const PointChargeFailPage = () => {
  return <PointChargeFail />;
};

export default PointChargeFailPage;
