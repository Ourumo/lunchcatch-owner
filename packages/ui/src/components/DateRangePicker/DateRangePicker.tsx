import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
const popupWidth = 296;
const popupMargin = 8;

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
  const popupRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    const popup = popupRef.current;
    const field = fieldRef.current;

    if (!isOpen || !popup || !field) {
      return;
    }

    // Popover API의 최상위 레이어는 부모의 overflow와 stacking context에 영향을 받지 않는다.
    // manual 모드로 브라우저의 자동 닫기를 끄고, 바깥 클릭·Escape와 isOpen으로 열림 상태를 관리한다.
    // useLayoutEffect에서 배치해 최초 표시 때 위치가 튀는 것을 막는다.
    popup.showPopover();

    const updatePosition = () => {
      // 모바일 키보드나 확대 때문에 실제 보이는 영역이 작아진 경우에도 그 영역 안에 배치한다.
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth =
        viewport?.width ?? document.documentElement.clientWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const margin = popupMargin;
      const minLeft = viewportLeft + margin;
      const minTop = viewportTop + margin;
      const viewportBottom = viewportTop + viewportHeight - margin;
      const fieldRect = field.getBoundingClientRect();

      // 좁은 화면에서는 폭에 따라 내용 높이도 달라지므로 크기를 제한한 후 위치 계산에 쓸 높이를 측정한다.
      popup.style.width = `${Math.min(popupWidth, Math.max(0, viewportWidth - margin * 2))}px`;
      popup.style.maxHeight = `${Math.max(0, viewportHeight - margin * 2)}px`;

      const popupRect = popup.getBoundingClientRect();
      const maxLeft = viewportLeft + viewportWidth - margin - popupRect.width;
      const belowTop = fieldRect.bottom + margin;
      const aboveTop = fieldRect.top - margin - popupRect.height;
      // 아래 공간이 부족하면 위로 펼치고, 어느 쪽도 부족하면 화면 안으로 보정한다.
      const preferredTop =
        belowTop + popupRect.height <= viewportBottom ? belowTop : aboveTop;

      popup.style.left = `${Math.max(minLeft, Math.min(fieldRect.left, maxLeft))}px`;
      popup.style.top = `${Math.max(minTop, Math.min(preferredTop, viewportBottom - popupRect.height))}px`;
    };

    updatePosition();

    // 월 변경으로 달력 높이가 달라지거나 화면을 스크롤해도 입력란을 따라간다.
    const observer = new ResizeObserver(updatePosition);
    observer.observe(popup);
    observer.observe(field);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.visualViewport?.addEventListener('resize', updatePosition);
    window.visualViewport?.addEventListener('scroll', updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.visualViewport?.removeEventListener('resize', updatePosition);
      window.visualViewport?.removeEventListener('scroll', updatePosition);
      popup.hidePopover();
    };
  }, [isOpen]);

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
            ? `${selectedRange.startDate ? formatDateLabel(selectedRange.startDate) : '시작일'} ~ ${selectedRange.endDate ? formatDateLabel(selectedRange.endDate) : '종료일'}`
            : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          aria-label={`${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월 날짜 범위 선택`}
          className="fixed inset-auto m-0 overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-bg-surface p-4 shadow-lg"
          popover="manual"
          ref={popupRef}
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
