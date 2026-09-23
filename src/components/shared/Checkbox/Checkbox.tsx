import { type InputHTMLAttributes, useId } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ className, id, label, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelClassName = [
    'inline-flex items-center gap-2 text-body-sm-web text-text-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={labelClassName} htmlFor={inputId}>
      <input
        className="peer absolute opacity-0"
        id={inputId}
        type="checkbox"
        {...props}
      />
      <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-bg-surface text-text-inverse peer-checked:border-action-primary peer-checked:bg-action-primary peer-checked:[&>svg]:opacity-100 peer-disabled:cursor-not-allowed peer-disabled:bg-surface-subtle peer-disabled:text-text-disabled">
        <Check
          aria-hidden="true"
          className="size-4 opacity-0"
          strokeWidth={2}
        />
      </span>
      {label}
    </label>
  );
}
