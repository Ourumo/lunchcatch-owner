import { eachDate, getKstHour, getKstTime, getKstToday } from './date';
import type { MockCampaign } from './seed';

// 캠페인 실적(찜, 발급, 사용, 소진 포인트)을 날짜마다 계산한다.
// 실적을 하나하나 저장하지 않고 (캠페인 ID, 날짜)로 정해지는 값을 만들어,
// 같은 날짜는 언제 다시 물어도 같은 숫자가 나오고 홈 · 캠페인 상세 · 분석 화면의 숫자가 서로 맞는다

export interface DailyStats {
  wishCount: number;
  issuedCount: number;
  usedCount: number;
  spentPoint: number;
  reservedPoint: number;
}

// 과금 노출 1회당 포인트. 그날 예약액이 이보다 적으면 한 번도 노출하지 못해 잔액 부족으로 멈춘다
export const IMPRESSION_UNIT_COST = 10;

// 문자열을 0 이상 1 미만의 수로 바꾼다. 같은 문자열이면 늘 같은 수다 (FNV-1a 해시)
export const toRatio = (key: string) => {
  let hash = 2166136261;

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967296;
};

// 오늘은 아직 하루가 끝나지 않아 지금 시각만큼만 쌓인 것으로 본다.
// 쿠폰은 11:00에 열리므로 그 전에는 0, 15:00 이후에는 하루치를 모두 보여준다
const getTodayProgress = () =>
  Math.min(Math.max((getKstHour() - 11) / 4, 0), 1);

// 포인트는 피드에 노출될 때마다 쓰이고 피드는 하루 종일 보여, 소진은 00:00부터 지난 시간만큼 쌓인 것으로 본다.
// 쿠폰처럼 11:00부터 세면 오전에는 소진이 없어 소진 집계에서 빠지고, 화면이 오늘 예약액을 받지 못한다
const getTodaySpendProgress = () => {
  const [hour = 0, minute = 0] = getKstTime().split(':').map(Number);

  return (hour * 60 + minute + 1) / (24 * 60);
};

// 실적이 쌓이는 날: 진행 중 · 일시중지 · 종료 캠페인의 집행 기간 중 오늘까지
const getServedDates = (campaign: MockCampaign) => {
  const { endDate, startDate, status } = campaign;

  if (
    !startDate ||
    !endDate ||
    !(status === 'ACTIVE' || status === 'PAUSED' || status === 'ENDED')
  ) {
    return [];
  }

  const lastDate = [endDate, campaign.endedOn, getKstToday()]
    .filter((date): date is string => Boolean(date))
    .sort()[0];

  return lastDate ? eachDate(startDate, lastDate) : [];
};

const getDailyStats = (campaign: MockCampaign, date: string): DailyStats => {
  const key = `${campaign.campaignId}:${date}`;
  const isToday = date === getKstToday();
  const progress = isToday ? getTodayProgress() : 1;
  const spendProgress = isToday ? getTodaySpendProgress() : 1;
  const dailyBudget = campaign.dailyBudget ?? 0;
  // 그날 예약액. 보통은 하루 예산이고, 잔액이 모자랐거나 충전으로 다시 잡은 날은 따로 기록한 값이다
  const reservedPoint = campaign.reserves?.[date]?.point ?? dailyBudget;

  // 노출하지 못한 날(잔액 부족으로 멈춤)은 실적이 없다
  if (reservedPoint < IMPRESSION_UNIT_COST) {
    return {
      wishCount: 0,
      issuedCount: 0,
      usedCount: 0,
      spentPoint: 0,
      reservedPoint,
    };
  }

  // 하루 예산보다 적게 예약한 날은 그만큼만 노출해 찜 · 발급도 그 비율로 줄고, 예약한 포인트를 모두 쓴다
  const isPartial = reservedPoint < dailyBudget;
  const scale = isPartial ? reservedPoint / dailyBudget : 1;

  // 발급 수량의 60~100%가 발급되고, 그중 50~90%가 매장에서 사용된다
  const issuedCount = Math.round(
    campaign.issueQuantity *
      (0.6 + 0.4 * toRatio(`${key}:issued`)) *
      progress *
      scale,
  );
  const usedCount = Math.round(
    issuedCount * (0.5 + 0.4 * toRatio(`${key}:used`)),
  );

  return {
    wishCount: Math.round(
      campaign.issueQuantity *
        (1.2 + toRatio(`${key}:wish`)) *
        progress *
        scale,
    ),
    issuedCount,
    usedCount,
    // 하루 예산의 70~100%를 노출에 쓴다(적게 예약한 날은 예약액 전부). 노출 단가 단위로 쓰인다
    spentPoint:
      Math.round(
        ((isPartial
          ? reservedPoint
          : dailyBudget * (0.7 + 0.3 * toRatio(`${key}:spent`))) *
          spendProgress) /
          IMPRESSION_UNIT_COST,
      ) * IMPRESSION_UNIT_COST,
    reservedPoint,
  };
};

// 기간(양 끝 포함) 안의 날짜별 실적. 집행하지 않은 날은 빠진다
export const getStatsByDate = (
  campaign: MockCampaign,
  from: string,
  to: string,
) =>
  getServedDates(campaign)
    .filter((date) => from <= date && date <= to)
    .map((date) => ({ date, ...getDailyStats(campaign, date) }));

// 기간(양 끝 포함) 안의 실적 합계
export const sumStats = (
  campaign: MockCampaign,
  from: string,
  to: string,
): DailyStats =>
  getStatsByDate(campaign, from, to).reduce<DailyStats>(
    (sum, stats) => ({
      wishCount: sum.wishCount + stats.wishCount,
      issuedCount: sum.issuedCount + stats.issuedCount,
      usedCount: sum.usedCount + stats.usedCount,
      spentPoint: sum.spentPoint + stats.spentPoint,
      reservedPoint: sum.reservedPoint + stats.reservedPoint,
    }),
    {
      wishCount: 0,
      issuedCount: 0,
      usedCount: 0,
      spentPoint: 0,
      reservedPoint: 0,
    },
  );
