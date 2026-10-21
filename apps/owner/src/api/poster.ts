import { request } from './client';
import type { ApiResult } from './types';

// 포스터 템플릿 조회와 슬롯 채우기 (docs/requirements-owner.md "포스터 관리")

export interface PosterTemplate {
  id: string;
  name: string;
  // 슬롯 자리를 data-slot 속성(eventName, discount, period, image, adLabel)으로 표시한 HTML.
  // 관리자 템플릿 관리의 검증기를 통과해 스크립트와 외부 리소스가 없는 것만 내려온다
  html: string;
}

// 템플릿 슬롯에 채우는 값. 광고 라벨은 점주가 지우거나 바꿀 수 없어 템플릿 안에 고정하고 여기에 두지 않는다
export interface PosterSlotValues {
  eventName: string;
  discountText: string;
  // 집행 기간인지 사용 가능 시간인지 확정되지 않아 화면에 적을 문구 그대로 둔다
  period: string;
  storeName: string;
  // 가게 이미지 또는 메뉴 이미지. 고르지 않으면 null
  imageUrl: string | null;
}

// 캠페인당 1건
export interface CampaignPoster {
  // 처음 만들 때는 빈 문자열이고, 저장하면 서버가 정한다
  posterId: string;
  templateId: string;
  slots: PosterSlotValues;
}

// 슬롯 입력 길이 제한. 관리자 검수 기준(제목 길이)에 맞춰 연동 때 서버 값으로 바꾼다
export const POSTER_TEXT_MAX_LENGTH = {
  discountText: 20,
  eventName: 30,
  storeName: 20,
} as const;

// 포스터 생성에 필요한 값(템플릿, 할인 내용, 기간, 가게명)이 모두 있는지. 이미지와 이벤트명은 선택이다
export const isPosterComplete = (poster: CampaignPoster | null) =>
  poster !== null &&
  poster.templateId !== '' &&
  poster.slots.discountText.trim() !== '' &&
  poster.slots.period.trim() !== '' &&
  poster.slots.storeName.trim() !== '';

// 게시되고 활성인 템플릿만 최신순으로 내려온다
interface OwnerTemplateResponse {
  templateId: number;
  name: string;
  html: string;
}

// 하나도 없으면 빈 배열
export const getPosterTemplates = async (): Promise<
  ApiResult<PosterTemplate[]>
> => {
  try {
    const templates = await request<OwnerTemplateResponse[]>(
      '/v1/owner/templates',
    );

    return {
      ok: true,
      data: templates.map(({ html, name, templateId }) => ({
        id: String(templateId),
        name,
        html,
      })),
    };
  } catch {
    return { ok: false };
  }
};

// 템플릿의 글 슬롯 이름과 화면 값 이름이 달라 여기서 맞춘다
const textSlots = {
  eventName: 'eventName',
  discount: 'discountText',
  period: 'period',
} as const satisfies Record<string, keyof PosterSlotValues>;

// 템플릿 HTML 구조는 그대로 두고 data-slot 자리의 글과 이미지만 바꾼다.
// 글은 textContent로 넣어 점주가 입력한 값이 태그로 해석되지 않는다. 이미지를 고르기 전이면 템플릿 그대로 둔다
export const fillPosterTemplate = (html: string, slots: PosterSlotValues) => {
  const document = new DOMParser().parseFromString(html, 'text/html');

  Object.entries(textSlots).forEach(([slot, key]) => {
    document.querySelectorAll(`[data-slot="${slot}"]`).forEach((element) => {
      element.textContent = slots[key];
    });
  });

  if (slots.imageUrl) {
    document
      .querySelectorAll('img[data-slot="image"]')
      .forEach((image) => image.setAttribute('src', slots.imageUrl ?? ''));
  }

  return document.documentElement.outerHTML;
};
