import type { Campaign } from '@owner/api/campaign';
import { type CampaignDayReport, getKstToday } from '@owner/api/report';

export type TrendMetric = 'impression' | 'conversion' | 'spent';

export interface TrendSeries {
  key: string;
  label: string;
  unit: string;
  // SVG stroke·fill에 그대로 쓰는 CSS 색
  color: string;
  // 색만으로 구분하지 않도록 선마다 다른 점선을 쓴다. 없으면 실선
  dash?: string;
  getValue: (day: CampaignDayReport) => number;
}

export interface TrendMetricOption {
  value: TrendMetric;
  label: string;
  unitLabel: string;
  kind: 'bar' | 'line';
  series: TrendSeries[];
}

export const trendMetricOptions: TrendMetricOption[] = [
  {
    value: 'impression',
    label: '노출',
    unitLabel: '단위: 회 (유효 노출)',
    kind: 'bar',
    series: [
      {
        key: 'validImpressionCount',
        label: '유효 노출',
        unit: '회',
        color: 'var(--semantic-action-primary)',
        getValue: (day) => day.validImpressionCount,
      },
    ],
  },
  {
    value: 'conversion',
    label: '찜·발급·사용',
    unitLabel: '단위: 건',
    kind: 'line',
    series: [
      {
        key: 'wishCount',
        label: '찜',
        unit: '건',
        color: 'var(--analytics-wish)',
        dash: '2 4',
        getValue: (day) => day.wishCount,
      },
      {
        key: 'issuedCount',
        label: '발급',
        unit: '건',
        color: 'var(--analytics-issued)',
        dash: '6 4',
        getValue: (day) => day.issuedCount,
      },
      {
        key: 'redeemCount',
        label: '사용',
        unit: '건',
        color: 'var(--analytics-redeem)',
        getValue: (day) => day.redeemCount,
      },
    ],
  },
  {
    value: 'spent',
    label: '소진 포인트',
    unitLabel: '단위: P',
    kind: 'bar',
    series: [
      {
        key: 'spentPoints',
        label: '소진 포인트',
        unit: 'P',
        color: 'var(--semantic-action-primary)',
        getValue: (day) => day.spentPoints,
      },
    ],
  },
];

export interface TrendDay {
  // YYYY-MM-DD
  date: string;
  // 아직 집계되지 않은 날이면 null. 0으로 채우지 않는다
  report: CampaignDayReport | null;
  isToday: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

// 집행 시작일부터 오늘과 집행 종료일 중 앞선 날까지 하루씩 둔다. 리포트에 없는 날도 자리를 둔다
export const getTrendDays = (
  campaign: Campaign,
  report: CampaignDayReport[],
): TrendDay[] => {
  const today = getKstToday();
  const { endDate, startDate } = campaign.budget;
  const lastDate = endDate < today ? endDate : today;
  const reportByDate = new Map(report.map((day) => [day.date, day]));
  const days: TrendDay[] = [];

  for (let date = startDate; date <= lastDate; date = addDays(date, 1)) {
    days.push({
      date,
      report: reportByDate.get(date) ?? null,
      isToday: date === today,
    });
  }

  return days;
};

// 집계되지 않은 날의 상태. 오늘은 집계 중, 지난날은 아직 집계 전이다
export const getPendingLabel = (day: TrendDay) =>
  day.isToday ? '집계 중' : '집계 전';
