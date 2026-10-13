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
        // 좁은 필터 바에서도 flex 축소로 입력 영역이 지나치게 좁아지지 않도록 최소 폭을 유지한다.
        '!w-[clamp(180px,14vw,200px)] shrink-0',
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
