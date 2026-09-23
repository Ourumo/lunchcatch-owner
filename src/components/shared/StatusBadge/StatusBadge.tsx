import type { CSSProperties, HTMLAttributes } from 'react';

export type StatusBadgeVariant = 'info' | 'success' | 'warning' | 'danger';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
}

const variantStyle: Record<StatusBadgeVariant, CSSProperties> = {
  info: {
    backgroundColor: 'var(--color-status-info-bg)',
    color: 'var(--color-status-info-fg)',
  },
  success: {
    backgroundColor: 'var(--color-status-success-bg)',
    color: 'var(--color-status-success-fg)',
  },
  warning: {
    backgroundColor: 'var(--color-status-warning-bg)',
    color: 'var(--color-status-warning-fg)',
  },
  danger: {
    backgroundColor: 'var(--color-status-danger-bg)',
    color: 'var(--color-status-danger-fg)',
  },
};

const badgeStyle: CSSProperties = {
  borderRadius: 'var(--radius-full)',
  paddingBlock: 'calc(var(--space-2) - (var(--space-1) / 2))',
  paddingInline: 'var(--space-3)',
};

export function StatusBadge({
  children,
  className,
  style,
  variant = 'info',
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center whitespace-nowrap text-caption-web font-medium',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...badgeStyle, ...variantStyle[variant], ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
