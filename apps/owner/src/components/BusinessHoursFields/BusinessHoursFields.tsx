import { useId } from 'react';

import type { HoursStepValues, Weekday } from '@owner/api/signupFlow';
import { TimePicker } from '@owner/components/TimePicker/TimePicker';

export interface WeekdayOption {
  value: Weekday;
  label: string;
}

export interface BusinessHoursFieldsProps {
  value: HoursStepValues;
  onChange: (value: HoursStepValues) => void;
  // 요일 칩에 이 순서대로 보여준다
  weekdays: WeekdayOption[];
  // 영업 종료시간 아래에 보여주는 오류
  timeRangeError?: string;
  // 요일 칩 아래 안내와 오류. 넘기지 않으면 보여주지 않는다
  daysHint?: string;
  daysError?: string;
}

// 영업 요일과 모든 영업일에 같이 쓰는 시작·종료 시간 입력. 입점 등록과 가게 관리가 함께 쓴다.
// 요일 목록과 오류 문구는 api의 값을 쓰는 쪽에서 넘긴다 (components는 api의 값을 가져오지 않는다)
export const BusinessHoursFields = ({
  daysError,
  daysHint,
  onChange,
  timeRangeError,
  value,
  weekdays,
}: BusinessHoursFieldsProps) => {
  const daysHintId = useId();
  const { closeTime, openDays, openTime } = value;
  const hasDaysHint = Boolean(daysHint || daysError);

  const toggleDay = (day: Weekday) => {
    onChange({
      ...value,
      openDays: openDays.includes(day)
        ? openDays.filter((openDay) => openDay !== day)
        : [...openDays, day],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <fieldset
        aria-describedby={hasDaysHint ? daysHintId : undefined}
        className="flex flex-col gap-2"
      >
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
        {hasDaysHint && (
          <div id={daysHintId}>
            {daysHint && (
              <p className="text-caption-mobile text-text-secondary">
                {daysHint}
              </p>
            )}
            {daysError && (
              <p className="mt-1 text-caption-mobile text-status-danger-fg">
                {daysError}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <TimePicker
          label="영업 시작시간"
          onValueChange={(time) => onChange({ ...value, openTime: time })}
          value={openTime}
        />
        <TimePicker
          errorMessage={timeRangeError}
          label="영업 종료시간"
          onValueChange={(time) => onChange({ ...value, closeTime: time })}
          value={closeTime}
        />
      </div>
    </div>
  );
};
