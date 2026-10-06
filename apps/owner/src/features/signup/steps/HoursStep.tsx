import { Input } from '@repo/ui';

import {
  isValidTimeRange,
  type Weekday,
  weekdays,
} from '@owner/api/signupFlow';
import { useSignupFlow } from '@owner/features/signup/useSignupFlow';

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
        <Input
          label="영업 시작시간"
          onChange={(event) =>
            updateStepValues('hours', { openTime: event.target.value })
          }
          required
          type="time"
          value={openTime}
        />
        <Input
          errorMessage={timeRangeError}
          label="영업 종료시간"
          onChange={(event) =>
            updateStepValues('hours', { closeTime: event.target.value })
          }
          required
          type="time"
          value={closeTime}
        />
      </div>
    </div>
  );
};
