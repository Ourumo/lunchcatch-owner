import { http } from 'msw/http';

import { getDb, updateDb } from '@owner/mocks/db';
import {
  hasTemplate,
  MOCK_TEMPLATES,
  toPosterResponse,
} from '@owner/mocks/poster';
import { fail, ok, unauthenticated } from '@owner/mocks/response';

import { createUpload } from './imageUpload';

// 포스터 템플릿 · 포스터 (api/poster.ts, api/campaign.ts의 savePosterStep)

type CampaignParams = { campaignId: string };

interface CreateBody {
  templateId: number;
  objectKey: string;
}

interface PatchBody {
  eventName?: { text?: string; fontSizePx?: number };
  discount?: { suffix?: string; fontSizePx?: number };
}

const posterNotFound = () =>
  fail(404, 'POSTER-020', '포스터를 먼저 만들어 주세요.');

// 포스터는 작성 중 캠페인에서만 만들고 고칠 수 있다. 통과하면 캠페인, 아니면 거절 응답
const findDraftCampaign = (campaignId: string) => {
  const db = getDb();

  if (!db.owner.isLoggedIn) return { error: unauthenticated() } as const;

  const campaign = db.campaigns.find(
    (item) => String(item.campaignId) === campaignId,
  );

  if (!campaign) {
    return {
      error: fail(404, 'CAMPAIGN-005', '캠페인을 찾을 수 없습니다.'),
    } as const;
  }

  if (campaign.status !== 'DRAFT') {
    return {
      error: fail(409, 'CAMPAIGN-006', '작성 중인 캠페인만 바꿀 수 있습니다.'),
    } as const;
  }

  return { campaign } as const;
};

// 포스터 생성 요청의 objectKey로 사진을 찾는다.
// - 이번에 올린 사진이면 업로드 ID라 보관한 사진을 쓴다
// - 이어서 작성할 때는 화면이 저장된 포스터 HTML의 사진 주소에서 경로를 objectKey로 꺼내 보낸다(api/poster.ts toObjectKey).
//   목 포스터 사진은 data URL이라 "data:image/..."에서 앞의 "data:i"가 빠진 글자가 온다. 그것을 다시 붙인다
const resolveImageUrl = (objectKey: string) => {
  const uploaded = getDb().uploads[objectKey]?.url;

  if (uploaded) return uploaded;
  if (objectKey.startsWith('mage/')) return `data:i${objectKey}`;

  return null;
};

export const posterHandlers = [
  // 게시된 템플릿 목록 (최신순)
  http.get('*/v1/owner/templates', () => {
    if (!getDb().owner.isLoggedIn) return unauthenticated();

    return ok(MOCK_TEMPLATES);
  }),

  // 저장된 포스터. 아직 만들지 않았으면 404 POSTER-020
  http.get<CampaignParams>(
    '*/v1/owner/campaigns/:campaignId/poster',
    ({ params }) => {
      const db = getDb();

      if (!db.owner.isLoggedIn) return unauthenticated();

      const poster = db.posters.find(
        ({ campaignId }) => String(campaignId) === params.campaignId,
      );

      return poster ? ok(toPosterResponse(db, poster)) : posterNotFound();
    },
  ),

  // 포스터 생성. 캠페인당 1건이라 이미 있으면 덮어쓴다.
  // 같은 템플릿으로 다시 만들면 고친 문구를 남기고, 다른 템플릿이면 문구를 처음 값으로 되돌린다
  http.post<CampaignParams, CreateBody>(
    '*/v1/owner/campaigns/:campaignId/poster',
    async ({ params, request }) => {
      const result = findDraftCampaign(params.campaignId);

      if ('error' in result) return result.error;

      const { campaignId } = result.campaign;
      const { objectKey, templateId } = await request.json();
      const imageUrl = resolveImageUrl(objectKey);

      if (!hasTemplate(templateId)) {
        return fail(422, 'POSTER-010', '고른 템플릿을 지금은 쓸 수 없습니다.');
      }

      if (!imageUrl) {
        return fail(
          422,
          'POSTER-011',
          '포스터 사진을 찾을 수 없습니다. 다시 올려 주세요.',
        );
      }

      updateDb((db) => {
        const saved = db.posters.find((item) => item.campaignId === campaignId);
        const keepsText = saved?.templateId === templateId;
        const poster = {
          posterId: saved?.posterId ?? db.nextId,
          campaignId,
          templateId,
          imageUrl,
          eventNameText: keepsText ? saved.eventNameText : null,
          eventNameFontSizePx: keepsText ? saved.eventNameFontSizePx : null,
          discountSuffix: keepsText ? saved.discountSuffix : '',
          discountFontSizePx: keepsText ? saved.discountFontSizePx : null,
        };

        if (!saved) db.nextId += 1;
        db.posters = [
          ...db.posters.filter((item) => item.campaignId !== campaignId),
          poster,
        ];
      });

      const poster = getDb().posters.find(
        (item) => item.campaignId === campaignId,
      );

      return poster ? ok(toPosterResponse(getDb(), poster)) : posterNotFound();
    },
  ),

  // 포스터 문구 수정. 바꾼 필드만 온다. 시간과 사진은 고칠 수 없다
  http.patch<CampaignParams, PatchBody>(
    '*/v1/owner/campaigns/:campaignId/poster',
    async ({ params, request }) => {
      const result = findDraftCampaign(params.campaignId);

      if ('error' in result) return result.error;

      const { campaignId } = result.campaign;

      if (!getDb().posters.some((item) => item.campaignId === campaignId)) {
        return posterNotFound();
      }

      const { discount, eventName } = await request.json();

      updateDb((db) => {
        const poster = db.posters.find(
          (item) => item.campaignId === campaignId,
        );

        if (!poster) return;
        if (eventName?.text !== undefined)
          poster.eventNameText = eventName.text;
        if (eventName?.fontSizePx !== undefined) {
          poster.eventNameFontSizePx = eventName.fontSizePx;
        }
        if (discount?.suffix !== undefined)
          poster.discountSuffix = discount.suffix;
        if (discount?.fontSizePx !== undefined) {
          poster.discountFontSizePx = discount.fontSizePx;
        }
      });

      const poster = getDb().posters.find(
        (item) => item.campaignId === campaignId,
      );

      return poster ? ok(toPosterResponse(getDb(), poster)) : posterNotFound();
    },
  ),

  // 포스터 사진 업로드 주소 발급. 가게 사진과 같은 가짜 업로드 경로를 쓰고, 확인 단계 없이 objectKey를 포스터 생성에 보낸다
  http.post<CampaignParams>(
    '*/v1/owner/campaigns/:campaignId/poster\\:prepareUpload',
    ({ params }) => {
      const result = findDraftCampaign(params.campaignId);

      if ('error' in result) return result.error;

      const { uploadId, uploadUrl } = createUpload({
        target: 'POSTER',
        menuId: null,
        sortOrder: 0,
      });

      return ok({ objectKey: uploadId, uploadUrl });
    },
  ),
];
