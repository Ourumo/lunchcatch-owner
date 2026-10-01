import {
  type ButtonHTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { ChevronDown } from 'lucide-react';

import { Checkbox } from '../Checkbox/Checkbox';
import type { SelectOption } from '../SelectField/SelectField';

export interface MultiSelectFieldProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onChange' | 'type' | 'value' | 'defaultValue'
> {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  name?: string;
  fitContent?: boolean;
  menuPlacement?: 'bottom' | 'top';
  showSelectAll?: boolean;
}

export const MultiSelectField = ({
  options,
  value,
  defaultValue = [],
  onValueChange,
  placeholder = '항목 선택',
  name,
  fitContent = false,
  menuPlacement = 'bottom',
  showSelectAll = true,
  disabled,
  className,
  onClick,
  onKeyDown,
  ...props
}: MultiSelectFieldProps) => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;
  const selectedOptions = options.filter((option) =>
    selected.includes(option.value),
  );
  const enabledOptions = options.filter((option) => !option.disabled);
  const allSelected =
    enabledOptions.length > 0 &&
    enabledOptions.every((option) => selected.includes(option.value));
  const summary =
    selectedOptions.length === options.length && options.length > 0
      ? '전체'
      : selectedOptions.length > 2
        ? `${selectedOptions[0].label} 외 ${selectedOptions.length - 1}개`
        : selectedOptions.map((option) => option.label).join(' · ') ||
          placeholder;
  // 두 항목까지 이름을 표시할 공간을 확보해 체크할 때 필터바 너비가 흔들리지 않게 한다.
  const labels = options
    .map((option) => option.label)
    .sort((a, b) => b.length - a.length);
  const widthLabel = [
    placeholder,
    labels.slice(0, 2).join(' · '),
    ...labels.map(
      (label) => `${label} 외 ${Math.max(0, options.length - 1)}개`,
    ),
  ].reduce(
    (longest, label) => (label.length > longest.length ? label : longest),
    '',
  );
  const changeSelection = (next: string[]) => {
    if (value === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const toggleOption = (optionValue: string) => {
    changeSelection(
      selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue],
    );
  };

  const toggleAll = () => {
    // 전체 선택/해제는 활성 옵션에만 적용하고, 비활성 옵션의 기존 선택값은 유지한다.
    const next = allSelected
      ? selected.filter((item) =>
          options.some((option) => option.disabled && option.value === item),
        )
      : [
          ...new Set([
            ...selected,
            ...enabledOptions.map((option) => option.value),
          ]),
        ];
    changeSelection(next);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () =>
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [open]);
  useEffect(() => {
    if (open)
      menuRef.current
        ?.querySelector<HTMLInputElement>('input:not(:disabled)')
        ?.focus();
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={fitContent ? 'relative inline-grid' : 'relative w-full'}
      onBlur={(event) => {
        // 라벨 클릭 중에는 포커스 대상이 잠시 null이 될 수 있다. 이때 닫으면 체크 이벤트가 사라진다.
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget as Node)
        )
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      {name &&
        selected.map((item) => (
          <input key={item} type="hidden" name={name} value={item} />
        ))}
      {fitContent && (
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 whitespace-nowrap px-3 pr-10 text-caption-web"
        >
          {widthLabel}
        </span>
      )}
      <button
        {...props}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        className={[
          'relative flex h-10 items-center rounded-md border border-border-subtle bg-bg-surface px-3 text-left text-caption-web text-text-primary focus:border-action-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled',
          fitContent ? 'col-start-1 row-start-1 whitespace-nowrap' : 'w-full',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="min-w-0 flex-1 truncate pr-6">{summary}</span>
        <ChevronDown
          aria-hidden="true"
          className={`absolute right-3 size-4 text-text-secondary transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && !disabled && (
        <div
          ref={menuRef}
          id={`${id}-options`}
          role="dialog"
          aria-labelledby={id}
          className={`absolute left-0 z-10 max-h-64 min-w-full overflow-auto rounded-md border border-border-subtle bg-bg-surface p-1 shadow-sm ${menuPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          {showSelectAll && (
            <div className="mb-1 border-b border-border-subtle pb-1">
              <Checkbox
                label="전체"
                checked={allSelected}
                disabled={!enabledOptions.length}
                className="w-full cursor-pointer rounded-sm px-3 py-2 hover:bg-surface-subtle [&:has(input:focus-visible)]:outline-2 [&:has(input:focus-visible)]:outline-action-primary"
                onChange={toggleAll}
              />
            </div>
          )}
          <div role="group" aria-label="항목 선택" className="flex flex-col">
            {options.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={selected.includes(option.value)}
                disabled={option.disabled}
                className="w-full cursor-pointer whitespace-nowrap rounded-sm px-3 py-2 hover:bg-surface-subtle has-disabled:cursor-not-allowed has-disabled:text-text-disabled [&:has(input:focus-visible)]:outline-2 [&:has(input:focus-visible)]:outline-action-primary"
                onChange={() => toggleOption(option.value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
