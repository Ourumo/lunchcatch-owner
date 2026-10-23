import { Clock } from 'lucide-react';

import { getTimeRangeError, weekdays } from '@owner/api/signupFlow';
import { BusinessHoursFields } from '@owner/ui/BusinessHoursFields/BusinessHoursFields';

import { useSignupFlow } from '../useSignupFlow';

// 쿠폰을 쓰는 시간 안내. 피드는 하루 종일 보이지만 쿠폰은 발급 시간에만 받고, 캠페인에서 정한 사용 시간에 매장에서 쓴다.
// 이 시간에 영업하지 않으면 손님이 쿠폰을 쓸 수 없어 영업시간을 정할 때 알린다
const CouponTimeNotice = () => (
  <aside className="rounded-xl border border-dashed border-brand-200 bg-surface-brand px-4 py-4">
    <p className="flex items-center gap-1.5 text-body-sm-mobile font-medium text-text-secondary">
      <Clock aria-hidden="true" className="size-4 text-text-brand" />
      쿠폰 발급 시간
    </p>
    <p className="mt-2 text-body-sm-mobile break-keep text-text-primary">
      쿠폰은 매일{' '}
      <strong className="font-bold text-text-brand">11:00~14:00</strong>에
      발급돼요. 손님은 캠페인에서 정한 사용 시간(11:30~15:00 안)에 매장에서
      써요. 이 시간에 영업하는지 확인해 주세요.
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
      <CouponTimeNotice />
    </div>
  );
};
