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
  const selectedValue = value ?? uncontrolledValue;

  const handleSelect = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div aria-label="탭" className="flex items-stretch" role="tablist">
      {items.map((item) => {
        const isSelected = item.value === selectedValue;

        return (
          <button
            aria-selected={isSelected}
            className={`border-0 bg-transparent text-body-web font-normal transition-colors duration-150 ease-out hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-text-disabled ${
              isSelected ? 'text-action-primary' : 'text-text-secondary'
            }`}
            disabled={item.disabled}
            key={item.value}
            onClick={() => handleSelect(item.value)}
            role="tab"
            style={{
              borderBottom: isSelected
                ? '2px solid var(--color-action-primary)'
                : '1px solid var(--color-border-subtle)',
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
