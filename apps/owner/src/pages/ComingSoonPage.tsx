import { ComingSoon } from '@owner/components/ComingSoon/ComingSoon';
import { useGoBack } from '@owner/hooks/useGoBack';

interface ComingSoonPageProps {
  title: string;
  // 주소로 바로 들어와 돌아갈 화면이 없을 때 이동할 상위 화면
  fallbackPath: string;
}

// 아직 만들지 않은 하위 화면
const ComingSoonPage = ({ fallbackPath, title }: ComingSoonPageProps) => {
  const goBack = useGoBack(fallbackPath);

  return <ComingSoon onBack={goBack} title={title} />;
};

export default ComingSoonPage;
