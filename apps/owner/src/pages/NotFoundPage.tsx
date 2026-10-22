import { useNavigate } from 'react-router';
import { SearchX } from 'lucide-react';

import { useHomePath } from '@owner/auth/useHomePath';
import { PageNotice } from '@owner/ui/PageNotice/PageNotice';

// 없는 주소. 로그인 상태와 상관없이 같은 화면을 보여주고, 버튼은 지금 상태의 첫 화면으로 보낸다.
// 뒤로 가기로 다시 이 화면에 오지 않게 주소를 바꿔 이동한다
const NotFoundPage = () => {
  const navigate = useNavigate();
  const homePath = useHomePath();

  return (
    <PageNotice
      actionLabel="첫 화면으로"
      description="주소가 바뀌었거나 없는 페이지예요"
      icon={<SearchX />}
      onAction={() => navigate(homePath, { replace: true })}
      title="페이지를 찾을 수 없어요"
    />
  );
};

export default NotFoundPage;
