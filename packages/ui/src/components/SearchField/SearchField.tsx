import type { ComponentProps } from 'react';
import { Search } from 'lucide-react';

import { Input } from '../Input/Input';

export type SearchFieldProps = Omit<
  ComponentProps<typeof Input>,
  'label' | 'leadingIcon' | 'type'
>;

export function SearchField({
  placeholder = '검색어를 입력하세요',
  ...props
}: SearchFieldProps) {
  return (
    <Input
      leadingIcon={<Search className="size-full" strokeWidth={2} />}
      placeholder={placeholder}
      type="search"
      {...props}
    />
  );
}
