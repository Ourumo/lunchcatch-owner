import { PaymentHistory } from '@owner/features/points/PaymentHistory';
import { STORE_PATH } from '@owner/features/store/storePaths';
import { useGoBack } from '@owner/hooks/useGoBack';

// 가게 관리 > 결제 내역. 주소로 바로 들어오면 뒤로 가기는 가게 관리로 간다
const PaymentHistoryPage = () => {
  const goBack = useGoBack(STORE_PATH);

  return <PaymentHistory onBack={goBack} />;
};

export default PaymentHistoryPage;
