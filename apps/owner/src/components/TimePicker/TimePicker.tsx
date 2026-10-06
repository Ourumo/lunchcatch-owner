import { useEffect, useId, useRef, useState } from 'react';
import { BottomSheet, Button } from '@repo/ui';
import { Clock } from 'lucide-react';

type Period = 'AM' | 'PM';

interface TimeParts {
  period: Period;
  // 1~12
  hour: number;
  minute: number;
}

export interface TimePickerProps {
  // 칸 위에 보이는 이름. 바텀시트 제목으로도 쓴다
  label: string;
  // HH:mm (24시간). 고르기 전에는 빈 문자열
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  errorMessage?: string;
  placeholder?: string;
}

const MINUTE_STEP = 10;
// 값이 없을 때 바텀시트를 열면 처음 골라져 있는 시간
const INITIAL_DRAFT_VALUE = '09:00';

const periodOptions: { value: Period; label: string }[] = [
  { value: 'AM', label: '오전' },
  { value: 'PM', label: '오후' },
];
const hourOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: String(index + 1),
}));
const minuteOptions = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => ({
  value: index * MINUTE_STEP,
  label: String(index * MINUTE_STEP).padStart(2, '0'),
}));

// 분 단위에 맞지 않는 값(11:15 등)은 단위에 맞춰 내림한다
const toTimeParts = (value: string): TimeParts => {
  const [hours, minutes] = value.split(':').map(Number);

  return {
    period: hours < 12 ? 'AM' : 'PM',
    hour: hours % 12 === 0 ? 12 : hours % 12,
    minute: Math.floor(minutes / MINUTE_STEP) * MINUTE_STEP,
  };
};

const toTimeValue = ({ period, hour, minute }: TimeParts) => {
  const hours = (hour % 12) + (period === 'PM' ? 12 : 0);

  return `${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

// 오전 11:00, 오후 9:30
const formatTimeLabel = (value: string) => {
  const { period, hour, minute } = toTimeParts(value);
  const periodLabel = period === 'AM' ? '오전' : '오후';

  return `${periodLabel} ${hour}:${String(minute).padStart(2, '0')}`;
};

interface TimeColumnProps<TValue extends string | number> {
  legend: string;
  options: { value: TValue; label: string }[];
  selected: TValue;
  onSelect: (value: TValue) => void;
}

// 화살표 키로 옮겨 고를 수 있도록 라디오를 숨겨서 쓴다
const TimeColumn = <TValue extends string | number>({
  legend,
  options,
  selected,
  onSelect,
}: TimeColumnProps<TValue>) => {
  const name = useId();
  const listRef = useRef<HTMLDivElement>(null);

  // 바텀시트를 열었을 때 고른 항목이 목록 밖에 있으면 보이게 한다
  useEffect(() => {
    listRef.current
      ?.querySelector('input:checked')
      ?.parentElement?.scrollIntoView({ block: 'nearest' });
  }, []);

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div
        className="flex max-h-56 flex-col gap-1 overflow-y-auto"
        ref={listRef}
      >
        {options.map((option) => (
          <label className="cursor-pointer" key={option.value}>
            <input
              checked={selected === option.value}
              className="peer sr-only"
              name={name}
              onChange={() => onSelect(option.value)}
              type="radio"
              value={option.value}
            />
            <span className="flex h-11 items-center justify-center rounded-md text-body-mobile text-text-primary peer-checked:bg-surface-brand peer-checked:font-semibold peer-checked:text-text-brand peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-action-primary">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

// 점주 화면용 시간 선택. 칸을 누르면 바텀시트에서 오전/오후, 시, 분을 골라 확정한다
export const TimePicker = ({
  label,
  value,
  onValueChange,
  disabled = false,
  errorMessage,
  placeholder = '시간 선택',
}: TimePickerProps) => {
  const id = useId();
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const errorId = `${id}-error`;
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    toTimeParts(value || INITIAL_DRAFT_VALUE),
  );

  const open = () => {
    setDraft(toTimeParts(value || INITIAL_DRAFT_VALUE));
    setIsOpen(true);
  };

  const confirm = () => {
    onValueChange(toTimeValue(draft));
    setIsOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <span
        className="text-caption-web font-medium text-text-primary"
        id={labelId}
      >
        {label}
      </span>
      <button
        aria-describedby={errorMessage ? errorId : undefined}
        aria-haspopup="dialog"
        aria-labelledby={`${labelId} ${valueId}`}
        className={`flex h-10 w-full items-center gap-2 rounded-md border bg-bg-surface px-3 text-left text-caption-web focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled ${
          errorMessage
            ? 'border-status-danger-border'
            : 'border-border-subtle focus-visible:border-action-primary'
        }`}
        disabled={disabled}
        onClick={open}
        type="button"
      >
        <Clock
          aria-hidden="true"
          className="size-4 shrink-0 text-text-secondary"
        />
        <span
          className={value ? 'text-text-primary' : 'text-text-secondary'}
          id={valueId}
        >
          {value ? formatTimeLabel(value) : placeholder}
        </span>
      </button>
      {errorMessage && (
        <p
          className="-mt-1 ml-1 text-caption-web text-status-danger-fg"
          id={errorId}
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={label}
      >
        <div className="grid grid-cols-3 gap-2">
          <TimeColumn
            legend="오전 오후"
            onSelect={(period) => setDraft((prev) => ({ ...prev, period }))}
            options={periodOptions}
            selected={draft.period}
          />
          <TimeColumn
            legend="시"
            onSelect={(hour) => setDraft((prev) => ({ ...prev, hour }))}
            options={hourOptions}
            selected={draft.hour}
          />
          <TimeColumn
            legend="분"
            onSelect={(minute) => setDraft((prev) => ({ ...prev, minute }))}
            options={minuteOptions}
            selected={draft.minute}
          />
        </div>
        <Button className="mt-4 w-full" onClick={confirm}>
          {formatTimeLabel(toTimeValue(draft))} 선택
        </Button>
      </BottomSheet>
    </div>
  );
};
