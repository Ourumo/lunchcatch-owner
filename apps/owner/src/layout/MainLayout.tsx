import { Outlet } from 'react-router';

// 로그인한 점주 화면의 틀. 홈, 통계 등 다른 탭 화면이 생기면 하단 탭바를 여기에 추가한다
const MainLayout = () => {
  return (
    <div className="min-h-dvh min-w-mobile-min">
      <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
