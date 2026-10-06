import { Lightbulb } from 'lucide-react';

import {
  isValidTimeRange,
  type Weekday,
  weekdays,
} from '@owner/api/signupFlow';
import { TimePicker } from '@owner/components/TimePicker/TimePicker';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

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
  const { openDays, openTime, closeTime } = values.hours;
  // 두 시간을 모두 입력한 뒤에만 순서를 검사한다
  const timeRangeError =
    openTime && closeTime && !isValidTimeRange(openTime, closeTime)
      ? '시작 시간보다 늦어야 해요'
      : undefined;

  const toggleDay = (day: Weekday) => {
    const nextDays = openDays.includes(day)
      ? openDays.filter((openDay) => openDay !== day)
      : [...openDays, day];

    updateStepValues('hours', { openDays: nextDays });
  };

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-caption-web font-medium text-text-primary">
          영업 요일
        </legend>
        <div className="grid grid-cols-7 gap-1.5">
          {weekdays.map((weekday) => (
            <label className="cursor-pointer" key={weekday.value}>
              <input
                checked={openDays.includes(weekday.value)}
                className="peer sr-only"
                onChange={() => toggleDay(weekday.value)}
                type="checkbox"
                value={weekday.value}
              />
              {/* 업종 칩처럼 고른 요일은 반전 색으로 채운다 */}
              <span className="flex h-11 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface text-body-sm-mobile text-text-primary peer-checked:border-bg-inverse peer-checked:bg-bg-inverse peer-checked:text-text-on-inverse peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary">
                {weekday.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <TimePicker
          label="영업 시작시간"
          onValueChange={(time) =>
            updateStepValues('hours', { openTime: time })
          }
          value={openTime}
        />
        <TimePicker
          errorMessage={timeRangeError}
          label="영업 종료시간"
          onValueChange={(time) =>
            updateStepValues('hours', { closeTime: time })
          }
          value={closeTime}
        />
      </div>

      <LunchPeakTimeTip />
    </div>
  );
};
