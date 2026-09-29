import { type InputHTMLAttributes, useId } from 'react';

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Radio({ className, id, label, ...props }: RadioProps) {
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
        type="radio"
        {...props}
      />
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-surface peer-checked:border-action-primary peer-checked:[&>span]:opacity-100 peer-disabled:cursor-not-allowed peer-disabled:bg-surface-subtle">
        <span className="size-2 rounded-full bg-action-primary opacity-0" />
      </span>
      {label}
    </label>
  );
}
