import { useState } from 'react';

export interface SegmentedControlItem<T extends string = string> {
  disabled?: boolean;
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string = string> {
  ariaLabel: string;
  defaultValue?: T;
  items: SegmentedControlItem<T>[];
  onValueChange?: (value: T) => void;
  value?: T;
}

export function SegmentedControl<T extends string = string>({
  ariaLabel,
  defaultValue,
  items,
  onValueChange,
  value,
}: SegmentedControlProps<T>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? items[0]?.value,
  );
  const selectedValue = value ?? uncontrolledValue;
  const selectedIndex = Math.max(
    items.findIndex((item) => item.value === selectedValue),
    0,
  );

  const handleSelect = (nextValue: T) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div
      aria-label={ariaLabel}
      className="relative inline-grid rounded-lg bg-surface-subtle p-1"
      role="group"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-md bg-bg-surface shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          transform: `translateX(${selectedIndex * 100}%)`,
          width: `calc((100% - var(--space-2)) / ${items.length})`,
        }}
      />
      {items.map((item) => {
        const isSelected = item.value === selectedValue;

        return (
          <button
            aria-pressed={isSelected}
            className={[
              'relative z-10 min-h-8 rounded-md px-3 text-caption-web font-medium transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
              isSelected
                ? 'text-action-primary'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
            disabled={item.disabled}
            key={item.value}
            onClick={() => handleSelect(item.value)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
