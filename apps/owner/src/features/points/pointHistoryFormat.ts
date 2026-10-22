import type { PointHistoryEntry, PointHistoryType } from '@owner/api/points';
import { formatPoints } from '@owner/ui/campaignFormat';
import { toKstDateKey } from '@owner/ui/historyFormat';

// 관리자 앱(billing)의 원장 유형 이름과 맞춘다
export const pointHistoryTypeLabels: Record<PointHistoryType, string> = {
  CHARGE: '충전',
  RESERVE: '예약',
  DEDUCT: '소진',
  RELEASE: '예약 해제',
  REFUND: '환불',
  ADJUST: '조정',
};

// 집행일 하루의 예약, 소진, 예약 해제를 묶은 값. 예약 해제 전이면 released가 null이다.
// 예약 해제 전의 소진은 오늘이면 소진 집계로 받고, 받지 못했거나 지난날(예약 해제가 늦어진 경우)이면 spent가 null이다
export interface ServingSummary {
  reserved: number;
  spent: number | null;
  released: number | null;
  isToday: boolean;
}

// 화면의 내역 한 줄
export interface PointHistoryItem {
  key: string;
  type: PointHistoryType;
  amount: number;
  occurredAt: string;
  campaignId: string | null;
  serving: ServingSummary | null;
}

export interface PointHistoryDay {
  // YYYY-MM-DD
  date: string;
  items: PointHistoryItem[];
}

const SERVING_TYPES: PointHistoryType[] = ['RESERVE', 'DEDUCT', 'RELEASE'];

const isServingEntry = (entry: PointHistoryEntry) =>
  entry.campaignId !== null && SERVING_TYPES.includes(entry.type);

// 예약과 예약 해제는 어느 날 몫인지(businessDate)로, 나머지는 기록한 날로 날짜를 정한다.
// 전날 몫의 예약 해제는 다음 날 00:00에 기록되어 기록한 날로 보면 다음 날에 들어간다
const getEntryDate = (entry: PointHistoryEntry) =>
  entry.businessDate ?? toKstDateKey(new Date(entry.occurredAt));

const getServingKey = (entry: PointHistoryEntry) =>
  `${getEntryDate(entry)}:${entry.campaignId}`;

const toItem = (entry: PointHistoryEntry): PointHistoryItem => ({
  key: entry.id,
  type: entry.type,
  amount: entry.amount,
  occurredAt: entry.occurredAt,
  campaignId: entry.campaignId,
  serving: null,
});

// 집행일 하루를 한 줄로 묶는다. 예약 해제가 끝난 날은 "예약 − 예약 해제 = 소진"이라 소진 한 줄로 보여주고,
// 예약 해제 전인 오늘은 아직 소진이 정해지지 않아 예약 한 줄로 보여준다.
// 서버 원장에는 소진(DEDUCT)이 없어, 예약 해제 전의 소진은 소진 집계(todaySpent)로 받는다
const toServingItem = (
  anchor: PointHistoryEntry,
  group: PointHistoryEntry[],
  todaySpent: Record<string, number> | null,
): PointHistoryItem => {
  // 잔액이 모자라 적게 예약한 날은 충전 뒤 예약을 다시 잡아 예약이 여러 줄이라 모두 더한다
  const reserved = -group
    .filter((entry) => entry.type === 'RESERVE')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const isReleased = anchor.type === 'RELEASE';
  const released = isReleased ? anchor.amount : null;
  // 소진 집계는 오늘 것만 받으므로 오늘 묶음에만 쓴다
  const isToday = getEntryDate(anchor) === toKstDateKey(new Date());
  // 소진 집계에 없는 캠페인은 아직 노출되지 않아 소진이 0이다
  const unreleasedSpent =
    !isToday || todaySpent === null
      ? null
      : (todaySpent[anchor.campaignId ?? ''] ?? 0);
  const spent = released === null ? unreleasedSpent : reserved - released;

  return {
    ...toItem(anchor),
    type: isReleased ? 'DEDUCT' : 'RESERVE',
    amount: isReleased ? -(spent ?? 0) : -reserved,
    serving: { reserved, spent, released, isToday },
  };
};

// 최신순 내역을 날짜별로 묶는다. 같은 날 몫인 같은 캠페인의 예약, 소진, 예약 해제는 한 줄로 묶고
// 예약 해제가 있으면 예약 해제 자리에, 없으면 예약 자리에 둔다.
// 예약이 없는 묶음(조회 기간 첫날에 기록된 전날 몫의 예약 해제 등)은 묶지 않고 한 줄씩 보여준다
export const groupPointHistory = (
  entries: PointHistoryEntry[],
  todaySpent: Record<string, number> | null,
): PointHistoryDay[] => {
  const servingGroups = new Map<string, PointHistoryEntry[]>();

  entries.filter(isServingEntry).forEach((entry) => {
    const key = getServingKey(entry);

    servingGroups.set(key, [...(servingGroups.get(key) ?? []), entry]);
  });

  const itemsByDate = new Map<string, PointHistoryItem[]>();

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

      item = toServingItem(entry, group, todaySpent);
    }

    const date = getEntryDate(entry);

    itemsByDate.set(date, [...(itemsByDate.get(date) ?? []), item]);
  });

  // 예약 해제는 다음 날 00:00에 기록되어 목록 순서와 날짜가 어긋날 수 있어, 날짜별로 모은 뒤 최신 날짜부터 둔다
  return [...itemsByDate]
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date));
};

// +30,000P, −2,800P. 빼기는 하이픈보다 잘 보이는 마이너스 기호를 쓴다
export const formatSignedPoints = (amount: number) => {
  if (amount > 0) {
    return `+${formatPoints(amount)}`;
  }

  return amount < 0 ? `−${formatPoints(-amount)}` : formatPoints(0);
};

// 집행일 묶음의 보조 줄. 예약 해제 전인 지난날은 소진도 해제 시각도 알 수 없어 보여주지 않는다
export const formatServingSummary = ({
  isToday,
  released,
  reserved,
  spent,
}: ServingSummary) => {
  if (released !== null) {
    return `예약 ${formatPoints(reserved)} · 예약 해제 ${formatPoints(released)}`;
  }

  if (!isToday) {
    return null;
  }

  return spent === null
    ? '남은 예약은 13:30에 해제돼요'
    : `지금까지 소진 ${formatPoints(spent)} · 남은 예약은 13:30에 해제돼요`;
};
