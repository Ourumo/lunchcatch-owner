import {
  type HoursStepValues,
  type Weekday,
  weekdays,
} from '@owner/api/signupFlow';
import type { MyStore } from '@owner/api/store';

const NOT_REGISTERED = '미등록';

// 월요일부터 순서대로 보고 이어진 요일은 "월~금"처럼 묶는다. 떨어진 요일은 쉼표로 잇는다 (예: 월~수, 금)
const formatOpenDays = (openDays: Weekday[]) => {
  if (openDays.length === weekdays.length) {
    return '매일';
  }

  const runs: string[][] = [];
  let run: string[] = [];

  weekdays.forEach(({ label, value }) => {
    if (openDays.includes(value)) {
      run.push(label);
      return;
    }

    if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  });

  if (run.length > 0) {
    runs.push(run);
  }

  return runs
    .map((days) =>
      days.length === 1 ? days[0] : `${days[0]}~${days[days.length - 1]}`,
    )
    .join(', ');
};

// 예: 월~금 11:00~21:00, 매일 10:00~22:00
export const formatBusinessHours = ({
  closeTime,
  openDays,
  openTime,
}: HoursStepValues) =>
  openDays.length > 0
    ? `${formatOpenDays(openDays)} ${openTime}~${closeTime}`
    : NOT_REGISTERED;

// 대표 이미지와 매장 이미지 중 올린 사진의 수
export const formatStoreImageCount = ({
  interiorImageUrls,
  logoImageUrl,
}: MyStore) => {
  const count = (logoImageUrl ? 1 : 0) + interiorImageUrls.length;

  return count > 0 ? `${count}장` : NOT_REGISTERED;
};

// 대표 메뉴는 선택이라 없을 수 있다
export const formatMenuCount = ({ menus }: MyStore) =>
  menus.length > 0 ? `${menus.length}개` : NOT_REGISTERED;
