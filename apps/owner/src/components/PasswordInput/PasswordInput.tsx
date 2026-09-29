import { type InputHTMLAttributes, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  errorMessage?: string;
  label?: string;
}

// 공용 Input과 같은 모양에 비밀번호 보기/숨기기 버튼을 더한 입력 필드
export function PasswordInput({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  disabled,
  errorMessage,
  id,
  label,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
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
  const ToggleIcon = isVisible ? EyeOff : Eye;

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
        className={`flex h-10 w-full items-center gap-2 rounded-md border border-border-subtle bg-bg-surface pr-2 pl-3 has-disabled:cursor-not-allowed has-disabled:bg-surface-subtle ${
          errorMessage
            ? 'border-status-danger-border focus-within:border-status-danger-border'
            : 'focus-within:border-action-primary'
        }`}
      >
        <input
          aria-describedby={describedBy}
          aria-invalid={errorMessage ? true : ariaInvalid}
          className={inputClassName}
          disabled={disabled}
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          {...props}
        />
        <button
          aria-controls={inputId}
          aria-label="비밀번호 보기"
          aria-pressed={isVisible}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:text-text-disabled"
          disabled={disabled}
          onClick={() => setIsVisible((prev) => !prev)}
          type="button"
        >
          <ToggleIcon aria-hidden="true" className="size-4" />
        </button>
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
