import { X } from 'lucide-react';

export interface FilterChipProps {
  label: string;
  onRemove?: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span
      className="inline-flex items-center text-caption-web font-medium"
      style={{
        backgroundColor: 'var(--color-status-info-bg)',
        border: '1px solid var(--color-status-info-border)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--color-status-info-fg)',
        gap: 'var(--space-1)',
        paddingBlock: 'calc(var(--space-2) - (var(--space-1) / 4))',
        paddingInline: 'var(--space-3)',
      }}
    >
      {label}
      {onRemove && (
        <button
          aria-label={`${label} 필터 삭제`}
          className="flex items-center justify-center rounded-full hover:bg-bg-surface"
          onClick={onRemove}
          style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }}
          type="button"
        >
          <X aria-hidden="true" className="size-3" strokeWidth={2} />
        </button>
      )}
    </span>
  );
}
