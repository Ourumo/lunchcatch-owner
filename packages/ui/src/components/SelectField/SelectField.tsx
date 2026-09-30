import {
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onChange' | 'type' | 'value'
> {
  name?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  fitContent?: boolean;
  onValueChange?: (value: string) => void;
}

export function SelectField({
  defaultValue = '',
  disabled,
  fitContent = false,
  name,
  className,
  onClick,
  onKeyDown,
  onValueChange,
  options,
  placeholder = '옵션을 선택하세요',
  value,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );
  // 가장 긴 옵션을 숨김 요소로 렌더링해 트리거 너비를 맞춘다.
  const widestLabel = [
    placeholder,
    ...options.map((option) => option.label),
  ].reduce((longestLabel, label) =>
    label.length > longestLabel.length ? label : longestLabel,
  );
  const triggerClassName = [
    'flex h-10 items-center justify-start rounded-md border border-border-subtle bg-bg-surface px-3 text-left text-caption-web text-text-primary transition-colors focus:border-action-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled',
    fitContent ? 'col-start-1 row-start-1 whitespace-nowrap' : 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }

    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSelect = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
    setIsOpen(false);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return (
    <div
      className={fitContent ? 'relative inline-grid' : 'relative w-full'}
      ref={fieldRef}
    >
      {name && <input name={name} type="hidden" value={selectedValue} />}
      {fitContent && (
        <span
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 whitespace-nowrap px-3 pr-10 text-caption-web"
        >
          {widestLabel}
        </span>
      )}
      <button
        aria-controls={`${generatedId}-options`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`${triggerClassName} relative`}
        disabled={disabled}
        id={generatedId}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented) {
            setIsOpen((currentIsOpen) => !currentIsOpen);
          }
        }}
        onKeyDown={handleKeyDown}
        type="button"
        {...props}
      >
        <span
          className={
            selectedOption
              ? 'min-w-0 flex-1 truncate pr-6 text-left'
              : 'min-w-0 flex-1 truncate pr-6 text-left text-text-secondary'
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`absolute right-3 size-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>
      {isOpen && (
        <ul
          aria-labelledby={generatedId}
          className="absolute left-0 top-full z-10 mt-2 max-h-48 w-full overflow-auto rounded-md border border-border-subtle bg-bg-surface p-1"
          id={`${generatedId}-options`}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <li aria-selected={isSelected} key={option.value} role="option">
                <button
                  className={`flex w-full rounded-sm px-3 py-2 text-left text-caption-web disabled:cursor-not-allowed disabled:text-text-disabled ${
                    isSelected
                      ? 'bg-surface-subtle text-action-primary'
                      : 'text-text-primary hover:bg-surface-subtle'
                  }`}
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
