import {
  getTimeRangeError,
  type HoursStepValues,
  isHoursStepComplete,
  weekdays,
} from '@owner/api/signupFlow';
import { updateBusinessHours } from '@owner/api/store';
import { BusinessHoursFields } from '@owner/components/BusinessHoursFields/BusinessHoursFields';

import { StoreEditLayout } from './StoreEditLayout';
import { useStoreEdit } from './useStoreEdit';

// 요일은 고른 순서와 상관없이 같은 요일이면 같은 영업시간으로 본다
const isSameHours = (a: HoursStepValues, b: HoursStepValues) =>
  a.openTime === b.openTime &&
  a.closeTime === b.closeTime &&
  a.openDays.length === b.openDays.length &&
  a.openDays.every((day) => b.openDays.includes(day));

// 가게 관리 > 영업시간 수정. 입력 화면과 검사 규칙은 입점 등록과 같은 것을 쓴다
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
        <div className="px-page pt-6 pb-8">
          <BusinessHoursFields
            // 이미 등록한 영업시간을 고치는 화면이라 요일을 모두 빼면 바로 알린다
            daysError={
              edit.values.openDays.length === 0
                ? '영업 요일을 하루 이상 골라 주세요'
                : undefined
            }
            daysHint="고르지 않은 요일은 휴무로 저장돼요."
            onChange={edit.setValues}
            timeRangeError={getTimeRangeError(
              edit.values.openTime,
              edit.values.closeTime,
            )}
            value={edit.values}
            weekdays={weekdays}
          />
        </div>
      )}
    </StoreEditLayout>
  );
};
