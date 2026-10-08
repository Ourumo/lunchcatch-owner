import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

import type { ServingDayPerformance } from '@owner/api/report';
import {
  formatNumber,
  formatShortDate,
} from '@owner/components/campaignFormat';

const ANALYTICS_PATH = '/store/analytics';
// 가장 많이 쓴 날의 막대 높이(px). 나머지는 이 높이에 비례한다
const MAX_BAR_HEIGHT = 96;

const getBarHeight = (count: number, maxCount: number) =>
  maxCount > 0 ? Math.round((count / maxCount) * MAX_BAR_HEIGHT) : 0;

const getDayLabel = ({
  date,
  isConfirmed,
  redeemedCount,
}: ServingDayPerformance) =>
  `${formatShortDate(date)} ${formatNumber(redeemedCount)}장${isConfirmed ? '' : ' (집계 중)'}`;

// 막대마다 사용 장수를 붙이므로 축과 눈금은 두지 않는다. 막대는 중립색으로 두고,
// 집계가 끝나지 않은 날은 점선 막대와 "집계 중"으로 구분한다
const ServingDayChart = ({ days }: { days: ServingDayPerformance[] }) => {
  const maxCount = Math.max(...days.map(({ redeemedCount }) => redeemedCount));

  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-5 items-end">
        {days.map(({ date, isConfirmed, redeemedCount }) => (
          <div className="flex flex-col items-center gap-1.5" key={date}>
            <span
              className={[
                'text-caption-mobile font-bold',
                isConfirmed ? 'text-text-primary' : 'text-text-secondary',
              ].join(' ')}
            >
              {formatNumber(redeemedCount)}장
            </span>
            <span
              className={[
                'block w-6 rounded-t-[4px]',
                isConfirmed
                  ? 'bg-border-subtle'
                  : 'border-2 border-b-0 border-dashed border-text-tertiary bg-surface-subtle',
              ].join(' ')}
              style={{ height: getBarHeight(redeemedCount, maxCount) }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 border-t border-border-subtle pt-2">
        {days.map(({ date, isConfirmed }) => (
          <div className="flex flex-col items-center" key={date}>
            <span
              className={[
                'text-caption-mobile',
                isConfirmed
                  ? 'text-text-secondary'
                  : 'font-bold text-text-primary',
              ].join(' ')}
            >
              {formatShortDate(date)}
            </span>
            {!isConfirmed && (
              <span className="text-caption-mobile text-text-secondary">
                집계 중
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export interface RecentPerformanceProps {
  // 최근 집행일 5회, 오래된 날짜부터
  days: ServingDayPerformance[];
}

// 쿠폰 사용 추이. 여러 캠페인에 걸친 가게 단위 기록이라 자세한 분석은 가게 관리 > 분석에 둔다.
// 캠페인이 매일 열리지 않아 날짜 간격이 일정하지 않으므로 막대마다 날짜를 붙인다
export const RecentPerformance = ({ days }: RecentPerformanceProps) => (
  <section className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-baseline gap-1.5 text-body-mobile font-bold text-text-primary">
        쿠폰 사용 추이
        <span className="text-caption-mobile font-medium text-text-secondary">
          최근 집행일 5회
        </span>
      </h2>
      <Link
        className="-mr-2 flex h-11 items-center gap-0.5 rounded-full px-2 text-body-sm-mobile text-text-secondary focus-visible:outline-2 focus-visible:outline-action-primary"
        to={ANALYTICS_PATH}
      >
        분석
        <ChevronRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
    <div className="rounded-xl border border-border-subtle bg-bg-surface px-3 pt-5 pb-4">
      {days.length > 0 ? (
        <>
          {/* 막대는 보조 표시라 숨기고, 스크린 리더에는 날짜별 수치를 목록으로 읽어 준다 */}
          <ul className="sr-only">
            {days.map((day) => (
              <li key={day.date}>{getDayLabel(day)}</li>
            ))}
          </ul>
          <ServingDayChart days={days} />
        </>
      ) : (
        <p className="py-6 text-center text-body-sm-mobile text-text-secondary">
          캠페인을 집행하면 날짜별 쿠폰 사용 수가 여기에 보여요
        </p>
      )}
    </div>
  </section>
);
