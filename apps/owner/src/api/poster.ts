import { ApiError, request } from './client';
import type {
  PrepareObjectUploadResponse,
  PrepareUploadRequest,
} from './imageUpload';
import type { ApiResult } from './types';

// 포스터 템플릿 조회와 슬롯 채우기 (docs/requirements-owner.md "포스터 관리")

export interface PosterTemplate {
  id: string;
  name: string;
  // 슬롯 자리를 data-slot 속성(eventName, discount, period, image)으로 표시한 HTML.
  // 관리자 템플릿 관리의 검증기를 통과해 스크립트와 외부 리소스가 없는 것만 내려온다
  html: string;
}

// 미리보기에서 템플릿 슬롯에 채우는 값. 글은 서버가 포스터를 만들 때 채우는 값과 같게 만든다
export interface PosterSlotValues {
  // 가게명
  eventName: string;
  discountText: string;
  // 쿠폰 사용 시간 (매일 11:30 ~ 15:00)
  period: string;
  // 미리보기에 그릴 포스터 이미지 주소. 올리기 전이면 null
  imageUrl: string | null;
}

// 점주가 고친 포스터 문구. 가게명은 글과 크기를, 할인은 쿠폰 조건으로 만든 기본 문구 뒤에 붙일 말과 크기를 고친다.
// 시간과 이미지는 고칠 수 없다. 글자 크기는 px이고, 템플릿이 px로 정하지 않았으면 null이다
export interface PosterTextValues {
  eventName: string;
  eventNameFontSizePx: number | null;
  discountSuffix: string;
  discountFontSizePx: number | null;
}

// 캠페인당 1건. 글은 서버가 가게명, 쿠폰 조건, 쿠폰 사용 시간으로 채우고, 점주는 템플릿과 이미지를 고른 뒤
// 가게명과 할인 문구를 고칠 수 있다
export interface CampaignPoster {
  // 처음 만들 때는 빈 문자열이고, 저장하면 서버가 정한다
  posterId: string;
  templateId: string;
  // 2단계에서 올린 포스터 이미지. 포스터 생성에 그대로 보낸다. 올리기 전이면 null
  imageObjectKey: string | null;
  // 미리보기에 그릴 포스터 이미지 주소. 올리기 전이면 null
  imageUrl: string | null;
  // 고친 문구. 고치지 않았으면 null이고 서버가 채운 글과 템플릿의 크기를 그대로 쓴다
  text: PosterTextValues | null;
}

// 포스터 생성에 필요한 값(템플릿, 이미지)이 모두 있는지
export const isPosterComplete = (poster: CampaignPoster | null) =>
  poster !== null && poster.templateId !== '' && poster.imageObjectKey !== null;

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

const parsePosterHtml = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

