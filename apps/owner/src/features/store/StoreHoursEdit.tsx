import { useId } from 'react';

import {
  type HoursStepValues,
  isHoursStepComplete,
  isValidTimeRange,
  type Weekday,
  weekdays,
} from '@owner/api/signupFlow';
import { updateBusinessHours } from '@owner/api/store';
import { TimePicker } from '@owner/components/TimePicker/TimePicker';

import { StoreEditLayout } from './StoreEditLayout';
import { useStoreEdit } from './useStoreEdit';

// 요일은 고른 순서와 상관없이 같은 요일이면 같은 영업시간으로 본다
const isSameHours = (a: HoursStepValues, b: HoursStepValues) =>
  a.openTime === b.openTime &&
  a.closeTime === b.closeTime &&
  a.openDays.length === b.openDays.length &&
  a.openDays.every((day) => b.openDays.includes(day));

interface HoursFieldsProps {
  values: HoursStepValues;
  onChange: (values: HoursStepValues) => void;
}

// 입점 등록의 영업시간 단계와 같은 모양. 입력 화면을 공용 컴포넌트로 나누기 전까지 요일 칩은 복사해 둔다
const HoursFields = ({ onChange, values }: HoursFieldsProps) => {
  const daysHintId = useId();
  const { closeTime, openDays, openTime } = values;
  const daysError =
    openDays.length === 0 ? '영업 요일을 하루 이상 골라 주세요' : undefined;
  // 두 시간을 모두 입력한 뒤에만 순서를 검사한다
  const timeRangeError =
    openTime && closeTime && !isValidTimeRange(openTime, closeTime)
      ? '시작 시간보다 늦어야 해요'
      : undefined;

  const toggleDay = (day: Weekday) => {
    onChange({
      ...values,
      openDays: openDays.includes(day)
        ? openDays.filter((openDay) => openDay !== day)
        : [...openDays, day],
    });
  };

  return (
    <div className="flex flex-col gap-6 px-page pt-6 pb-8">
      <fieldset aria-describedby={daysHintId} className="flex flex-col gap-2">
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
              <span className="flex h-11 items-center justify-center rounded-lg border border-border-subtle bg-bg-surface text-body-sm-mobile text-text-primary peer-checked:border-bg-inverse peer-checked:bg-bg-inverse peer-checked:text-text-on-inverse peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary">
                {weekday.label}
              </span>
            </label>
          ))}
        </div>
        <div id={daysHintId}>
          <p className="text-caption-mobile text-text-secondary">
            고르지 않은 요일은 휴무로 저장돼요.
          </p>
          {daysError && (
            <p className="mt-1 text-caption-mobile text-status-danger-fg">
              {daysError}
            </p>
          )}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <TimePicker
          label="영업 시작시간"
          onValueChange={(time) => onChange({ ...values, openTime: time })}
          value={openTime}
        />
        <TimePicker
          errorMessage={timeRangeError}
          label="영업 종료시간"
          onValueChange={(time) => onChange({ ...values, closeTime: time })}
          value={closeTime}
        />
      </div>
    </div>
  );
};

// 가게 관리 > 영업시간 수정. 검사 규칙은 입점 등록과 같은 함수를 쓴다
export const StoreHoursEdit = () => {
  const edit = useStoreEdit({
    select: (store) => store.businessHours,
    isEqual: isSameHours,
    isValid: isHoursStepComplete,
    save: updateBusinessHours,
  });

  return (
    <StoreEditLayout edit={edit} title="영업시간">
      {edit.values && (
        <HoursFields onChange={edit.setValues} values={edit.values} />
      )}
    </StoreEditLayout>
  );
};
