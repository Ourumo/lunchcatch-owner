import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export interface DateRangeValue {
  endDate: string;
  startDate: string;
}

export interface DateRangePickerProps {
  ariaLabel?: string;
  defaultValue?: DateRangeValue;
  disabled?: boolean;
  onValueChange?: (value: DateRangeValue) => void;
  placeholder?: string;
  value?: DateRangeValue;
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const emptyDateRange: DateRangeValue = { endDate: '', startDate: '' };

const createDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const formatDateValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const formatDateLabel = (value: string) => value.replaceAll('-', '.');

const isSameDate = (firstDate: Date, secondDate: Date) =>
  formatDateValue(firstDate) === formatDateValue(secondDate);

export function DateRangePicker({
  ariaLabel = '날짜 범위 선택',
  defaultValue = emptyDateRange,
  disabled = false,
  onValueChange,
  placeholder = '가입일 범위 선택',
  value,
}: DateRangePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedRange = value ?? uncontrolledValue;
  const referenceDate = selectedRange.startDate
    ? createDate(selectedRange.startDate)
    : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
  );
  const today = new Date();
  const monthStartDay = visibleMonth.getDay();
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleValueChange = (nextValue: DateRangeValue) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handleDateSelect = (nextDate: string) => {
    if (
      isSelectingStartDate ||
      !selectedRange.startDate ||
      selectedRange.endDate
    ) {
      handleValueChange({ endDate: '', startDate: nextDate });
      setIsSelectingStartDate(false);
      return;
    }

    handleValueChange({
      endDate:
        nextDate < selectedRange.startDate ? selectedRange.startDate : nextDate,
      startDate:
        nextDate < selectedRange.startDate ? nextDate : selectedRange.startDate,
    });
    setIsSelectingStartDate(true);
  };

  const handleOpen = () => {
    const monthDate = selectedRange.startDate
      ? createDate(selectedRange.startDate)
      : today;

    setVisibleMonth(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
    setIsSelectingStartDate(
      !selectedRange.startDate || Boolean(selectedRange.endDate),
    );
    setIsOpen((currentIsOpen) => !currentIsOpen);
  };

  const hasSelectedRange = Boolean(
    selectedRange.startDate || selectedRange.endDate,
  );

  return (
    <div className="relative w-full" ref={fieldRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-border-subtle bg-bg-surface px-3 text-left text-caption-web text-text-primary transition-colors hover:border-border-subtle focus:border-action-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled"
        disabled={disabled}
        onClick={handleOpen}
        type="button"
      >
        <CalendarDays
          aria-hidden="true"
          className="size-4 shrink-0 text-text-secondary"
        />
        <span
          className={`min-w-0 truncate ${hasSelectedRange ? '' : 'text-text-secondary'}`}
        >
          {hasSelectedRange
            ? `${selectedRange.startDate ? formatDateLabel(selectedRange.startDate) : '시작일'} ~ ${selectedRange.endDate ? formatDateLabel(selectedRange.endDate) : '종료일'}`
            : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          aria-label={`${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월 날짜 범위 선택`}
          className="absolute left-0 top-full z-30 mt-2 w-[296px] rounded-lg border border-border-subtle bg-bg-surface p-4 shadow-lg"
          role="dialog"
        >
          <p className="mb-3 text-caption-web text-text-secondary">
            {isSelectingStartDate
              ? '시작일을 선택하세요'
              : '종료일을 선택하세요'}
          </p>
          <div className="mb-4 flex items-center justify-between">
            <button
              aria-label="이전 달"
              className="flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() =>
                setVisibleMonth(
                  (currentMonth) =>
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1,
                    ),
                )
              }
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <strong className="text-body-sm-web font-semibold text-text-primary">
              {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
            </strong>
            <button
              aria-label="다음 달"
              className="flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() =>
                setVisibleMonth(
                  (currentMonth) =>
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1,
                    ),
                )
              }
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {weekdays.map((weekday) => (
              <span
                className="py-1 text-caption-web text-text-secondary"
                key={weekday}
              >
                {weekday}
              </span>
            ))}
            {Array.from({ length: monthStartDay }, (_, index) => (
              <span aria-hidden="true" key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const date = new Date(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth(),
                index + 1,
              );
              const dateValue = formatDateValue(date);
              const isSelectedBoundary =
                dateValue === selectedRange.startDate ||
                dateValue === selectedRange.endDate;
              const isRangeStart = dateValue === selectedRange.startDate;
              const isRangeEnd = dateValue === selectedRange.endDate;
              const isInRange =
                Boolean(selectedRange.startDate && selectedRange.endDate) &&
                dateValue > selectedRange.startDate &&
                dateValue < selectedRange.endDate;
              const isToday = isSameDate(today, date);

              return (
                <div
                  className={[
                    'relative flex h-8 items-center justify-center',
                    isInRange ? 'bg-surface-brand' : '',
                    isRangeStart && selectedRange.endDate
                      ? 'after:absolute after:inset-y-0 after:left-1/2 after:right-0 after:bg-surface-brand'
                      : '',
                    isRangeEnd
                      ? 'after:absolute after:inset-y-0 after:left-0 after:right-1/2 after:bg-surface-brand'
                      : '',
                  ].join(' ')}
                  key={dateValue}
                >
                  <button
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                    aria-pressed={isSelectedBoundary}
                    className={[
                      'relative z-10 flex size-8 items-center justify-center rounded-full text-caption-web transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
                      isSelectedBoundary
                        ? 'bg-action-primary font-semibold text-text-inverse'
                        : isToday
                          ? 'bg-surface-brand font-medium text-text-brand hover:bg-action-primary hover:text-text-inverse'
                          : 'text-text-primary hover:bg-surface-subtle',
                    ].join(' ')}
                    onClick={() => handleDateSelect(dateValue)}
                    type="button"
                  >
                    {date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
            <button
              className="text-caption-web text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() => {
                handleValueChange(emptyDateRange);
                setIsSelectingStartDate(true);
              }}
              type="button"
            >
              초기화
            </button>
            <button
              className="text-caption-web font-medium text-action-primary transition-colors hover:text-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() => handleDateSelect(formatDateValue(today))}
              type="button"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