// 템플릿 HTML 구조는 그대로 두고 data-slot 자리의 글과 이미지만 바꾼다.
// 글은 textContent로 넣어 점주가 입력한 값이 태그로 해석되지 않는다. 이미지를 고르기 전이면 템플릿 그대로 둔다
export const fillPosterTemplate = (html: string, slots: PosterSlotValues) => {
  const document = parsePosterHtml(html);

  // 광고 표시는 없어져 서버가 만든 포스터에도 없다. 템플릿에 남은 광고 라벨 자리는 미리보기에서도 지운다
  document
    .querySelectorAll('[data-slot="adLabel"]')
    .forEach((element) => element.remove());

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

// 포스터 이미지 업로드 주소 발급. 작성 중(DRAFT) 캠페인에서만 된다. 공통 업로드 함수(uploadImage)의 prepare에 넘긴다
export const preparePosterImageUpload = (
  campaignId: string,
  { contentType, fileSize }: PrepareUploadRequest,
) =>
  request<PrepareObjectUploadResponse>(
    `/v1/owner/campaigns/${encodeURIComponent(campaignId)}/poster:prepareUpload`,
    { method: 'POST', body: { contentType, fileSize } },
  );

// 점주용 포스터 응답의 슬롯별 현재 값. 편집 입력칸을 HTML을 읽지 않고 채운다
export interface PosterSlotsResponse {
  eventName: { text: string; fontSizePx: number | null };
  // 할인 문구는 baseText + 공백 + suffix다. 붙인 말이 없으면 suffix는 빈 문자열
  discount: { baseText: string; suffix: string; fontSizePx: number | null };
  period: { text: string };
}

// 저장된 포스터. 글은 서버가 가게명, 쿠폰 조건, 쿠폰 사용 시간으로 채운 값이고, 점주가 고친 문구가 반영돼 있다.
// 포스터 생성·수정 응답도 같은 모양이다
export interface PosterResponse {
  posterId: number;
  campaignId: number;
  templateId: number;
  // "{가게명} - {템플릿 이름}"
  title: string;
  // 슬롯이 모두 채워진 완성 HTML
  html: string;
  slots: PosterSlotsResponse;
}

export const toPosterTextValues = ({
  discount,
  eventName,
}: PosterSlotsResponse): PosterTextValues => ({
  eventName: eventName.text,
  eventNameFontSizePx: eventName.fontSizePx,
  discountSuffix: discount.suffix,
  discountFontSizePx: discount.fontSizePx,
});

// 포스터 문구 수정 요청 본문. 바꾸지 않은 필드는 보내지 않는다
export interface PosterTextPatch {
  eventName?: { text?: string; fontSizePx?: number };
  discount?: { suffix?: string; fontSizePx?: number };
}

// 화면 값과 서버에 저장된 슬롯 값이 다른 필드만 모은다. 바꿀 것이 없으면 null.
// 글은 서버처럼 앞뒤 공백을 자른 값으로 견주고, 크기를 정하지 않았으면(null) 보내지 않는다
export const getPosterTextPatch = (
  text: PosterTextValues | null,
  slots: PosterSlotsResponse,
): PosterTextPatch | null => {
  if (!text) {
    return null;
  }

  const eventNameText = text.eventName.trim();
  const discountSuffix = text.discountSuffix.trim();
  const eventName = {
    ...(eventNameText !== slots.eventName.text && { text: eventNameText }),
    ...(text.eventNameFontSizePx !== null &&
      text.eventNameFontSizePx !== slots.eventName.fontSizePx && {
        fontSizePx: text.eventNameFontSizePx,
      }),
  };
  const discount = {
    ...(discountSuffix !== slots.discount.suffix && {
      suffix: discountSuffix,
    }),
    ...(text.discountFontSizePx !== null &&
      text.discountFontSizePx !== slots.discount.fontSizePx && {
        fontSizePx: text.discountFontSizePx,
      }),
  };
  const patch: PosterTextPatch = {
    ...(Object.keys(eventName).length > 0 && { eventName }),
    ...(Object.keys(discount).length > 0 && { discount }),
  };

  return Object.keys(patch).length > 0 ? patch : null;
};

export interface SavedPoster {
  // 확인 단계와 캠페인 상세에 그대로 보여주는 완성 HTML
  html: string;
  // 이어서 작성할 때 2단계에 채우는 템플릿과 이미지. 이미지는 완성 HTML에서 꺼낸다
  poster: CampaignPoster;
}

// 서버 포스터의 이미지는 CDN 주소이고, 주소의 경로가 업로드 때 받은 objectKey다
const toObjectKey = (imageUrl: string) => {
  try {
    return decodeURIComponent(new URL(imageUrl).pathname.slice(1)) || null;
  } catch {
    return null;
  }
};

// 조회 응답에는 템플릿 ID와 완성 HTML만 있어, 이미지는 HTML의 data-slot 자리에서 꺼낸다
const toCampaignPoster = ({
  html,
  posterId,
  slots,
  templateId,
}: PosterResponse): CampaignPoster => {
  const imageUrl =
    parsePosterHtml(html)
      .querySelector('img[data-slot="image"]')
      ?.getAttribute('src') || null;

  return {
    posterId: String(posterId),
    templateId: String(templateId),
    imageObjectKey: imageUrl ? toObjectKey(imageUrl) : null,
    imageUrl,
    text: toPosterTextValues(slots),
  };
};

// 캠페인에 저장된 포스터. 아직 만들지 않았으면(POSTER-020) null
export const getCampaignPoster = async (
  campaignId: string,
): Promise<ApiResult<SavedPoster | null>> => {
  try {
    const data = await request<PosterResponse>(
      `/v1/owner/campaigns/${encodeURIComponent(campaignId)}/poster`,
    );

    return {
      ok: true,
      data: { html: data.html, poster: toCampaignPoster(data) },
    };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'POSTER-020') {
      return { ok: true, data: null };
    }

    return { ok: false };
  }
};
