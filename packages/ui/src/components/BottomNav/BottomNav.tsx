import type { HTMLAttributes, ReactNode } from 'react';

export interface BottomNavItem {
  value: string;
  label: string;
  icon: ReactNode;
}

export interface BottomNavProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange'
> {
  items: BottomNavItem[];
  value: string;
  onValueChange?: (value: string) => void;
}

export function BottomNav({
  className,
  items,
  onValueChange,
  value,
  ...props
}: BottomNavProps) {
  return (
    <nav
      aria-label="하단 메뉴"
      className={[
        // iPhone 홈 바 영역이 있으면 그만큼, 없으면 8px 띄운다
        'px-3 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <ul className="m-0 flex h-[68px] list-none items-center rounded-3xl border border-border-subtle bg-bg-surface px-1.5 shadow-[0_5px_14px_rgba(36,36,36,0.1)]">
        {items.map((item) => {
          const isSelected = item.value === value;

          return (
            <li className="flex min-w-0 flex-1" key={item.value}>
              <button
                aria-current={isSelected ? 'page' : undefined}
                className={`flex h-14 w-full flex-col items-center justify-center gap-1 rounded-[18px] border-0 bg-transparent text-[11px] leading-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary ${
                  isSelected
                    ? 'font-bold text-text-brand'
                    : 'font-medium text-text-secondary'
                }`}
                onClick={() => onValueChange?.(item.value)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex size-[22px] items-center justify-center [&>svg]:size-full"
                >
                  {item.icon}
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
