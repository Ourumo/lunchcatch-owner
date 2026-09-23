import { type InputHTMLAttributes, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, id, label, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputClassName = [
    'h-10 w-full rounded-md border border-border-subtle bg-bg-surface px-3 text-caption-web text-text-primary placeholder:text-text-secondary focus:border-action-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-text-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label
          className="text-caption-web font-medium text-text-primary"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <input className={inputClassName} id={inputId} {...props} />
    </div>
  );
}
