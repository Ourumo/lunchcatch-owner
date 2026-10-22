import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { useCalendarPopover } from '../../hooks/useCalendarPopover';
import {
  type DateRangeSelectionMode,
  type DateRangeValue,
  formatDateLabel,
  formatDateValue,
  getDateRangeUnit,
} from './dateRangeUtils';
import { MonthRangeCalendar } from './MonthRangeCalendar';

export type { DateRangeSelectionMode, DateRangeValue } from './dateRangeUtils';

export interface DateRangePickerProps {
  /** 주·월 선택은 해당 구간의 첫날과 마지막 날을 YYYY-MM-DD로 반환한다. */
  selectionMode?: DateRangeSelectionMode;
  ariaLabel?: string;
  defaultValue?: DateRangeValue;
  disabled?: boolean;
  /** 선택 가능한 마지막 날짜. 미지정 시 제한하지 않으며 주·월 구간에도 적용한다. */
  maxDate?: string;
  onValueChange?: (value: DateRangeValue) => void;
  placeholder?: string;
  /** 오늘로 취급할 기준 날짜(YYYY-MM-DD). 미지정 시 브라우저 현지 날짜를 사용한다. */
  todayDate?: string;
  value?: DateRangeValue;
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const emptyDateRange: DateRangeValue = { endDate: '', startDate: '' };

const createDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
};

const isSameDate = (firstDate: Date, secondDate: Date) =>
  formatDateValue(firstDate) === formatDateValue(secondDate);

/**
 * 시작·종료 구간을 선택하는 달력으로, 일·주는 날짜 격자, 월은 월 목록을 표시한다.
 * 주는 월요일~일요일, 월은 첫날~마지막 날을 반환하며 maxDate가 있으면 종료일을 제한한다.
 * value가 있으면 부모 상태를 사용하고, 없으면 defaultValue에서 시작해 내부 상태로 관리한다.
 */
