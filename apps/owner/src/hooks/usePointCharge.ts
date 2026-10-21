import { useLocation, useNavigate } from 'react-router';

// 포인트 충전 결제 화면 주소. 결제위젯으로 결제하면 토스가 성공·실패 주소로 페이지를 옮긴다
export const POINT_CHARGE_PATH = '/points/charge';
export const POINT_CHARGE_SUCCESS_PATH = '/points/charge/success';
export const POINT_CHARGE_FAIL_PATH = '/points/charge/fail';

// 돌아갈 화면을 넘겨받지 못했으면 홈으로 간다
const DEFAULT_RETURN_PATH = '/home';

// 주소로 넘겨받은 돌아갈 화면. 다른 사이트로 보내지 않도록 앱 안 경로(/로 시작하고 //나 /\로 시작하지 않음)만 받는다
export const getReturnPath = (value: string | null) =>
  value?.startsWith('/') && !/^\/[/\\]/.test(value)
    ? value
    : DEFAULT_RETURN_PATH;

// 결제 화면 주소. 금액과 결제를 마치고 돌아갈 화면을 주소에 담아, 결제창에서 페이지를 떠났다 와도 잃지 않게 한다
export const getPointChargePath = (amount: number, returnTo: string) =>
  `${POINT_CHARGE_PATH}?${new URLSearchParams({ amount: String(amount), returnTo })}`;

// 충전 시트에서 금액을 고르면 결제 화면으로 간다. 결제를 마치면 지금 화면으로 돌아온다
export const usePointCharge = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (amount: number) => {
    navigate(getPointChargePath(amount, location.pathname + location.search));
  };
};
