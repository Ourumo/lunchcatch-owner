import { QrScan } from '@owner/features/qrScan/QrScan';
import { useGoBack } from '@owner/hooks/useGoBack';

// 홈의 "QR 코드 스캔". 닫으면 홈으로 돌아간다
const QrScanPage = () => {
  const goBack = useGoBack('/home');

  return <QrScan onClose={goBack} />;
};

export default QrScanPage;
