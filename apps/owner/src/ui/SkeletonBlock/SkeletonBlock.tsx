const roundedClassNames = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export interface SkeletonBlockProps {
  // 크기와 바깥 여백. 모서리는 rounded로 정한다
  className?: string;
  // 높이가 목록마다 다를 때 숫자(px)로 넘긴다
  height?: number;
  // 카드 안의 작은 영역은 lg, 화면의 카드 자리는 xl, 알약 모양 버튼 자리는 full
  rounded?: keyof typeof roundedClassNames;
  // 블록 하나로 불러오는 중을 알릴 때 스크린 리더에 읽을 문구. 없으면 스크린 리더에서 숨긴다
  label?: string;
}

// 내용을 불러오는 동안 그 자리를 채우는 회색 블록. 움직임 줄이기 설정이면 깜빡이지 않는다
export const SkeletonBlock = ({
  className,
  height,
  label,
  rounded = 'xl',
}: SkeletonBlockProps) => {
  const blockClassName = [
    'animate-pulse bg-surface-subtle motion-reduce:animate-none',
    roundedClassNames[rounded],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (label) {
    return (
      <div aria-busy="true" className={blockClassName} style={{ height }}>
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={blockClassName} style={{ height }} />
  );
};
