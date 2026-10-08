import {
  type AgeGroup,
  ageGroupOptions,
  type ExposureRadius,
  exposureRadiusOptions,
  type TargetGender,
  targetGenderOptions,
} from '@owner/api/campaign';

// 캠페인 기능에서만 쓰는 노출 대상 표시 문구. 여러 화면이 함께 쓰는 문구는 components/campaignFormat에 있다

export const formatRadius = (radius: ExposureRadius) =>
  exposureRadiusOptions.find((option) => option.value === radius)?.label ?? '';

export const formatGender = (gender: TargetGender) =>
  targetGenderOptions.find((option) => option.value === gender)?.label ?? '';

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
