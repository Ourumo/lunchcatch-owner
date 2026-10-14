export type DateRangeSelectionMode = 'day' | 'week' | 'month';

export const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const formatDateLabel = (value: string) => value.replaceAll('-', '.');

export interface DateRangeValue {
  endDate: string;
  startDate: string;
}

/** 선택한 날짜를 일·주·월의 전체 구간으로 변환한다. 주는 월요일부터 일요일까지다. */
export const getDateRangeUnit = (
  value: string,
  mode: DateRangeSelectionMode,
): DateRangeValue => {
  // 날짜 문자열만 다루므로 UTC 연산으로 지역 시간대와 일광 절약 시간의 영향을 피한다.
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return { startDate: '', endDate: '' };
  const start = new Date(date);
  const end = new Date(date);
  if (mode === 'week') {
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    end.setTime(start.getTime());
    end.setUTCDate(end.getUTCDate() + 6);
  } else if (mode === 'month') {
    start.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + 1, 0);
  }
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};
