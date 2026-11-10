import type { MockDb, MockPoster } from './seed';

// 시연용 포스터 템플릿과 포스터 만들기.
// 원래 템플릿은 관리자가 LLM으로 만들어 올리고, 서버가 템플릿의 data-slot 자리에 가게명 · 할인 문구 · 사용 시간 · 사진을 채워
// 완성 HTML을 만든다. 목 서버는 같은 규칙으로 직접 채운다.
// 템플릿 규칙: 폭 360px 안팎에서 늘고 줄며 A4 비율(210:297), 스크립트와 외부 리소스 없음. 가게명과 할인 칸은 인라인 font-size(px)로 크기를 정한다

export interface MockTemplate {
  templateId: number;
  name: string;
  html: string;
}

// 포스터 칸의 폭은 화면마다 다르다(미리보기 360px, 캠페인 상세는 그보다 좁다). 폭에 맞춰 늘고 줄도록 비율로 그린다
const page = (body: string) =>
  `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>` +
  `*{box-sizing:border-box;margin:0;padding:0}` +
  `html,body{width:100%;height:100%;overflow:hidden}` +
  `body{font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;word-break:keep-all;overflow-wrap:anywhere}` +
  `img{display:block;width:100%;object-fit:cover}` +
  `</style></head><body>${body}</body></html>`;

export const MOCK_TEMPLATES: MockTemplate[] = [
  {
    templateId: 3,
    name: '따뜻한 점심 한 끼',
    html: page(
      `<div style="height:100%;background:#fff4ea;padding:8% 7%;display:flex;flex-direction:column;gap:4%">` +
        `<p style="color:#f56b20;font-size:13px;font-weight:700;letter-spacing:2px">LUNCH COUPON</p>` +
        `<h1 data-slot="eventName" style="font-size:30px;font-weight:800;color:#2f2a27;line-height:1.25">가게명</h1>` +
        `<img data-slot="image" src="" alt="" style="aspect-ratio:3/2;border-radius:20px;background:#ffe2cc">` +
        `<p data-slot="discount" style="font-size:26px;font-weight:800;color:#f56b20;line-height:1.3">할인 문구</p>` +
        `<p data-slot="period" style="margin-top:auto;font-size:15px;font-weight:600;color:#5c544e">사용 시간</p>` +
        `</div>`,
    ),
  },
  {
    templateId: 2,
    name: '깔끔한 화이트',
    html: page(
      `<div style="height:100%;background:#ffffff;display:flex;flex-direction:column">` +
        `<img data-slot="image" src="" alt="" style="aspect-ratio:4/3;background:#eeeae6">` +
        `<div style="flex:1;padding:7%;display:flex;flex-direction:column;gap:8px;border-top:6px solid #f56b20">` +
        `<h1 data-slot="eventName" style="font-size:26px;font-weight:700;color:#1f1b19;line-height:1.25">가게명</h1>` +
        `<p data-slot="discount" style="font-size:24px;font-weight:800;color:#d9480f;line-height:1.3">할인 문구</p>` +
        `<p data-slot="period" style="margin-top:auto;font-size:14px;color:#6b625c">사용 시간</p>` +
        `</div></div>`,
    ),
  },
  {
    templateId: 1,
    name: '진한 밤색 간판',
    html: page(
      `<div style="height:100%;background:#2f2a27;padding:7%;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4%">` +
        `<h1 data-slot="eventName" style="font-size:28px;font-weight:800;color:#fff4ea;line-height:1.25">가게명</h1>` +
        `<img data-slot="image" src="" alt="" style="width:66%;aspect-ratio:1;border-radius:50%;border:6px solid #f56b20;background:#4a423d">` +
        `<p data-slot="discount" style="font-size:28px;font-weight:900;color:#ffb27a;line-height:1.3">할인 문구</p>` +
        `<p data-slot="period" style="margin-top:auto;padding:8px 16px;border-radius:999px;background:#f56b20;font-size:14px;font-weight:700;color:#ffffff">사용 시간</p>` +
        `</div>`,
    ),
  },
];

