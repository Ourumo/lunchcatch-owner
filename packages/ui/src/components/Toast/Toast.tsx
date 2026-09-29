import type { CSSProperties, HTMLAttributes } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  description: string;
  onClose?: () => void;
  title: string;
  variant?: ToastVariant;
}

const variantConfig: Record<
  ToastVariant,
  {
    Icon: typeof Info;
    style: CSSProperties;
  }
> = {
  info: {
    Icon: Info,
    style: {
      backgroundColor: 'var(--color-status-info-bg)',
      color: 'var(--color-status-info-fg)',
    },
  },
  success: {
    Icon: CircleCheck,
    style: {
      backgroundColor: 'var(--color-status-success-bg)',
      color: 'var(--color-status-success-fg)',
    },
  },
  warning: {
    Icon: TriangleAlert,
    style: {
      backgroundColor: 'var(--color-status-warning-bg)',
      color: 'var(--color-status-warning-fg)',
    },
  },
  danger: {
    Icon: CircleX,
    style: {
      backgroundColor: 'var(--color-status-danger-bg)',
      color: 'var(--color-status-danger-fg)',
    },
  },
};

const toastStyle: CSSProperties = {
  borderRadius: 'var(--radius-lg)',
  gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
};

export function Toast({
  className,
  description,
  onClose,
  style,
  title,
  variant = 'info',
  ...props
}: ToastProps) {
  const { Icon, style: statusStyle } = variantConfig[variant];
  const role =
    variant === 'warning' || variant === 'danger' ? 'alert' : 'status';

  return (
    <div
      className={['flex w-full max-w-sm items-center text-left', className]
        .filter(Boolean)
        .join(' ')}
      role={role}
      style={{ ...toastStyle, ...statusStyle, ...style }}
      {...props}
    >
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 items-center justify-center"
        style={{ height: 'var(--space-6)', width: 'var(--space-6)' }}
      >
        <Icon className="size-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <strong className="block text-body-sm-web font-semibold">
          {title}
        </strong>
        <p className="mt-0.5 text-caption-web">{description}</p>
      </div>
      {onClose && (
        <button
          aria-label="알림 닫기"
          className="inline-flex shrink-0 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          onClick={onClose}
          style={{ height: 'var(--icon-md)', width: 'var(--icon-md)' }}
          type="button"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
