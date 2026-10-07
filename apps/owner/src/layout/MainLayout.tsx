import { Outlet } from 'react-router';

// 로그인한 점주의 하위 화면(캠페인 등록·상세 등) 틀. 하단 탭바가 있는 탭 첫 화면은 TabLayout을 쓴다
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