export function DateRangePicker({
  ariaLabel = '날짜 범위 선택',
  defaultValue = emptyDateRange,
  disabled = false,
  maxDate,
  onValueChange,
  placeholder = '가입일 범위 선택',
  todayDate,
  value,
  selectionMode = 'day',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { fieldRef, popupRef } = useCalendarPopover(isOpen);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedRange = value ?? uncontrolledValue;
  const today = todayDate ? createDate(todayDate) : new Date();
  const referenceDate = selectedRange.startDate
    ? createDate(selectedRange.startDate)
    : today;
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
  );
  const unitLabel =
    selectionMode === 'week' ? '주' : selectionMode === 'month' ? '월' : '일';
  const startLabel = selectionMode === 'day' ? '시작일' : `시작 ${unitLabel}`;
  const endLabel = selectionMode === 'day' ? '종료일' : `종료 ${unitLabel}`;
  const formatRangeLabel = (date: string) =>
    formatDateLabel(selectionMode === 'month' ? date.slice(0, 7) : date);
  const changeVisiblePeriod = (direction: number) =>
    setVisibleMonth((current) =>
      selectionMode === 'month'
        ? new Date(current.getFullYear() + direction, current.getMonth(), 1)
        : new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
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
  }, [fieldRef]);

  const handleValueChange = (nextValue: DateRangeValue) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handleDateSelect = (nextDate: string) => {
    if (maxDate && nextDate > maxDate) return;
    const nextUnit = getDateRangeUnit(nextDate, selectionMode);
    // 현재 주·월을 선택해도 구간의 종료일이 허용된 날짜를 넘지 않게 한다.
    if (maxDate && nextUnit.endDate > maxDate) nextUnit.endDate = maxDate;
    if (
      isSelectingStartDate ||
      !selectedRange.startDate ||
      selectedRange.endDate
    ) {
      handleValueChange({ endDate: '', startDate: nextUnit.startDate });
      setIsSelectingStartDate(false);
      return;
    }

    // 종료 구간을 먼저 선택해도 두 구간을 모두 포함하는 날짜 범위를 반환한다.
    const startUnit = getDateRangeUnit(selectedRange.startDate, selectionMode);
    if (maxDate && startUnit.endDate > maxDate) startUnit.endDate = maxDate;
    handleValueChange({
      startDate:
        nextUnit.startDate < startUnit.startDate
          ? nextUnit.startDate
          : startUnit.startDate,
      endDate:
        nextUnit.endDate > startUnit.endDate
          ? nextUnit.endDate
          : startUnit.endDate,
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
    <div
      className="relative w-[var(--layout-date-range-picker-width)] max-w-full shrink-0"
      ref={fieldRef}
    >
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
            ? `${selectedRange.startDate ? formatRangeLabel(selectedRange.startDate) : startLabel} ~ ${selectedRange.endDate ? formatRangeLabel(selectedRange.endDate) : endLabel}`
            : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          aria-label={`${visibleMonth.getFullYear()}년 ${selectionMode === 'month' ? '' : `${visibleMonth.getMonth() + 1}월 `}${unitLabel} 범위 선택`}
          className="fixed inset-auto m-0 overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-bg-surface p-4 shadow-lg"
          popover="manual"
          ref={popupRef}
          role="dialog"
        >
          <p className="mb-3 text-caption-web text-text-secondary">
            {`${isSelectingStartDate ? startLabel : endLabel}${selectionMode === 'week' ? '를' : '을'} 선택하세요`}
          </p>
          <div className="mb-4 flex items-center justify-between">
            <button
              aria-label={selectionMode === 'month' ? '이전 연도' : '이전 달'}
              className="flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() => changeVisiblePeriod(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <strong className="text-body-sm-web font-semibold text-text-primary">
              {visibleMonth.getFullYear()}년{' '}
              {selectionMode !== 'month' && `${visibleMonth.getMonth() + 1}월`}
            </strong>
            <button
              aria-label={selectionMode === 'month' ? '다음 연도' : '다음 달'}
              className="flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() => changeVisiblePeriod(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>

          {selectionMode !== 'month' && (
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
                // 같은 날이 시작·종료면 양쪽 연결 배경을 동시에 붙이지 않는다.
                const rangeEdgeClassName =
                  isRangeStart && isRangeEnd
                    ? ''
                    : isRangeStart && selectedRange.endDate
                      ? 'after:absolute after:inset-y-0 after:left-1/2 after:right-0 after:bg-surface-brand'
                      : isRangeEnd
                        ? 'after:absolute after:inset-y-0 after:left-0 after:right-1/2 after:bg-surface-brand'
                        : '';
                const isInRange =
                  Boolean(selectedRange.startDate && selectedRange.endDate) &&
                  dateValue > selectedRange.startDate &&
                  dateValue < selectedRange.endDate;
                const isToday = isSameDate(today, date);
                const isUnavailable = !!maxDate && dateValue > maxDate;

                return (
                  <div
                    className={[
                      'relative flex h-8 items-center justify-center',
                      isInRange ? 'bg-surface-brand' : '',
                      rangeEdgeClassName,
                    ].join(' ')}
                    key={dateValue}
                  >
                    <button
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                      aria-pressed={isSelectedBoundary}
                      disabled={isUnavailable}
                      className={[
                        'relative z-10 flex size-8 items-center justify-center rounded-full text-caption-web transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
                        isUnavailable
                          ? 'cursor-not-allowed text-text-disabled'
                          : isSelectedBoundary
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
          )}

          {selectionMode === 'month' && (
            <MonthRangeCalendar
              visibleMonth={visibleMonth}
              selectedRange={selectedRange}
              onSelect={handleDateSelect}
              maxDate={maxDate}
            />
          )}

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
              className="text-caption-web font-medium text-action-primary transition-colors hover:text-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-text-disabled"
              disabled={!!maxDate && formatDateValue(today) > maxDate}
              onClick={() => handleDateSelect(formatDateValue(today))}
              type="button"
            >
              {selectionMode === 'week'
                ? '이번 주'
                : selectionMode === 'month'
                  ? '이번 달'
                  : '오늘'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
