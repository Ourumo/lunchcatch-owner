import { type InputHTMLAttributes, type ReactNode, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  errorMessage?: string;
  /** 입력창 아래 안내. 오류가 있으면 오류 문구를 우선 표시한다. */
  helperText?: string;
  label?: string;
  leadingIcon?: ReactNode;
  // 입력값 뒤에 붙는 단위 등 (예: 원, %)
  trailing?: ReactNode;
}

export function Input({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  containerClassName,
  errorMessage,
  helperText,
  id,
  label,
  leadingIcon,
  required,
  trailing,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const messageId = errorMessage ? errorId : helperText ? helperId : undefined;
  const describedBy =
    [ariaDescribedBy, messageId].filter(Boolean).join(' ') || undefined;
  const inputClassName = [
    'h-full min-w-0 flex-1 bg-transparent text-caption-web text-text-primary placeholder:text-text-secondary focus:outline-none disabled:cursor-not-allowed disabled:text-text-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={['flex w-full flex-col gap-2', containerClassName]
        .filter(Boolean)
        .join(' ')}
    >
      {label && (
        <label
          className="text-caption-web font-medium text-text-primary"
          htmlFor={inputId}
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-status-danger-fg">
              *
            </span>
          )}
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
          required={required}
          {...props}
        />
        {trailing && (
          <span className="shrink-0 text-caption-web text-text-secondary">
            {trailing}
          </span>
        )}
      </div>
      {(errorMessage || helperText) && (
        <p
          className={`-mt-1 ml-1 text-caption-web ${errorMessage ? 'text-status-danger-fg' : 'text-text-secondary'}`}
          id={messageId}
          role={errorMessage ? 'alert' : undefined}
        >
          {errorMessage || helperText}
        </p>
      )}
    </div>
  );
}
