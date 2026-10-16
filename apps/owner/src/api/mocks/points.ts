import type { PointHistoryType } from '@owner/api/points';

import { daysFromToday } from './campaigns';

// 정산의 포인트 원장 한 줄. 잔액과 예약 중 포인트의 변화를 따로 기록한다 (관리자 앱 billing 원장과 같은 구조).
// 예약은 잔액에서 예약 중 포인트로 옮기고, 소진은 예약 중 포인트에서만 빼고, 예약 해제는 쓰지 않은 예약을 잔액으로 돌린다
export interface MockLedgerEntry {
  id: string;
  type: PointHistoryType;
  occurredAt: string;
  balanceDelta: number;
  reservedDelta: number;
  campaignId: string | null;
}

// 내역 조회 실패 화면을 확인하려면 true로 바꾼다. 잔액은 서버 API라 이 값과 상관없다
export const MOCK_LEDGER_FAILS = false;

// 오늘 기준 며칠 뒤(음수면 며칠 전)의 한국 시각
const at = (days: number, time: string) =>
  `${daysFromToday(days)}T${time}:00+09:00`;

type MockLedgerRecord = Omit<MockLedgerEntry, 'id'>;

const charge = (days: number, amount: number): MockLedgerRecord => ({
  type: 'CHARGE',
  occurredAt: at(days, '09:20'),
  balanceDelta: amount,
  reservedDelta: 0,
  campaignId: null,
});

// 집행일 하루의 예약(00:00), 소진, 예약 해제(13:30). 소진은 노출마다가 아니라 서버가 캠페인별·일별로 묶어 준다고 가정한다
const servingDay = (
  campaignId: string,
  days: number,
  reserved: number,
  spent: number,
): MockLedgerRecord[] => [
  {
    type: 'RESERVE',
    occurredAt: at(days, '00:00'),
    balanceDelta: -reserved,
    reservedDelta: reserved,
    campaignId,
  },
  {
    type: 'DEDUCT',
    occurredAt: at(days, '12:59'),
    balanceDelta: 0,
    reservedDelta: -spent,
    campaignId,
  },
  {
    type: 'RELEASE',
    occurredAt: at(days, '13:30'),
    balanceDelta: reserved - spent,
    reservedDelta: -(reserved - spent),
    campaignId,
  },
];

// 캠페인 mock의 집행 기간, 하루 예산, 총 소진과 맞춘다. 잔액이 하루 예산보다 많아 매일 하루 예산만큼 예약한다
const servingDays = (
  campaignId: string,
  startDays: number,
  dailyBudget: number,
  dailySpent: number[],
) =>
  dailySpent.flatMap((spent, index) =>
    servingDay(campaignId, startDays + index, dailyBudget, spent),
  );

// 최근 3개월 원장. 시간순으로 둔다.
// 오늘은 진행 중 캠페인의 서빙 중(예약 해제 전)으로 두어, 캠페인 mock의 오늘 예약 10,000P · 소진 2,800P와 맞춘다
const records: MockLedgerRecord[] = [
  charge(-84, 100000),
  ...servingDays(
    'campaign-ended-4',
    -77,
    6000,
    [3200, 4100, 3600, 4500, 3900, 4300, 3700],
  ),
  charge(-60, 50000),
  ...servingDays(
    'campaign-ended-3',
    -56,
    7000,
    [6200, 6500, 6100, 6800, 6400, 7000, 5800],
  ),
  charge(-40, 30000),
  ...servingDays(
    'campaign-ended-2',
    -35,
    5000,
    [4600, 4800, 4500, 5000, 4700, 4900, 4600],
  ),
  charge(-25, 50000),
  ...servingDays(
    'campaign-ended-1',
    -20,
    12000,
    [9800, 10400, 9600, 11200, 10100, 10300, 9000],
  ),
  // 13:30 예약 해제 뒤에 발견된 소진 누락은 잔액에서 조정으로 뺀다 (공통 명세 "노출 차감 및 원장 기록")
  {
    type: 'ADJUST',
    occurredAt: at(-13, '00:00'),
    balanceDelta: -300,
    reservedDelta: 0,
    campaignId: 'campaign-ended-1',
  },
  charge(-5, 30000),
  ...servingDays('campaign-active', -3, 10000, [9200, 9600, 9600]),
  {
    type: 'RESERVE',
    occurredAt: at(0, '00:00'),
    balanceDelta: -10000,
    reservedDelta: 10000,
    campaignId: 'campaign-active',
  },
  {
    type: 'DEDUCT',
    occurredAt: at(0, '11:40'),
    balanceDelta: 0,
    reservedDelta: -2800,
    campaignId: 'campaign-active',
  },
];

// 점주 포인트 원장. 잔액은 하루 예산 x 7일보다 적어 캠페인 등록에서 잔액 부족 안내를 확인할 수 있다
export const mockPointLedger: MockLedgerEntry[] = records.map(
  (record, index) => ({ id: `ledger-${index + 1}`, ...record }),
);
