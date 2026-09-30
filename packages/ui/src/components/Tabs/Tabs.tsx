import { useState } from 'react';

export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, items, onValueChange, value }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? items[0]?.value,
  );
  const [underlineDirection, setUnderlineDirection] = useState<
    'left-to-right' | 'right-to-left'
  >('left-to-right');
  const selectedValue = value ?? uncontrolledValue;

  const handleSelect = (nextValue: string) => {
    const selectedIndex = items.findIndex(
      (item) => item.value === selectedValue,
    );
    const nextIndex = items.findIndex((item) => item.value === nextValue);

    if (nextIndex !== selectedIndex) {
      setUnderlineDirection(
        nextIndex > selectedIndex ? 'left-to-right' : 'right-to-left',
      );
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div
      aria-label="탭"
      className="inline-flex self-start items-stretch border-b border-border-subtle"
      role="tablist"
    >
      {items.map((item) => {
        const isSelected = item.value === selectedValue;
        const underlineOrigin =
          underlineDirection === 'left-to-right'
            ? 'after:origin-left'
            : 'after:origin-right';

        return (
          <button
            aria-selected={isSelected}
            className={`relative border-0 bg-transparent text-body-web font-normal transition-colors duration-150 ease-out after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-full after:bg-action-primary after:transition-transform after:duration-200 after:ease-out hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-text-disabled motion-reduce:after:transition-none ${underlineOrigin} ${
              isSelected
                ? 'text-action-primary after:scale-x-100'
                : 'text-text-secondary after:scale-x-0'
            }`}
            disabled={item.disabled}
            key={item.value}
            onClick={() => handleSelect(item.value)}
            role="tab"
            style={{
              lineHeight: 'calc(var(--space-5) + (var(--space-1) / 2))',
              padding:
                'calc(var(--space-3) - (var(--space-1) / 2)) var(--space-5)',
            }}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
