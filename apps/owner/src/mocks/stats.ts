import { eachDate, getKstHour, getKstToday } from './date';
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

// 문자열을 0 이상 1 미만의 수로 바꾼다. 같은 문자열이면 늘 같은 수다 (FNV-1a 해시)
const toRatio = (key: string) => {
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

  const today = getKstToday();

  return eachDate(startDate, endDate < today ? endDate : today);
};

const getDailyStats = (campaign: MockCampaign, date: string): DailyStats => {
  const key = `${campaign.campaignId}:${date}`;
  const progress = date === getKstToday() ? getTodayProgress() : 1;
  const dailyBudget = campaign.dailyBudget ?? 0;

  // 발급 수량의 60~100%가 발급되고, 그중 50~90%가 매장에서 사용된다
  const issuedCount = Math.round(
    campaign.issueQuantity * (0.6 + 0.4 * toRatio(`${key}:issued`)) * progress,
  );
  const usedCount = Math.round(
    issuedCount * (0.5 + 0.4 * toRatio(`${key}:used`)),
  );

  return {
    wishCount: Math.round(
      campaign.issueQuantity * (1.2 + toRatio(`${key}:wish`)) * progress,
    ),
    issuedCount,
    usedCount,
    // 하루 예산의 70~100%를 노출에 쓴다
    spentPoint:
      Math.round(
        (dailyBudget * (0.7 + 0.3 * toRatio(`${key}:spent`)) * progress) / 10,
      ) * 10,
    reservedPoint: dailyBudget,
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
