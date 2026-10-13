import type {
  PointHistoryEntry,
  PointHistoryPeriod,
  PointHistoryType,
} from '@owner/api/points';
import { formatPoints } from '@owner/components/campaignFormat';

// 관리자 앱(billing)의 원장 유형 이름과 맞춘다. 무효 노출 환급은 점주 화면에만 있다
export const pointHistoryTypeLabels: Record<PointHistoryType, string> = {
  CHARGE: '충전',
  RESERVE: '예약',
  DEDUCT: '소진',
  RELEASE: '예약 해제',
  REFUND_INVALID: '환급',
  REFUND: '환불',
  ADJUST: '조정',
};

export const pointHistoryPeriodItems: {
  label: string;
  value: PointHistoryPeriod;
}[] = [
  { label: '최근 7일', value: '7D' },
  { label: '최근 30일', value: '30D' },
  { label: '최근 3개월', value: '3M' },
];

// 집행일 하루의 예약, 소진, 예약 해제를 묶은 값. 예약 해제 전(오늘 서빙 중)이면 released가 null이다
export interface ServingSummary {
  reserved: number;
  spent: number;
  released: number | null;
}

// 화면의 내역 한 줄
export interface PointHistoryItem {
  key: string;
  type: PointHistoryType;
  amount: number;
  balanceAfter: number;
  occurredAt: string;
  campaignId: string | null;
  memo: string | null;
  serving: ServingSummary | null;
}

export interface PointHistoryDay {
  // YYYY-MM-DD
  date: string;
  items: PointHistoryItem[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const padTime = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())}`;

const SERVING_TYPES: PointHistoryType[] = ['RESERVE', 'DEDUCT', 'RELEASE'];

const isServingEntry = (entry: PointHistoryEntry) =>
  entry.campaignId !== null && SERVING_TYPES.includes(entry.type);

const getServingKey = (entry: PointHistoryEntry) =>
  `${toDateKey(new Date(entry.occurredAt))}:${entry.campaignId}`;

const toItem = (entry: PointHistoryEntry): PointHistoryItem => ({
  key: entry.id,
  type: entry.type,
  amount: entry.amount,
  balanceAfter: entry.balanceAfter,
  occurredAt: entry.occurredAt,
  campaignId: entry.campaignId,
  memo: entry.memo,
  serving: null,
});

// 집행일 하루를 한 줄로 묶는다. 예약 해제가 끝난 날은 "예약 − 예약 해제 = 소진"이라 소진 한 줄로 보여주고,
// 예약 해제 전인 오늘은 아직 소진이 정해지지 않아 예약 한 줄로 보여준다
const toServingItem = (
  anchor: PointHistoryEntry,
  group: PointHistoryEntry[],
): PointHistoryItem => {
  const findAmount = (type: PointHistoryType) =>
    group.find((entry) => entry.type === type)?.amount ?? 0;
  const reserved = -findAmount('RESERVE');
  const spent = -findAmount('DEDUCT');
  const isReleased = anchor.type === 'RELEASE';

  return {
    ...toItem(anchor),
    type: isReleased ? 'DEDUCT' : 'RESERVE',
    amount: isReleased ? -spent : -reserved,
    serving: {
      reserved,
      spent,
      released: isReleased ? anchor.amount : null,
    },
  };
};

// 최신순 내역을 날짜별로 묶는다. 같은 날 같은 캠페인의 예약, 소진, 예약 해제는 한 줄로 묶고
// 예약 해제가 있으면 예약 해제 자리에, 없으면 예약 자리에 둔다. 그 줄의 잔액도 그 자리의 잔액이다.
// 예약이 없는 묶음(전날 해제가 실패해 다음 날 되돌린 예약 해제 등)은 묶지 않고 한 줄씩 보여준다
export const groupPointHistory = (
  entries: PointHistoryEntry[],
): PointHistoryDay[] => {
  const servingGroups = new Map<string, PointHistoryEntry[]>();

  entries.filter(isServingEntry).forEach((entry) => {
    const key = getServingKey(entry);

    servingGroups.set(key, [...(servingGroups.get(key) ?? []), entry]);
  });

  const days: PointHistoryDay[] = [];

  entries.forEach((entry) => {
    const group = isServingEntry(entry)
      ? servingGroups.get(getServingKey(entry))
      : undefined;
    const hasReserve = group?.some(({ type }) => type === 'RESERVE');
    let item = toItem(entry);

    if (group && hasReserve) {
      const anchor =
        group.find(({ type }) => type === 'RELEASE') ??
        group.find(({ type }) => type === 'RESERVE');

      if (entry !== anchor) {
        return;
      }

      item = toServingItem(entry, group);
    }

    const date = toDateKey(new Date(entry.occurredAt));
    const lastDay = days.at(-1);

    if (lastDay?.date === date) {
      lastDay.items.push(item);
    } else {
      days.push({ date, items: [item] });
    }
  });

  return days;
};

// 10월 13일 (월). 오늘이면 요일 대신 "오늘"
export const formatHistoryDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const label =
    dateKey === toDateKey(new Date()) ? '오늘' : WEEKDAYS[date.getDay()];

  return `${month}월 ${day}일 (${label})`;
};

// 09:20
export const formatHistoryTime = (occurredAt: string) => {
  const date = new Date(occurredAt);

  return `${padTime(date.getHours())}:${padTime(date.getMinutes())}`;
};

// +30,000P, −2,800P. 빼기는 하이픈보다 잘 보이는 마이너스 기호를 쓴다
export const formatSignedPoints = (amount: number) => {
  if (amount > 0) {
    return `+${formatPoints(amount)}`;
  }

  return amount < 0 ? `−${formatPoints(-amount)}` : formatPoints(0);
};

// 집행일 묶음의 보조 줄
export const formatServingSummary = ({
  released,
  reserved,
  spent,
}: ServingSummary) =>
  released === null
    ? `지금까지 소진 ${formatPoints(spent)} · 남은 예약은 13:30에 해제돼요`
    : `예약 ${formatPoints(reserved)} · 예약 해제 ${formatPoints(released)}`;
