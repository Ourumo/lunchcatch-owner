import { getKstTime, getKstToday, toKstDateTime } from './date';
import type { MockCampaign, MockDb } from './seed';
import { getStatsByDate, toRatio } from './stats';

// 매장의 쿠폰 사용 이력. 날짜별 사용 수(stats.ts)만큼 사용 기록을 만들고, QR로 사용 처리한 기록을 더한다.
// 같은 날짜는 언제 물어도 같은 기록이 나온다

// 쿠폰 한 장의 할인 금액. 금액 할인은 그 금액, 비율 할인은 할인 메뉴 가격의 비율이다
export const getDiscountAmount = (db: MockDb, campaign: MockCampaign) => {
  if (campaign.discountType === 'AMOUNT') return campaign.discountValue;

  const menu = db.store.menus.find(
    ({ menuId }) => menuId === campaign.targetMenuId,
  );

  return Math.round(((menu?.price ?? 0) * campaign.discountValue) / 100);
};

// HH:mm:ss를 분으로
const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const toTime = (minutes: number, seconds: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

export interface MockCouponUsage {
  usageHistoryId: number;
  memberCouponId: number;
  discountAmount: number;
  useTime: string;
}

// 기간(양 끝 포함) 안의 사용 기록. 최신순이고, 오늘은 지금 시각까지만 있다
export const getCouponUsages = (
  db: MockDb,
  from: string,
  to: string,
): MockCouponUsage[] => {
  const today = getKstToday();
  const nowTime = getKstTime();

  const generated = db.campaigns.flatMap((campaign) => {
    const start = toMinutes(campaign.usableStartTime);
    const length = Math.max(toMinutes(campaign.usableEndTime) - start, 1);
    const discountAmount = getDiscountAmount(db, campaign);

    return getStatsByDate(campaign, from, to).flatMap(({ date, usedCount }) =>
      Array.from({ length: usedCount }, (_, index) => {
        const key = `${campaign.campaignId}:${date}:${index}`;
        const time = toTime(
          start + Math.floor(toRatio(`${key}:minute`) * length),
          Math.floor(toRatio(`${key}:second`) * 60),
        );
        const id = Number(
          `${date.replaceAll('-', '')}${campaign.campaignId}${String(index).padStart(3, '0')}`,
        );

        return { id, date, time, discountAmount };
      }).filter(({ date: day, time }) => day !== today || time <= nowTime),
    );
  });

  const usages = [
    ...generated.map(({ date, discountAmount, id, time }) => ({
      usageHistoryId: id,
      memberCouponId: id,
      discountAmount,
      useTime: toKstDateTime(date, time),
    })),
    ...db.redemptions
      .filter(({ useTime }) => {
        const date = useTime.slice(0, 10);

        return from <= date && date <= to;
      })
      .map(({ discountAmount, usageHistoryId, useTime }) => ({
        usageHistoryId,
        memberCouponId: usageHistoryId,
        discountAmount,
        useTime,
      })),
  ];

  return usages.sort((a, b) => b.useTime.localeCompare(a.useTime));
};
