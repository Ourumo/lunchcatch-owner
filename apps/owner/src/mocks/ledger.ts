import { addDays, getKstToday, toKstDateTime } from './date';
import type { MockDb, MockLedgerEntry } from './seed';
import { getStatsByDate } from './stats';

// 포인트 원장 전체와 잔액. 잔액은 원장 합계라, 내역 화면의 기록과 홈 · 캠페인 화면의 잔액이 늘 맞는다.
//
// 서버 원장 규칙(api/points.ts)
// - 충전(CHARGE)은 +, 환불(REFUND)은 −
// - 캠페인 집행일 00:00에 하루 예산을 예약(RESERVE, −)하고, 다음 날 00:00에 쓰지 않은 만큼을 예약 해제(RELEASE, +)한다
// - 노출마다 쌓이는 소진(DEDUCT)은 원장으로 내리지 않는다
// 충전 · 환불은 db.ledger에 기록하고, 예약 · 예약 해제는 날짜별 실적(stats.ts)에서 계산한다

// 계산한 기록의 ID. 저장한 기록(작은 수)과 겹치지 않게 날짜와 캠페인으로 만든다
const toComputedId = (campaignId: number, date: string, kind: 1 | 2) =>
  Number(`${date.replaceAll('-', '')}${campaignId}${kind}`);

const getCampaignEntries = (db: MockDb): MockLedgerEntry[] => {
  const today = getKstToday();

  return db.campaigns.flatMap((campaign) =>
    getStatsByDate(campaign, '', today).flatMap(
      ({ date, reservedPoint, spentPoint }): MockLedgerEntry[] => {
        const reserve: MockLedgerEntry = {
          ledgerId: toComputedId(campaign.campaignId, date, 1),
          entryType: 'RESERVE',
          amount: -reservedPoint,
          campaignId: campaign.campaignId,
          businessDate: date,
          paymentId: null,
          createdAt: toKstDateTime(date, '00:00:00'),
        };

        // 오늘 몫은 내일 00:00에 해제된다
        if (date === today) return [reserve];

        return [
          reserve,
          {
            ledgerId: toComputedId(campaign.campaignId, date, 2),
            entryType: 'RELEASE',
            amount: reservedPoint - spentPoint,
            campaignId: campaign.campaignId,
            businessDate: date,
            paymentId: null,
            createdAt: toKstDateTime(addDays(date, 1), '00:00:05'),
          },
        ];
      },
    ),
  );
};

// 원장 전체. 최신순
export const getLedger = (db: MockDb) =>
  [...db.ledger, ...getCampaignEntries(db)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

export const getBalance = (db: MockDb) =>
  getLedger(db).reduce((sum, { amount }) => sum + amount, 0);

// 오늘 예약했지만 아직 쓰지 않은 포인트
export const getReservedPoint = (db: MockDb) => {
  const today = getKstToday();

  return db.campaigns.reduce(
    (sum, campaign) =>
      sum +
      getStatsByDate(campaign, today, today).reduce(
        (daySum, { reservedPoint, spentPoint }) =>
          daySum + reservedPoint - spentPoint,
        0,
      ),
    0,
  );
};
