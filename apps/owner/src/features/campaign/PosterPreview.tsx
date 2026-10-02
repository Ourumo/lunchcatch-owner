import { fillPosterTemplate, type PosterSlotValues } from '@owner/api/poster';

export interface PosterPreviewProps {
  // 슬롯 자리표시가 든 템플릿 HTML
  html: string;
  slots: PosterSlotValues;
  className?: string;
}

// 템플릿에 슬롯 값을 채운 포스터를 iframe으로 보여준다.
// sandbox를 비워 두어 스크립트, 폼, 링크 이동을 모두 막고 이미지와 스타일만 그린다
export const PosterPreview = ({
  className,
  html,
  slots,
}: PosterPreviewProps) => {
  return (
    <iframe
      className={['block aspect-[3/4] w-full border-0', className]
        .filter(Boolean)
        .join(' ')}
      sandbox=""
      srcDoc={fillPosterTemplate(html, slots)}
      tabIndex={-1}
      title="포스터 미리보기"
    />
  );
};
