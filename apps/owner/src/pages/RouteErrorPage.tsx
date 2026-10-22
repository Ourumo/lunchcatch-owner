import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { CircleAlert } from 'lucide-react';

import { useHomePath } from '@owner/auth/useHomePath';
import { PageNotice } from '@owner/ui/PageNotice/PageNotice';

// 화면을 그리다 오류가 나면 React Router 기본 화면(개발자용 영어 문구) 대신 보여준다.
// 첫 화면 자체에서 난 오류면 앱 안에서 같은 주소로 옮겨도 다시 날 수 있어, 페이지를 새로 불러오며 첫 화면으로 보낸다
const RouteErrorPage = () => {
  const error = useRouteError();
  const homePath = useHomePath();

  // 점주에게는 원인을 보여주지 않고 콘솔에만 남긴다
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageNotice
      actionLabel="첫 화면으로"
      description="잠시 후 다시 시도해 주세요"
      icon={<CircleAlert />}
      onAction={() => window.location.replace(homePath)}
      title="문제가 생겼어요"
    />
  );
};

export default RouteErrorPage;
