import {
  type AgeGroup,
  ageGroupOptions,
  type CouponStepValues,
  type ExposureRadius,
  exposureRadiusOptions,
  type TargetGender,
  targetGenderOptions,
} from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';
import { formatNumber } from '@owner/ui/campaignFormat';

// 캠페인 기능에서만 쓰는 노출 대상 표시 문구. 여러 화면이 함께 쓰는 문구는 ui/campaignFormat에 있다

export const formatRadius = (radius: ExposureRadius) =>
  exposureRadiusOptions.find((option) => option.value === radius)?.label ?? '';

export const formatGender = (gender: TargetGender) =>
  targetGenderOptions.find((option) => option.value === gender)?.label ?? '';

// 확인 단계와 상세의 할인 대상. 메뉴는 가게 조회로 따로 받아, 불러오는 중이면 undefined, 실패하면 null이다.
// 메뉴를 못 받았을 때 "입력 전"으로 보이면 값이 빠진 것처럼 보여 흐린 글자(isMuted)로 이유를 보여준다.
// 메뉴를 받았는데 그 메뉴가 없으면 제목과 같이 "특정 메뉴"로 둔다. 메뉴를 아직 고르지 않았으면 undefined(입력 전)
export const getDiscountTargetValue = (
  {
    discountTarget,
    menuId,
  }: Pick<CouponStepValues, 'discountTarget' | 'menuId'>,
  menus: StoreMenu[] | null | undefined,
): { text: string; isMuted?: boolean } | undefined => {
  if (discountTarget === 'ALL') {
    return { text: '전 메뉴' };
  }

  if (menuId === null) {
    return undefined;
  }

  if (menus === undefined) {
    return { text: '불러오는 중', isMuted: true };
  }

  if (menus === null) {
    return { text: '메뉴를 불러오지 못했어요', isMuted: true };
  }

  const menu = menus.find(({ id }) => id === menuId);

  return {
    text: menu ? `${menu.name} (${formatNumber(menu.price)}원)` : '특정 메뉴',
  };
};

// 비어 있으면 전체 연령대다
export const formatAgeGroups = (ageGroups: AgeGroup[]) => {
  if (ageGroups.length === 0) {
    return '전체';
  }

  return ageGroupOptions
    .filter((option) => ageGroups.includes(option.value))
    .map((option) => option.label)
    .join(', ');
};
