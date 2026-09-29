import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useId,
  useState,
} from 'react';

export interface ToggleProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Toggle({
  checked,
  className,
  defaultChecked = false,
  id,
  label,
  onChange,
  ...props
}: ToggleProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [uncontrolledChecked, setUncontrolledChecked] =
    useState(defaultChecked);
  const isChecked = checked ?? uncontrolledChecked;
  const labelClassName = [
    'inline-flex items-center gap-2 text-body-sm-web text-text-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (checked === undefined) {
      setUncontrolledChecked(event.target.checked);
    }

    onChange?.(event);
  };

  return (
    <label className={labelClassName} htmlFor={inputId}>
      <input
        checked={isChecked}
        className="peer absolute opacity-0"
        id={inputId}
        onChange={handleChange}
        type="checkbox"
        {...props}
      />
      <span
        className="flex shrink-0 items-center rounded-full transition-colors duration-150 ease-out peer-disabled:cursor-not-allowed peer-disabled:opacity-50 motion-reduce:transition-none"
        style={{
          backgroundColor: isChecked
            ? 'var(--color-action-primary)'
            : 'var(--color-surface-subtle)',
          height: 'var(--space-5)',
          paddingInline: 'calc(var(--space-1) / 2)',
          width: 'var(--space-10)',
        }}
      >
        <span
          className="rounded-full bg-bg-surface transition-transform duration-150 ease-out motion-reduce:transition-none"
          style={{
            height: 'var(--icon-sm)',
            transform: isChecked
              ? 'translateX(var(--space-5))'
              : 'translateX(0)',
            width: 'var(--icon-sm)',
          }}
        />
      </span>
      {label}
    </label>
  );
}
