import { PointHistory } from '@owner/features/points/PointHistory';
import { STORE_PATH } from '@owner/features/store/storePaths';
import { useGoBack } from '@owner/hooks/useGoBack';

// 가게 관리 > 포인트 내역. 주소로 바로 들어오면 뒤로 가기는 가게 관리로 간다
const PointHistoryPage = () => {
  const goBack = useGoBack(STORE_PATH);

  return <PointHistory onBack={goBack} />;
};

export default PointHistoryPage;
