import { fillPosterTemplate, type PosterSlotValues } from '@owner/api/poster';

// 템플릿은 폭 360px 안팎으로 만들어져 있어, 더 작게 보여줄 때는 이 크기로 그린 뒤 줄인다
const POSTER_BASE_WIDTH = 360;

export interface PosterPreviewProps {
  // 슬롯 자리표시가 든 템플릿 HTML
  html: string;
  slots: PosterSlotValues;
  // 넘기면 이 폭(px)으로 줄여서 보여준다. 없으면 감싼 요소의 폭을 채운다
  width?: number;
  className?: string;
}

// 템플릿에 슬롯 값을 채운 포스터를 iframe으로 보여준다.
// sandbox를 비워 두어 스크립트, 폼, 링크 이동을 모두 막고 이미지와 스타일만 그린다
export const PosterPreview = ({
  className,
  html,
  slots,
  width,
}: PosterPreviewProps) => {
  const frame = (
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

  if (width === undefined) {
    return frame;
  }

  // 줄인 미리보기는 누를 수 없도록 iframe에 포인터를 막는다
  return (
    <div className="overflow-hidden" style={{ height: (width * 4) / 3, width }}>
      <div
        className="pointer-events-none origin-top-left"
        style={{
          transform: `scale(${width / POSTER_BASE_WIDTH})`,
          width: POSTER_BASE_WIDTH,
        }}
      >
        {frame}
      </div>
    </div>
  );
};
