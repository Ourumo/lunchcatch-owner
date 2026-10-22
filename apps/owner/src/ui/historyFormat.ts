import type { PointHistoryPeriod } from '@owner/api/points';

// 내역 화면(포인트 내역, 결제 내역, 쿠폰 사용 이력)이 함께 쓰는 기간 선택지와 날짜·시각 형식

export const historyPeriodItems: {
  label: string;
  value: PointHistoryPeriod;
}[] = [
  { label: '최근 7일', value: '7D' },
  { label: '최근 30일', value: '30D' },
  { label: '최근 3개월', value: '3M' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 내역은 한국 시간 기준이라, 브라우저 시간대와 상관없이 한국 날짜와 시각으로 묶고 보여준다.
// 다른 시간대로 묶으면 00:00 예약이 전날로 넘어가 집행일 묶음이 깨진다
const kstDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const kstTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// 한국 날짜 YYYY-MM-DD. 내역을 날짜별로 묶는 키로 쓴다
export const toKstDateKey = (date: Date) => kstDateFormatter.format(date);

// 10월 13일 (월). 오늘이면 요일 대신 "오늘"
export const formatHistoryDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const label =
    dateKey === toKstDateKey(new Date()) ? '오늘' : WEEKDAYS[date.getDay()];

  return `${month}월 ${day}일 (${label})`;
};

// 09:20
export const formatHistoryTime = (occurredAt: string) =>
  kstTimeFormatter.format(new Date(occurredAt));

// 10월 22일 (수) 09:20. 날짜 묶음 없이 한 줄씩 보여주는 결제 내역에 쓴다
export const formatHistoryDateTime = (occurredAt: string) =>
  `${formatHistoryDate(toKstDateKey(new Date(occurredAt)))} ${formatHistoryTime(occurredAt)}`;