const findTemplate = (templateId: number) =>
  MOCK_TEMPLATES.find((template) => template.templateId === templateId);

// 템플릿이 정한 글자 크기(px). 서버도 인라인 font-size가 px일 때만 읽는다
const readFontSizePx = (html: string, slot: string) => {
  const element = new DOMParser()
    .parseFromString(html, 'text/html')
    .querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  const size = element?.style.fontSize ?? '';

  return size.endsWith('px') ? Math.round(Number.parseFloat(size)) : null;
};

// 할인 칸의 기본 문구. 화면 미리보기와 같은 형식이다 (예: 전체 메뉴 15% 할인)
const toDiscountBaseText = (db: MockDb, campaignId: number) => {
  const campaign = db.campaigns.find((item) => item.campaignId === campaignId);

  if (!campaign) return '';

  const target =
    campaign.discountTargetType === 'MENU'
      ? (db.store.menus.find(({ menuId }) => menuId === campaign.targetMenuId)
          ?.name ?? '')
      : '전체 메뉴';
  const unit = campaign.discountType === 'PERCENT' ? '%' : '원';

  return `${target} ${campaign.discountValue}${unit} 할인`.trim();
};

// 시간 칸은 집행 기간이 아니라 쿠폰 사용 시간이다
const toPeriodText = (db: MockDb, campaignId: number) => {
  const campaign = db.campaigns.find((item) => item.campaignId === campaignId);

  return campaign
    ? `매일 ${campaign.usableStartTime.slice(0, 5)} ~ ${campaign.usableEndTime.slice(0, 5)}`
    : '';
};

// 서버 포스터 응답 (GET · POST · PATCH /v1/owner/campaigns/{id}/poster). 슬롯을 채운 완성 HTML과 슬롯 값
export const toPosterResponse = (db: MockDb, poster: MockPoster) => {
  const template = findTemplate(poster.templateId) ?? MOCK_TEMPLATES[0];
  const eventNameText =
    poster.eventNameText ?? (db.store.name ?? '').slice(0, 30);
  const eventNameFontSizePx =
    poster.eventNameFontSizePx ?? readFontSizePx(template.html, 'eventName');
  const discountFontSizePx =
    poster.discountFontSizePx ?? readFontSizePx(template.html, 'discount');
  const baseText = toDiscountBaseText(db, poster.campaignId);
  const periodText = toPeriodText(db, poster.campaignId);
  const document = new DOMParser().parseFromString(template.html, 'text/html');

  const fill = (slot: string, text: string, fontSizePx?: number | null) => {
    document
      .querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)
      .forEach((element) => {
        element.textContent = text;
        if (fontSizePx) element.style.fontSize = `${fontSizePx}px`;
      });
  };

  fill('eventName', eventNameText, eventNameFontSizePx);
  fill(
    'discount',
    poster.discountSuffix ? `${baseText} ${poster.discountSuffix}` : baseText,
    discountFontSizePx,
  );
  fill('period', periodText);
  document
    .querySelectorAll('img[data-slot="image"]')
    .forEach((image) => image.setAttribute('src', poster.imageUrl));

  return {
    posterId: poster.posterId,
    campaignId: poster.campaignId,
    templateId: template.templateId,
    title: `${db.store.name ?? ''} - ${template.name}`,
    html: `<!doctype html>${document.documentElement.outerHTML}`,
    slots: {
      eventName: { text: eventNameText, fontSizePx: eventNameFontSizePx },
      discount: {
        baseText,
        suffix: poster.discountSuffix,
        fontSizePx: discountFontSizePx,
      },
      period: { text: periodText },
    },
  };
};

export const hasTemplate = (templateId: number) =>
  findTemplate(templateId) !== undefined;
