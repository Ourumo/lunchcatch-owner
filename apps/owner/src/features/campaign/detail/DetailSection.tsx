import type { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

// 상세 화면의 정보 묶음 카드. 항목은 DetailRow로 채운다
export const DetailSection = ({ children, title }: DetailSectionProps) => (
  <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
    <h2 className="text-body-mobile font-bold text-text-primary">{title}</h2>
    <dl className="mt-3 flex flex-col gap-2.5">{children}</dl>
  </section>
);

interface DetailRowProps {
  label: string;
  // 값이 없으면(작성 중인 캠페인의 미입력 항목) '입력 전'으로 보여준다
  value?: ReactNode;
  isHighlighted?: boolean;
  // 값 대신 이유를 보여줄 때(불러오는 중, 불러오지 못함) 미입력과 같은 흐린 글자로 둔다
  isMuted?: boolean;
}

export const DetailRow = ({
  isHighlighted,
  isMuted,
  label,
  value,
}: DetailRowProps) => {
  // 조건부 값(cond && 값)이 false로 넘어와도 미입력으로 본다
  const isEmpty =
    value === undefined || value === null || value === false || value === '';

  return (
    <div className="flex items-start justify-between gap-4 text-body-sm-mobile">
      <dt className="shrink-0 text-text-secondary">{label}</dt>
      <dd
        className={`text-right break-keep ${
          isEmpty || isMuted
            ? 'text-text-secondary'
            : isHighlighted
              ? 'font-bold text-text-brand'
              : 'font-medium text-text-primary'
        }`}
      >
        {isEmpty ? '입력 전' : value}
      </dd>
    </div>
  );
};

interface DetailNoteProps {
  label: string;
  value: string;
}

// 여러 줄일 수 있는 긴 값(유의사항 등). 오른쪽 정렬 대신 라벨 아래에 왼쪽 정렬로 보여준다
export const DetailNote = ({ label, value }: DetailNoteProps) => (
  <div className="flex flex-col gap-1 text-body-sm-mobile">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="font-medium break-keep whitespace-pre-line text-text-primary">
      {value}
    </dd>
  </div>
);
