import { Lightbulb } from 'lucide-react';

import { getTimeRangeError, weekdays } from '@owner/api/signupFlow';
import { BusinessHoursFields } from '@owner/components/BusinessHoursFields/BusinessHoursFields';

import { useSignupFlow } from '../useSignupFlow';

// 점심 시간대 추천 안내. 지역별 피크 타임 데이터가 없어 시안 문구를 그대로 쓰는 더미
const LunchPeakTimeTip = () => (
  <aside className="rounded-xl border border-dashed border-brand-200 bg-surface-brand px-4 py-4">
    <p className="flex items-center gap-1.5 text-body-sm-mobile font-medium text-text-secondary">
      <Lightbulb aria-hidden="true" className="size-4 text-text-brand" />
      점심특가 최적 시간대 추천
    </p>
    <p className="mt-2 text-body-sm-mobile break-keep text-text-primary">
      직장인 밀집 지역인 역삼동의 평균 점심 피크 타임은{' '}
      <strong className="font-bold text-text-brand">11:00 ~ 14:00</strong>
      입니다. 이 시간대에 노출이 집중됩니다.
    </p>
  </aside>
);

// 영업 요일과 모든 영업일에 같이 쓰는 시작·종료 시간 입력
export const HoursStep = () => {
  const { updateStepValues, values } = useSignupFlow();
  const { closeTime, openTime } = values.hours;

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <BusinessHoursFields
        onChange={(hours) => updateStepValues('hours', hours)}
        timeRangeError={getTimeRangeError(openTime, closeTime)}
        value={values.hours}
        weekdays={weekdays}
      />
      <LunchPeakTimeTip />
    </div>
  );
};
