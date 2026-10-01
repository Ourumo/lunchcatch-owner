import { type InputHTMLAttributes, useId } from 'react';
import { Check } from 'lucide-react';

export type CheckboxSize = 'sm' | 'lg';
export type CheckboxVariant = 'primary' | 'inverse';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  label: string;
  // sm: 목록 안의 일반 항목, lg: 전체 동의처럼 화면에서 가장 중요한 선택
  size?: CheckboxSize;
  // 체크 상태 색. primary: 브랜드 색, inverse: 반전 색(라이트 테마에서 검은색)
  variant?: CheckboxVariant;
}

const sizeClassNames: Record<
  CheckboxSize,
  { label: string; box: string; icon: string }
> = {
  sm: {
    label: 'gap-2 text-body-sm-web',
    box: 'size-4',
    icon: 'size-4',
  },
  lg: {
    label: 'gap-3 text-body-mobile font-semibold',
    box: 'size-6',
    icon: 'size-5',
  },
};

const variantClassNames: Record<CheckboxVariant, string> = {
  primary:
    'text-text-inverse peer-checked:border-action-primary peer-checked:bg-action-primary',
  inverse:
    'text-text-on-inverse peer-checked:border-bg-inverse peer-checked:bg-bg-inverse',
};

export function Checkbox({
  className,
  id,
  label,
  size = 'sm',
  variant = 'primary',
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const sizeClassName = sizeClassNames[size];
  const labelClassName = [
    'inline-flex items-center text-text-primary',
    sizeClassName.label,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={labelClassName} htmlFor={inputId}>
      <input
        className="peer absolute opacity-0"
        id={inputId}
        type="checkbox"
        {...props}
      />
      <span
        className={`flex shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-bg-surface peer-checked:[&>svg]:opacity-100 peer-disabled:cursor-not-allowed peer-disabled:bg-surface-subtle peer-disabled:text-text-disabled ${variantClassNames[variant]} ${sizeClassName.box}`}
      >
        <Check
          aria-hidden="true"
          className={`opacity-0 ${sizeClassName.icon}`}
          strokeWidth={size === 'lg' ? 2.5 : 2}
        />
      </span>
      {label}
    </label>
  );
}
