import { type DateRangeValue, formatDateValue } from './dateRangeUtils';

interface MonthRangeCalendarProps {
  visibleMonth: Date;
  selectedRange: DateRangeValue;
  onSelect: (date: string) => void;
  maxDate?: string;
}

export const MonthRangeCalendar = ({
  visibleMonth,
  selectedRange,
  onSelect,
  maxDate,
}: MonthRangeCalendarProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 12 }, (_, month) => {
        const date = formatDateValue(
          new Date(visibleMonth.getFullYear(), month, 1),
        );
        const monthKey = date.slice(0, 7);
        const isUnavailable = !!maxDate && date > maxDate;
        const boundary =
          monthKey === selectedRange.startDate.slice(0, 7) ||
          monthKey === selectedRange.endDate.slice(0, 7);
        const inRange =
          Boolean(selectedRange.startDate && selectedRange.endDate) &&
          monthKey >= selectedRange.startDate.slice(0, 7) &&
          monthKey <= selectedRange.endDate.slice(0, 7);
        return (
          <button
            key={date}
            type="button"
            aria-label={`${visibleMonth.getFullYear()}년 ${month + 1}월 선택`}
            aria-pressed={boundary || inRange}
            disabled={isUnavailable}
            className={`h-10 rounded-md text-caption-web transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary ${isUnavailable ? 'cursor-not-allowed text-text-disabled' : boundary ? 'bg-action-primary font-semibold text-text-inverse' : inRange ? 'bg-surface-brand text-text-brand' : 'text-text-primary hover:bg-surface-subtle'}`}
            onClick={() => onSelect(date)}
          >
            {month + 1}월
          </button>
        );
      })}
    </div>
  );
};
