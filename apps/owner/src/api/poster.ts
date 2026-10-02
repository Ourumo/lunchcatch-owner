import { mockDelay } from './mocks/delay';
import { mockPosterTemplates } from './mocks/templates';
import type { ApiResult } from './types';

// 포스터 템플릿 조회와 슬롯 채우기 (docs/requirements-owner.md "포스터 관리")
// API 연동 전까지 mock 데이터로 동작한다. 연동할 때는 이 파일의 함수 내부만 교체한다

export interface PosterTemplate {
  id: string;
  name: string;
  // 슬롯 자리에 {{eventName}}처럼 슬롯 이름이 들어 있는 HTML.
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
  posterId: string;
  templateId: string;
  slots: PosterSlotValues;
}

// 게시되고 활성 상태인 템플릿만 내려온다. 하나도 없으면 빈 배열
export const getPosterTemplates = async (): Promise<
  ApiResult<PosterTemplate[]>
> => {
  await mockDelay();

  return { ok: true, data: structuredClone(mockPosterTemplates) };
};

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => htmlEscapes[char]);

// 템플릿 HTML 구조는 그대로 두고 슬롯 값만 채운다. 점주가 입력한 값이 태그로 해석되지 않도록 이스케이프한다
export const fillPosterTemplate = (html: string, slots: PosterSlotValues) =>
  html.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => {
    if (!(name in slots)) {
      return placeholder;
    }

    return escapeHtml(slots[name as keyof PosterSlotValues] ?? '');
  });
