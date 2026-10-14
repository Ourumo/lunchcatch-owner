import type { CSSProperties, HTMLAttributes } from 'react';

export type StatusBadgeVariant =
  'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant;
}

const variantStyle: Record<StatusBadgeVariant, CSSProperties> = {
  // 종료, 작성 중처럼 강조하지 않는 상태
  neutral: {
    backgroundColor: 'var(--color-status-neutral-bg)',
    color: 'var(--color-status-neutral-fg)',
  },
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

/**
 * variant에 해당하는 상태 색상으로 라벨을 표시한다.
 * data-status-badge는 테이블이 뱃지를 식별해 셀의 말줄임표를 제외하는 데 사용한다.
 */
export function StatusBadge({
  children,
  className,
  style,
  variant = 'info',
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-status-badge=""
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
