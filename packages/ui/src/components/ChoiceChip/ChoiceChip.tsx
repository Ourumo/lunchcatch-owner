import type { InputHTMLAttributes, ReactNode } from 'react';

export interface ChoiceChipProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  // 하나만 고르면 radio, 여러 개를 고르면 checkbox
  type?: 'radio' | 'checkbox';
  children: ReactNode;
}

// 칩 모양의 선택 항목 (디자인 시스템 Form/Chip, 터치 영역 44px)
export function ChoiceChip({
  children,
  className,
  type = 'radio',
  ...props
}: ChoiceChipProps) {
  return (
    <label
      className={['flex h-11 cursor-pointer', className]
        .filter(Boolean)
        .join(' ')}
    >
      <input className="peer sr-only" type={type} {...props} />
      <span className="flex w-full items-center justify-center rounded-full border border-border-subtle bg-bg-surface px-3.5 text-caption-mobile font-medium whitespace-nowrap text-text-primary transition-colors peer-checked:bg-surface-brand peer-checked:text-action-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary">
        {children}
      </span>
    </label>
  );
}
