import { useLocation, useNavigate } from 'react-router';

import { ComingSoon } from '@owner/components/ComingSoon/ComingSoon';

interface ComingSoonPageProps {
  title: string;
  // 주소로 바로 들어와 돌아갈 화면이 없을 때 이동할 상위 화면
  fallbackPath: string;
}

// 아직 만들지 않은 하위 화면. 여러 화면에서 들어올 수 있어(예: 분석은 홈과 가게 관리) 들어온 화면으로 돌아간다
const ComingSoonPage = ({ fallbackPath, title }: ComingSoonPageProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    // 앱 안에서 이동해 온 적이 없으면 key가 'default'다
    if (location.key === 'default') {
      navigate(fallbackPath, { replace: true });
      return;
    }

    navigate(-1);
  };

  return <ComingSoon onBack={handleBack} title={title} />;
};

export default ComingSoonPage;
