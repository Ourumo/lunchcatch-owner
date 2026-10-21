import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  'primary' | 'secondary' | 'neutral' | 'tertiary' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-action-primary text-text-inverse enabled:hover:bg-action-primary-hover',
  secondary:
    'border-action-primary bg-bg-surface text-action-primary enabled:hover:bg-surface-subtle',
  neutral:
    'border-border-subtle bg-bg-surface text-text-secondary enabled:hover:bg-surface-subtle enabled:hover:text-text-primary',
  tertiary:
    'border-transparent bg-transparent text-action-primary enabled:hover:bg-surface-subtle',
  danger:
    'border-transparent bg-status-danger-border text-text-inverse enabled:hover:opacity-90',
};

/**
 * 종류와 테마별 스타일 및 키보드 포커스 표시를 공통으로 제공하는 작업 버튼입니다.
 * isLoading 상태에서는 클릭을 차단하고 아이콘 대신 로딩 표시를 렌더링합니다.
 */
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
    // 비활성 상태는 종류와 관계없이 같은 배경·글자 대비를 사용하며 호버 색을 적용하지 않는다.
    'disabled:border-border-subtle disabled:bg-action-primary-disabled disabled:text-action-disabled-fg',
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
