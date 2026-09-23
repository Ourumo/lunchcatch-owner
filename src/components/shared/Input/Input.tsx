import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string;
  label?: string;
  leadingIcon?: ReactNode;
}

export function Input({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  errorMessage,
  id,
  label,
  leadingIcon,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const describedBy =
    [ariaDescribedBy, errorMessage && errorId].filter(Boolean).join(' ') ||
    undefined;
  const inputClassName = [
    'h-full min-w-0 flex-1 bg-transparent text-caption-web text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:text-text-disabled',
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
      <div
        className={`flex h-10 w-full items-center gap-2 rounded-md border border-border-subtle bg-bg-surface px-3 has-disabled:cursor-not-allowed has-disabled:bg-surface-subtle ${
          errorMessage
            ? 'border-status-danger-border focus-within:border-status-danger-border'
            : 'focus-within:border-action-primary'
        }`}
      >
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="flex size-4 shrink-0 text-text-secondary"
          >
            {leadingIcon}
          </span>
        )}
        <input
          aria-describedby={describedBy}
          aria-invalid={errorMessage ? true : ariaInvalid}
          className={inputClassName}
          id={inputId}
          {...props}
        />
      </div>
      {errorMessage && (
        <p
          className="-mt-1 ml-1 text-caption-web text-status-danger-fg"
          id={errorId}
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
