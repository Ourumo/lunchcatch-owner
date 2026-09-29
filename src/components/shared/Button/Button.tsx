import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'bg-action-primary text-text-inverse hover:bg-action-primary-hover disabled:bg-action-primary-disabled disabled:text-text-disabled',
  secondary:
    'border-action-primary bg-bg-surface text-action-primary hover:bg-surface-subtle disabled:border-border-subtle disabled:text-text-disabled',
  tertiary:
    'border-transparent bg-transparent text-action-primary hover:bg-surface-subtle disabled:text-text-disabled',
  danger:
    'bg-status-danger-border text-text-inverse hover:opacity-90 disabled:bg-action-primary-disabled disabled:text-text-disabled',
};

export function Button({
  children,
  className,
  disabled,
  isLoading = false,
  leadingIcon,
  trailingIcon,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const buttonClassName = [
    'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-body-sm-web font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed',
    variantClassNames[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      aria-busy={isLoading || undefined}
      className={buttonClassName}
      disabled={isDisabled}
      type={type}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!isLoading && trailingIcon}
    </button>
  );
}
