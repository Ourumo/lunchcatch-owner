import { fillPosterTemplate, type PosterSlotValues } from '@owner/api/poster';

// 템플릿은 폭 360px 안팎으로 만들어져 있어, 더 작게 보여줄 때는 이 크기로 그린 뒤 줄인다
const POSTER_BASE_WIDTH = 360;
// 템플릿은 관리자 템플릿 관리에서 A4 비율(210:297)로 만든다
const POSTER_HEIGHT_RATIO = 297 / 210;

export interface PosterPreviewProps {
  // 템플릿 HTML, 또는 서버가 슬롯을 모두 채운 완성 HTML
  html: string;
  // 넘기면 템플릿의 슬롯 자리를 이 값으로 채운다. 완성 HTML은 넘기지 않고 그대로 그린다
  slots?: PosterSlotValues;
  // 넘기면 이 폭(px)으로 줄여서 보여준다. 없으면 감싼 요소의 폭을 채운다
  width?: number;
  // 템플릿에서 점주가 고칠 수 있는 칸(가게명, 할인)을 점선으로 표시한다
  markEditable?: boolean;
  className?: string;
}

// 포스터를 iframe으로 보여준다. 템플릿이면 슬롯 값을 채운다.
// sandbox를 비워 두어 스크립트, 폼, 링크 이동을 모두 막고 이미지와 스타일만 그린다
export const PosterPreview = ({
  className,
  html,
  markEditable,
  slots,
  width,
}: PosterPreviewProps) => {
  const srcDoc = slots
    ? fillPosterTemplate(html, slots, { markEditable })
    : html;
  const frame = (
    <iframe
      className={['block aspect-[210/297] w-full border-0', className]
        .filter(Boolean)
        .join(' ')}
      // 그려 둔 iframe의 srcdoc을 바꾸면 iframe이 다른 문서로 이동해 브라우저 방문 기록이 하나씩 쌓이고,
      // 뒤로 가기가 화면 대신 미리보기를 되돌린다. 내용이 바뀌면 iframe을 새로 만들어 기록이 남지 않게 한다
      key={srcDoc}
      sandbox=""
      srcDoc={srcDoc}
      tabIndex={-1}
      title="포스터 미리보기"
    />
  );

  if (width === undefined) {
    return frame;
  }

  // 줄인 미리보기는 누를 수 없도록 iframe에 포인터를 막는다
  return (
    <div
      className="overflow-hidden"
      style={{ height: width * POSTER_HEIGHT_RATIO, width }}
    >
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
