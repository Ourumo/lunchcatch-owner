import { Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav, type BottomNavItem } from '@repo/ui';
import { House, Store, Ticket } from 'lucide-react';

// 캠페인이 메인 기능이라 가운데에 둔다. value는 탭을 눌렀을 때 이동할 주소
const tabs: BottomNavItem[] = [
  { value: '/home', label: '홈', icon: <House /> },
  { value: '/campaigns', label: '캠페인', icon: <Ticket /> },
  { value: '/store', label: '가게 관리', icon: <Store /> },
];

// 하위 주소(예: /store/analytics)에서도 속한 탭을 선택 상태로 둔다
const getSelectedTab = (pathname: string) =>
  tabs.find(
    ({ value }) => pathname === value || pathname.startsWith(`${value}/`),
  )?.value ?? '';

// 하단 탭바가 있는 점주 화면의 틀. 탭 첫 화면(홈, 캠페인 목록, 가게 관리)만 이 틀을 쓰고,
// 캠페인 등록·상세 같은 하위 화면은 탭바 없는 MainLayout을 쓴다
const TabLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh min-w-mobile-min">
      <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
        {/* 화면 하단에 고정한 탭바가 마지막 내용을 가리지 않도록 탭바 높이와 홈 바 영역만큼 띄운다 */}
        <div className="flex flex-1 flex-col pb-[calc(84px+env(safe-area-inset-bottom))]">
          <Outlet />
        </div>

        <BottomNav
          className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-mobile"
          items={tabs}
          onValueChange={(path) => navigate(path)}
          value={getSelectedTab(pathname)}
        />
      </div>
    </div>
  );
};

export default TabLayout;
