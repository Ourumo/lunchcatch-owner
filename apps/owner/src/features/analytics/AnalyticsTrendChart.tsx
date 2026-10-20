import type { KeyboardEvent, PointerEvent } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import {
  getChartAxisMaximum,
  getChartLabelInterval,
  getNearestChartIndex,
} from './analyticsChartUtils';

const chartLayout = {
  height: 200,
  left: 44,
  right: 8,
  top: 12,
  bottom: 168,
  labelY: 190,
};

// 막대 사이에 두는 간격과 막대 끝의 둥근 정도
const BAR_GAP = 2;
const BAR_RADIUS = 4;
const MAX_BAR_WIDTH = 24;

const axisFormatter = new Intl.NumberFormat('ko-KR', { notation: 'compact' });

export interface TrendChartSeries {
  key: string;
  color: string;
  dash?: string;
  // 집계되지 않은 날은 null
  values: (number | null)[];
}

export interface AnalyticsTrendChartProps {
  kind: 'bar' | 'line';
  labels: string[];
  series: TrendChartSeries[];
  // 집계되지 않은 날. 칸 배경을 옅게 칠해 비어 있는 이유를 구분한다
  pending: boolean[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  ariaLabel: string;
}

// 막대의 데이터 쪽 끝만 둥글게 그린다. 음수 막대는 아래쪽 끝이 둥글다
const getBarPath = (left: number, width: number, base: number, end: number) => {
  const height = Math.abs(end - base);
  const radius = Math.min(BAR_RADIUS, width / 2, height);
  const right = left + width;

  if (end <= base) {
    return `M${left},${base} V${end + radius} Q${left},${end} ${left + radius},${end} H${right - radius} Q${right},${end} ${right},${end + radius} V${base} Z`;
  }

  return `M${left},${base} V${end - radius} Q${left},${end} ${left + radius},${end} H${right - radius} Q${right},${end} ${right},${end - radius} V${base} Z`;
};

// 일별 추이 막대·선 차트. 날짜마다 같은 너비의 칸을 두고 칸 가운데에 값을 그린다
export const AnalyticsTrendChart = ({
  activeIndex,
  ariaLabel,
  kind,
  labels,
  onActiveIndexChange,
  pending,
  series,
}: AnalyticsTrendChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useLayoutEffect(() => {
    const container = chartRef.current;

    if (!container) {
      return;
    }

    // 화면 너비에 맞춰 좌표계를 바꿔 좁은 화면에서도 축 글자가 작아지지 않게 한다
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(160, Math.round(entry.contentRect.width)));
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const count = labels.length;
  const plotWidth = width - chartLayout.left - chartLayout.right;
  const band = plotWidth / count;
  const values = series.flatMap(({ values: seriesValues }) =>
    seriesValues.filter((value): value is number => value !== null),
  );
  // 환급으로 소진 포인트가 음수일 수 있어 0 아래 구간도 둔다.
  // 0을 기준으로 같은 간격의 눈금을 두고, 위아래 중 큰 쪽으로 간격을 정한다
  const highest = Math.max(0, ...values);
  const lowest = Math.min(0, ...values);
  const tickStep = getChartAxisMaximum([Math.max(highest, -lowest)]) / 4;
  const max = Math.max(1, Math.ceil(highest / tickStep)) * tickStep;
  const min = lowest < 0 ? -Math.ceil(-lowest / tickStep) * tickStep : 0;
  const ticks = Array.from(
    { length: Math.round((max - min) / tickStep) + 1 },
    (_, index) => min + index * tickStep,
  );
  const x = (index: number) => chartLayout.left + band * (index + 0.5);
  const y = (value: number) =>
    chartLayout.bottom -
    ((value - min) / (max - min)) * (chartLayout.bottom - chartLayout.top);
  const barWidth = Math.max(1, Math.min(MAX_BAR_WIDTH, band - BAR_GAP));
  const labelInterval = getChartLabelInterval(count, width);

  const showLabel = (index: number) =>
    index === 0 ||
    index === count - 1 ||
    (index % labelInterval === 0 && index < count - 1 - labelInterval / 2);

  const getLabelAnchor = (index: number) => {
    if (count === 1) return 'middle';
    if (index === 0) return 'start';
    if (index === count - 1) return 'end';
    return 'middle';
  };

  // 집계되지 않은 날을 0으로 그리거나 양옆의 날과 잇지 않는다
  const getSegments = (seriesValues: (number | null)[]) => {
    const segments: { start: number; end: number; points: string }[] = [];

    seriesValues.forEach((value, index) => {
      if (value === null) return;

      const point = `${x(index)},${y(value)}`;
      const last = segments.at(-1);

      if (last && last.end === index - 1) {
        last.points += ` ${point}`;
        last.end = index;
      } else {
        segments.push({ start: index, end: index, points: point });
      }
    });

    return segments;
  };

  const handlePointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    // 화면 좌표를 SVG 좌표로 바꿔 가장 가까운 날을 고른다
    const position = ((event.clientX - bounds.left) / bounds.width) * width;

    onActiveIndexChange(
      getNearestChartIndex(
        position,
        chartLayout.left + band / 2,
        plotWidth - band,
        count,
      ),
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nextIndex = {
      ArrowLeft: activeIndex - 1,
      ArrowRight: activeIndex + 1,
      Home: 0,
      End: count - 1,
    }[event.key];

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    onActiveIndexChange(Math.max(0, Math.min(count - 1, nextIndex)));
  };

  return (
    <div
      aria-label={ariaLabel}
      className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      onKeyDown={handleKeyDown}
      ref={chartRef}
      role="group"
      tabIndex={0}
    >
      <svg
        aria-hidden="true"
        className="block w-full touch-pan-y text-caption-mobile"
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
        style={{ height: chartLayout.height }}
        viewBox={`0 0 ${width} ${chartLayout.height}`}
      >
        {pending.map(
          (isPending, index) =>
            isPending && (
              <rect
                fill="var(--semantic-text-tertiary)"
                fillOpacity="0.14"
                height={chartLayout.bottom - chartLayout.top}
                key={index}
                width={band}
                x={x(index) - band / 2}
                y={chartLayout.top}
              />
            ),
        )}
        {ticks.map((value) => (
          <g key={value}>
            <line
              stroke="var(--semantic-border-subtle)"
              strokeDasharray={value === 0 ? undefined : '2 6'}
              x1={chartLayout.left}
              x2={width - chartLayout.right}
              y1={y(value)}
              y2={y(value)}
            />
            <text
              fill="var(--semantic-text-tertiary)"
              textAnchor="end"
              x={chartLayout.left - 8}
              y={y(value) + 4}
            >
              {axisFormatter.format(value)}
            </text>
          </g>
        ))}
        {/* 고른 날. 막대와 선 아래에 둔다 */}
        <line
          stroke="var(--semantic-text-tertiary)"
          strokeDasharray="4 4"
          strokeOpacity="0.6"
          x1={x(activeIndex)}
          x2={x(activeIndex)}
          y1={chartLayout.top}
          y2={chartLayout.bottom}
        />
        {kind === 'bar' &&
          series.map((item) =>
            item.values.map(
              (value, index) =>
                value !== null &&
                value !== 0 && (
                  <path
                    d={getBarPath(
                      x(index) - barWidth / 2,
                      barWidth,
                      y(0),
                      y(value),
                    )}
                    fill={item.color}
                    key={`${item.key}-${index}`}
                  />
                ),
            ),
          )}
        {kind === 'line' && (
          <>
            {series.map((item) =>
              getSegments(item.values).map((segment) =>
                segment.start === segment.end ? (
                  // 앞뒤 날이 비어 선으로 이어지지 않는 날은 점으로 보여준다
                  <circle
                    cx={x(segment.start)}
                    cy={y(item.values[segment.start] ?? 0)}
                    fill={item.color}
                    key={`${item.key}-${segment.start}`}
                    r="3"
                  />
                ) : (
                  <polyline
                    fill="none"
                    key={`${item.key}-${segment.start}`}
                    points={segment.points}
                    stroke={item.color}
                    strokeDasharray={item.dash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                ),
              ),
            )}
            {series.map((item) => {
              const value = item.values[activeIndex];

              return (
                value !== null && (
                  <circle
                    cx={x(activeIndex)}
                    cy={y(value)}
                    fill={item.color}
                    key={item.key}
                    r="4"
                    stroke="var(--semantic-bg-surface)"
                    strokeWidth="2"
                  />
                )
              );
            })}
          </>
        )}
        {labels.map(
          (label, index) =>
            showLabel(index) && (
              <text
                fill={
                  index === activeIndex
                    ? 'var(--semantic-text-primary)'
                    : 'var(--semantic-text-tertiary)'
                }
                key={index}
                textAnchor={getLabelAnchor(index)}
                x={
                  getLabelAnchor(index) === 'start'
                    ? x(index) - band / 2
                    : getLabelAnchor(index) === 'end'
                      ? x(index) + band / 2
                      : x(index)
                }
                y={chartLayout.labelY}
              >
                {label}
              </text>
            ),
        )}
      </svg>
    </div>
  );
};
