import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import { useCalendarPopover } from '../../hooks/useCalendarPopover';

export interface DatePickerProps {
  align?: 'start' | 'end';
  ariaLabel?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** 선택 가능한 마지막 날짜(YYYY-MM-DD). */
  maxDate?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** 오늘로 취급할 기준 날짜(YYYY-MM-DD). 미지정 시 브라우저 현지 날짜를 사용한다. */
  todayDate?: string;
  value?: string;
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

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

export function DatePicker({
  align = 'start',
  ariaLabel = '날짜 선택',
  defaultValue = '',
  disabled = false,
  maxDate,
  onValueChange,
  placeholder = '날짜 선택',
  todayDate,
  value,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { fieldRef, popupRef } = useCalendarPopover(isOpen, align);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const selectedDate = selectedValue ? createDate(selectedValue) : undefined;
  const today = todayDate ? createDate(todayDate) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1),
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

  const handleValueChange = (nextValue: string) => {
    if (nextValue && maxDate && nextValue > maxDate) return;
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  const handleOpen = () => {
    const referenceDate = selectedDate ?? today;

    setVisibleMonth(
      new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
    );
    setIsOpen((currentIsOpen) => !currentIsOpen);
  };

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
        <span className={selectedValue ? '' : 'text-text-secondary'}>
          {selectedValue ? formatDateLabel(selectedValue) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          aria-label={`${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월 달력`}
          className="fixed inset-auto m-0 overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-bg-surface p-4 shadow-lg"
          popover="manual"
          ref={popupRef}
          role="dialog"
        >
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
              const isSelected = selectedValue === dateValue;
              const isToday = isSameDate(today, date);
              const isUnavailable = !!maxDate && dateValue > maxDate;

              return (
                <button
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
                  aria-pressed={isSelected}
                  disabled={isUnavailable}
                  className={[
                    'mx-auto flex size-8 items-center justify-center rounded-md text-caption-web transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
                    isUnavailable
                      ? 'cursor-not-allowed text-text-disabled'
                      : isSelected
                        ? 'bg-action-primary font-semibold text-text-inverse'
                        : isToday
                          ? 'bg-surface-brand font-medium text-text-brand hover:bg-action-primary hover:text-text-inverse'
                          : 'text-text-primary hover:bg-surface-subtle',
                  ].join(' ')}
                  key={dateValue}
                  onClick={() => handleValueChange(dateValue)}
                  type="button"
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
            <button
              className="text-caption-web text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              onClick={() => handleValueChange('')}
              type="button"
            >
              초기화
            </button>
            <button
              className="text-caption-web font-medium text-action-primary transition-colors hover:text-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-text-disabled"
              disabled={!!maxDate && formatDateValue(today) > maxDate}
              onClick={() => handleValueChange(formatDateValue(today))}
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
