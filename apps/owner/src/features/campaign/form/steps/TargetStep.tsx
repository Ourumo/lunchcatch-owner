import type { ReactNode } from 'react';
import { ChoiceChip, SegmentedControl } from '@repo/ui';
import { Clock, Users } from 'lucide-react';

import {
  type AgeGroup,
  ageGroupOptions,
  type ExposureRadius,
  exposureRadiusOptions,
  SERVING_TIME_END,
  SERVING_TIME_START,
  type TargetGender,
  targetGenderOptions,
  type TargetStepValues,
} from '@owner/api/campaign';
import {
  formatAgeGroups,
  formatGender,
  formatRadius,
} from '@owner/features/campaign/campaignFormat';
import { useCampaignForm } from '@owner/features/campaign/form/useCampaignForm';

// SegmentedControl은 문자열 값만 받으므로 반경은 문자열로 바꿔 넘긴다
const radiusItems = exposureRadiusOptions.map(({ label, value }) => ({
  label,
  value: String(value),
}));

interface FieldGroupProps {
  legend: string;
  description?: string;
  children: ReactNode;
}

const FieldGroup = ({ children, description, legend }: FieldGroupProps) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-body-mobile font-bold text-text-primary">
      {legend}
    </legend>
    {children}
    {description && (
      <p className="-mt-1 text-caption-mobile break-keep text-text-secondary">
        {description}
      </p>
    )}
  </fieldset>
);

// 연령대는 여러 개 고를 수 있다. 아무것도 고르지 않은 상태가 전체이며,
// 전체를 누르면 고른 연령대를 비우고 마지막 연령대를 해제하면 다시 전체가 된다
const toggleAgeGroup = (ageGroups: AgeGroup[], ageGroup: AgeGroup) =>
  ageGroups.includes(ageGroup)
    ? ageGroups.filter((value) => value !== ageGroup)
    : ageGroupOptions
        .map(({ value }) => value)
        .filter((value) => value === ageGroup || ageGroups.includes(value));

// 등록 3단계: 점주 반경, 성별, 연령대. 시간대는 점심 고정이라 안내만 한다
export const TargetStep = () => {
  const { updateStepValues, values } = useCampaignForm();
  const { target } = values;
  const isAllAges = target.ageGroups.length === 0;

  const update = (patch: Partial<TargetStepValues>) =>
    updateStepValues('target', patch);

  return (
    <div className="flex flex-col gap-8 px-page">
      <FieldGroup
        description="가게를 중심으로 이 거리 안에 있는 직장인에게 노출돼요."
        legend="노출 반경"
      >
        <SegmentedControl
          ariaLabel="노출 반경"
          items={radiusItems}
          onValueChange={(value) =>
            update({ radius: Number(value) as ExposureRadius })
          }
          value={String(target.radius)}
        />
      </FieldGroup>

      <FieldGroup legend="성별">
        <SegmentedControl<TargetGender>
          ariaLabel="성별"
          items={targetGenderOptions}
          onValueChange={(gender) => update({ gender })}
          value={target.gender}
        />
      </FieldGroup>

      <FieldGroup
        description="여러 연령대를 함께 고를 수 있어요."
        legend="연령대"
      >
        <div className="flex flex-wrap gap-2">
          <ChoiceChip
            checked={isAllAges}
            onChange={() => update({ ageGroups: [] })}
            type="checkbox"
          >
            전체
          </ChoiceChip>
          {ageGroupOptions.map((option) => (
            <ChoiceChip
              checked={target.ageGroups.includes(option.value)}
              key={option.value}
              onChange={() =>
                update({
                  ageGroups: toggleAgeGroup(target.ageGroups, option.value),
                })
              }
              type="checkbox"
              value={option.value}
            >
              {option.label}
            </ChoiceChip>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup legend="노출 시간대">
        <p className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3.5 text-body-sm-mobile text-text-primary">
          <Clock aria-hidden="true" className="size-4 text-text-secondary" />
          <span className="font-medium">점심</span>
          <span className="text-text-secondary">
            {SERVING_TIME_START} ~ {SERVING_TIME_END}
          </span>
          <span className="ml-auto text-caption-mobile text-text-secondary">
            고정
          </span>
        </p>
      </FieldGroup>

      {/* 고른 조건을 한 문장으로 다시 보여줘 누구에게 노출되는지 바로 알 수 있게 한다 */}
      <div className="flex gap-2.5 rounded-xl bg-surface-brand px-4 py-3.5">
        <Users
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-text-brand"
        />
        <p className="text-body-sm-mobile break-keep text-text-primary">
          가게 반경{' '}
          <strong className="font-bold">{formatRadius(target.radius)}</strong>{' '}
          안에서 점심에 접속한{' '}
          <strong className="font-bold">
            {target.gender === 'ALL'
              ? '모든 성별'
              : formatGender(target.gender)}
            , {isAllAges ? '모든 연령대' : formatAgeGroups(target.ageGroups)}
          </strong>{' '}
          직장인에게 노출돼요.
        </p>
      </div>
    </div>
  );
};
