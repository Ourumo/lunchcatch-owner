import { useLocation, useNavigate } from 'react-router';

// 다른 화면이 이동하면서 돌아갈 곳을 정해 줄 때 쓰는 location.state
export interface GoBackState {
  backTo: string;
}

const getBackTo = (state: unknown) =>
  typeof state === 'object' &&
  state !== null &&
  'backTo' in state &&
  typeof state.backTo === 'string'
    ? state.backTo
    : undefined;

// 상단 뒤로 가기. 여러 화면에서 들어오는 화면(예: 캠페인 상세는 홈과 캠페인 목록)이 들어온 화면으로 돌아가게 한다.
// 돌아갈 곳을 넘겨받았으면 그곳으로 가고(예: 등록 완료 후 상세는 등록 단계가 아닌 목록으로),
// 주소로 바로 들어와 앱 안에 돌아갈 화면이 없으면 상위 화면으로 간다
export const useGoBack = (fallbackPath: string) => {
  const location = useLocation();
  const navigate = useNavigate();

  return () => {
    const backTo = getBackTo(location.state);

    if (backTo) {
      navigate(backTo, { replace: true });
      return;
    }

    // 앱 안에서 이동해 온 적이 없으면 key가 'default'다
    if (location.key === 'default') {
      navigate(fallbackPath, { replace: true });
      return;
    }

    navigate(-1);
  };
};
