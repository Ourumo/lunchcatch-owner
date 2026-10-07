import type { ComponentProps } from 'react';
import { Search } from 'lucide-react';

import { Input } from '../Input/Input';

export type SearchFieldProps = Omit<
  ComponentProps<typeof Input>,
  'label' | 'leadingIcon' | 'type'
>;

export function SearchField({
  containerClassName,
  placeholder = '검색어를 입력하세요',
  ...props
}: SearchFieldProps) {
  return (
    <Input
      containerClassName={[
        '!w-[clamp(200px,20vw,320px)] shrink-0',
        containerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
      leadingIcon={<Search className="size-full" strokeWidth={2} />}
      placeholder={placeholder}
      type="search"
      {...props}
    />
  );
}
