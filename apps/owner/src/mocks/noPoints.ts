import { addDays, getKstTime, getKstToday } from './date';
import { getBalance, getLedger } from './ledger';
import { createSeed, type MockDb } from './seed';
import { IMPRESSION_UNIT_COST } from './stats';

// 잔액 부족으로 멈춘 캠페인 (docs/requirements-owner.md "잔액 부족 시 캠페인 게재 중단")
//
// 진짜 서버: 매일 00:00에 캠페인마다 min(하루 예산, 잔액)을 예약하고, 예약액이 노출 단가보다 적으면 PAUSED(NO_POINTS)로 바꾼다.
//            충전하면 그날 예약을 다시 잡고, 노출 단가 이상이 되면 ACTIVE로 되돌린다(자동 재개)
// 목 서버:   시연에서는 하루가 지나지 않아 이 상황이 저절로 생기지 않는다. 그래서 홈의 시연 버튼(features/home/DemoNoPointsCard.tsx)으로
//            "어제 잔액이 하루 예산보다 적어 남은 만큼만 예약해 모두 썼고, 오늘 00:00에는 예약할 포인트가 없었다"는 시연 데이터로 바꾼다.
//            충전 확정(handlers/payments.ts)은 진짜 서버처럼 예약을 다시 잡고 캠페인을 다시 시작한다

// 어제 00:00 잔액을 이 값 이상으로 맞춘다. 그 전날 소진(하루 예산의 70% 이상)을 더하면
// 그 전날 00:00 잔액이 하루 예산(2만) 이상이라, 어제까지는 하루 예산을 모두 예약한 것으로 맞는다
const MIN_BALANCE_AT_YESTERDAY = 6000;

// 충전 금액을 맞출 단위. 충전 금액은 1만 원 단위다
const CHARGE_UNIT = 10000;

// 기본 시연 데이터(createSeed)의 충전 중 금액을 맞출 충전과 빼는 충전. 시연 데이터의 충전 ID를 바꾸면 함께 바꾼다
const ADJUSTED_PAYMENT_ID = 2;
const REMOVED_PAYMENT_ID = 4;

// 잔액 부족으로 멈춘 시연 데이터. 기본 시연 데이터에서 진행 중 캠페인을 멈추고, 충전 기록을 그에 맞게 고친다
export const createNoPointsSeed = (): MockDb => {
  const db = createSeed();
  const today = getKstToday();
  const yesterday = addDays(today, -1);
  const campaign = db.campaigns.find(({ status }) => status === 'ACTIVE');

  if (!campaign) return db;

  // 진행 중 캠페인 직전의 충전은 빼고, 그 앞의 충전 금액으로 어제 00:00 잔액을 맞춘다
  db.payments = db.payments.filter(
    ({ paymentId }) => paymentId !== REMOVED_PAYMENT_ID,
  );
  db.ledger = db.ledger.filter(
    ({ paymentId }) => paymentId !== REMOVED_PAYMENT_ID,
  );

  const setChargeAmount = (amount: number) => {
    db.payments.forEach((payment) => {
      if (payment.paymentId === ADJUSTED_PAYMENT_ID) payment.amount = amount;
    });
    db.ledger.forEach((entry) => {
      if (entry.paymentId === ADJUSTED_PAYMENT_ID) entry.amount = amount;
    });
  };

  // 맞출 충전이 없다고 보고 어제 00:00 예약 직전 잔액을 구한다. 진행 중 캠페인의 어제 · 오늘 예약과 예약 해제만 빼면 된다
  setChargeAmount(0);

  const balanceWithoutCharge = getLedger(db)
    .filter(
      ({ businessDate, campaignId }) =>
        !(
          campaignId === campaign.campaignId &&
          businessDate &&
          businessDate >= yesterday
        ),
    )
    .reduce((sum, { amount }) => sum + amount, 0);
  const chargeAmount =
    Math.ceil((MIN_BALANCE_AT_YESTERDAY - balanceWithoutCharge) / CHARGE_UNIT) *
    CHARGE_UNIT;

  setChargeAmount(chargeAmount);

  campaign.status = 'PAUSED';
  campaign.pausedReason = 'NO_POINTS';
  // 어제는 남은 잔액을 모두 예약해 다 썼고, 오늘 00:00에는 예약할 포인트가 없었다
  campaign.reserves = {
    [yesterday]: {
      point: balanceWithoutCharge + chargeAmount,
      time: '00:00:00',
    },
    [today]: { point: 0, time: '00:00:00' },
  };

  return db;
};

// 충전한 뒤 잔액 부족으로 멈춘 캠페인을 다시 시작한다. 충전을 원장에 기록한 db를 받아 바꾼다.
// 그날 예약액 = min(하루 예산, 기존 예약액 + 잔액)이고, 노출 단가 이상이면 다시 시작한다. 집행 기간 밖이면 그대로 둔다
export const resumeNoPointsCampaigns = (db: MockDb) => {
  const today = getKstToday();

  db.campaigns.forEach((campaign) => {
    const { dailyBudget, endDate, startDate } = campaign;

    if (
      campaign.status !== 'PAUSED' ||
      campaign.pausedReason !== 'NO_POINTS' ||
      !dailyBudget ||
      !startDate ||
      !endDate ||
      today < startDate ||
      today > endDate
    ) {
      return;
    }

    const reserved = campaign.reserves?.[today]?.point ?? 0;
    const point = Math.min(dailyBudget, reserved + Math.max(getBalance(db), 0));

    if (point < IMPRESSION_UNIT_COST) return;

    campaign.reserves = {
      ...campaign.reserves,
      [today]: { point, time: getKstTime() },
    };
    campaign.status = 'ACTIVE';
    campaign.pausedReason = null;
  });
};
