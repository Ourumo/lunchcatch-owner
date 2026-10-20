import { useId, useState } from 'react';
import { ChoiceChip } from '@repo/ui';

import type { Campaign } from '@owner/api/campaign';
import type { CampaignDayReport } from '@owner/api/report';
import { formatNumber, formatShortDate } from '@owner/ui/campaignFormat';

import { AnalyticsTrendChart } from './AnalyticsTrendChart';
import {
  getPendingLabel,
  getTrendDays,
  type TrendDay,
  type TrendMetric,
  trendMetricOptions,
  type TrendSeries,
} from './trendDays';

// 스크린 리더가 읽는 날짜 (예: 10월 14일)
const formatSpokenDate = (date: string) => {
  const [, month, day] = date.split('-').map(Number);

  return `${month}월 ${day}일`;
};

const formatSeriesValue = (item: TrendSeries, day: TrendDay) =>
  day.report
    ? `${formatNumber(item.getValue(day.report))}${item.unit}`
    : getPendingLabel(day);

// 선 차트의 범례. 색과 함께 선 모양으로도 구분한다
const LineSample = ({ item }: { item: TrendSeries }) => (
  <svg aria-hidden="true" className="h-2 w-5 shrink-0" viewBox="0 0 20 8">
    <line
      stroke={item.color}
      strokeDasharray={item.dash}
      strokeLinecap="round"
      strokeWidth="2"
      x1="1"
      x2="19"
      y1="4"
      y2="4"
    />
  </svg>
);

export interface AnalyticsTrendProps {
  campaign: Campaign;
  report: CampaignDayReport[];
}

// 일별 추이. 집행 시작일부터 하루씩 두고, 집계되지 않은 날은 비워 둔다
export const AnalyticsTrend = ({ campaign, report }: AnalyticsTrendProps) => {
  const days = getTrendDays(campaign, report);
  const chipName = useId();
  const [metric, setMetric] = useState<TrendMetric>('impression');
  // 처음에는 가장 최근 날을 보여준다
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const option =
    trendMetricOptions.find(({ value }) => value === metric) ??
    trendMetricOptions[0];

  if (days.length === 0) {
    return null;
  }

  const active = Math.min(activeIndex ?? days.length - 1, days.length - 1);
  const activeDay = days[active];

  return (
    <section
      aria-labelledby="analytics-trend-title"
      className="rounded-xl border border-border-subtle bg-bg-surface p-4"
    >
      <h2
        className="text-body-mobile font-bold text-text-primary"
        id="analytics-trend-title"
      >
        일별 추이
      </h2>

      <fieldset className="mt-3">
        <legend className="sr-only">볼 지표</legend>
        <div className="flex flex-wrap gap-2">
          {trendMetricOptions.map((item) => (
            <ChoiceChip
              checked={metric === item.value}
              key={item.value}
              name={chipName}
              onChange={() => setMetric(item.value)}
              value={item.value}
            >
              {item.label}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="text-caption-mobile text-text-tertiary">
          {option.unitLabel}
        </p>
        {/* 고른 날의 값. 누르거나 가리키거나 좌우 화살표로 날을 바꾼다 */}
        <dl className="flex flex-col items-end gap-0.5 text-caption-mobile">
          <dt className="sr-only">고른 날</dt>
          <dd className="text-text-secondary">
            {formatShortDate(activeDay.date)}
          </dd>
          {option.series.map((item) => (
            <div className="flex items-center gap-1.5" key={item.key}>
              <dt className="text-text-secondary">{item.label}</dt>
              <dd className="font-bold text-text-primary tabular-nums">
                {formatSeriesValue(item, activeDay)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-2">
        <AnalyticsTrendChart
          activeIndex={active}
          ariaLabel={`${option.label} 일별 추이 차트. 좌우 화살표로 날짜를 옮길 수 있어요`}
          kind={option.kind}
          labels={days.map((day) => formatShortDate(day.date))}
          onActiveIndexChange={setActiveIndex}
          pending={days.map((day) => day.report === null)}
          series={option.series.map((item) => ({
            key: item.key,
            color: item.color,
            dash: item.dash,
            values: days.map((day) =>
              day.report ? item.getValue(day.report) : null,
            ),
          }))}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption-mobile text-text-secondary">
        {option.kind === 'line' &&
          option.series.map((item) => (
            <span className="flex items-center gap-1.5" key={item.key}>
              <LineSample item={item} />
              {item.label}
            </span>
          ))}
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-sm"
            style={{
              backgroundColor: 'var(--semantic-text-tertiary)',
              opacity: 0.14,
            }}
          />
          집계 중·집계 전
        </span>
      </div>

      <ul className="sr-only">
        {days.map((day) => (
          <li key={day.date}>
            {formatSpokenDate(day.date)}:{' '}
            {day.report
              ? option.series
                  .map(
                    (item) => `${item.label} ${formatSeriesValue(item, day)}`,
                  )
                  .join(', ')
              : getPendingLabel(day)}
          </li>
        ))}
      </ul>
    </section>
  );
};
