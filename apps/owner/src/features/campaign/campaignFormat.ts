import type { CouponStepValues } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';

// 캠페인 목록과 상세에서 함께 쓰는 표시용 문구

const numberFormatter = new Intl.NumberFormat('ko-KR');
const DAY_MS = 24 * 60 * 60 * 1000;

export const formatNumber = (value: number) => numberFormatter.format(value);

// 1원 = 1포인트
export const formatPoints = (value: number) => `${formatNumber(value)}P`;

export const formatDiscount = ({
  discountType,
  discountValue,
}: Pick<CouponStepValues, 'discountType' | 'discountValue'>) => {
  if (discountValue === null) {
    return '';
  }

  return discountType === 'PERCENT'
    ? `${discountValue}%`
    : `${formatNumber(discountValue)}원`;
};

// 캠페인 이름은 따로 입력받지 않으므로 쿠폰 조건으로 제목을 만든다 (예: 전 메뉴 20% 할인)
export const getCampaignTitle = (
  coupon: CouponStepValues,
  menus: StoreMenu[],
) => {
  if (coupon.discountValue === null) {
    return '새 캠페인';
  }

  const target =
    coupon.discountTarget === 'MENU'
      ? (menus.find((menu) => menu.id === coupon.menuId)?.name ?? '특정 메뉴')
      : '전 메뉴';

  return `${target} ${formatDiscount(coupon)} 할인`;
};

// YYYY-MM-DD를 로컬 날짜로 읽는다. new Date('YYYY-MM-DD')는 UTC 기준으로 읽혀 날짜가 밀릴 수 있다
const parseDateValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const formatMonthDay = (date: Date) =>
  `${date.getMonth() + 1}.${date.getDate()}`;

// YYYY-MM-DD를 M.D로 보여준다
export const formatShortDate = (value: string) =>
  formatMonthDay(parseDateValue(value));

export const formatCreatedDate = (createdAt: string) =>
  formatMonthDay(new Date(createdAt));

export const formatPeriod = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) {
    return '기간 미정';
  }

  return `${formatShortDate(startDate)} ~ ${formatShortDate(endDate)}`;
};

// 오늘부터 그 날짜까지 남은 일수. 오늘이면 0, 지난 날짜면 음수
export const getDaysFromToday = (value: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round(
    (parseDateValue(value).getTime() - today.getTime()) / DAY_MS,
  );
};
