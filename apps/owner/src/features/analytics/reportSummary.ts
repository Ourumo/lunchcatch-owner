import type { CampaignDayReport } from '@owner/api/report';

export interface ReportSummary {
  redeemCount: number;
  spentPoints: number;
  validImpressionCount: number;
  invalidImpressionCount: number;
  wishCount: number;
  issuedCount: number;
  // 소진 포인트 ÷ 방문. 방문이 없으면 null
  costPerRedeem: number | null;
}

// 집계된 날을 모두 더한다. 오늘과 아직 집계되지 않은 날은 리포트에 없어 들어가지 않는다
export const summarizeReport = (report: CampaignDayReport[]): ReportSummary => {
  const total = report.reduce(
    (sum, day) => ({
      redeemCount: sum.redeemCount + day.redeemCount,
      spentPoints: sum.spentPoints + day.spentPoints,
      validImpressionCount: sum.validImpressionCount + day.validImpressionCount,
      invalidImpressionCount:
        sum.invalidImpressionCount + day.invalidImpressionCount,
      wishCount: sum.wishCount + day.wishCount,
      issuedCount: sum.issuedCount + day.issuedCount,
    }),
    {
      redeemCount: 0,
      spentPoints: 0,
      validImpressionCount: 0,
      invalidImpressionCount: 0,
      wishCount: 0,
      issuedCount: 0,
    },
  );

  return {
    ...total,
    costPerRedeem:
      total.redeemCount > 0
        ? Math.round(total.spentPoints / total.redeemCount)
        : null,
  };
};
