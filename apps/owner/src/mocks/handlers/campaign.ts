import { http } from 'msw/http';

import {
  addDays,
  getKstTime,
  getKstToday,
  toKstDateTime,
} from '@owner/mocks/date';
import { getDb, updateDb } from '@owner/mocks/db';
import { fail, ok, unauthenticated } from '@owner/mocks/response';
import type { MockCampaign, MockCampaignStatus } from '@owner/mocks/seed';
import { sumStats } from '@owner/mocks/stats';

// 캠페인 목록 · 상세 · 성과 · 등록 · 상태 변경 (api/campaign.ts)
//
// 경로의 `:campaignId`는 경로 변수다. `/v1/owner/campaigns/3`으로 오면 params.campaignId가 '3'이 된다.
// 기간(from, to) 같은 쿼리 문자열은 경로 매칭에 쓰지 않고, 핸들러 안에서 request.url로 읽는다

type CampaignParams = { campaignId: string };

// 가게당 하나만 둘 수 있는 끝나지 않은 캠페인 중, 새 캠페인을 막는 상태 (작성 중은 이어서 쓴다)
const RUNNING_STATUSES: MockCampaignStatus[] = [
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
];

const ALL_AGE_GROUPS = ['AGE_20S', 'AGE_30S', 'AGE_40S', 'AGE_50_PLUS'];

// 서버 기준값 (api/mocks/platform.ts의 최소 하루 예산과 같다)
const MIN_DAILY_BUDGET = 1000;

// 날짜가 지나면 서버 스케줄러가 바꾸는 상태를 따라간다. 캠페인을 읽는 요청마다 먼저 부른다
// - 대기 중(SCHEDULED)은 시작일 00:00부터 진행 중(ACTIVE)
// - 진행 중 · 일시중지는 종료일 다음 날부터 종료(ENDED)
const syncCampaignStatuses = () => {
  const today = getKstToday();
  const toStatus = ({ endDate, startDate, status }: MockCampaign) => {
    if (endDate && today > endDate && status !== 'DRAFT') return 'ENDED';
    if (status === 'SCHEDULED' && startDate && today >= startDate) {
      return 'ACTIVE';
    }
    return status;
  };

  if (
    getDb().campaigns.some((campaign) => toStatus(campaign) !== campaign.status)
  ) {
    updateDb((db) => {
      db.campaigns.forEach((campaign) => {
        const status = toStatus(campaign);

        if (status !== campaign.status) {
          campaign.status = status;
          campaign.pausedReason = null;
        }
      });
    });
  }
};

interface CouponBody {
  discountTargetType: MockCampaign['discountTargetType'];
  discountType: MockCampaign['discountType'];
  discountValue: number;
  targetMenuId?: number;
  issueQuantity: number;
  usableStartTime: string;
  usableEndTime: string;
  minOrderAmount?: number;
  notice?: string;
}

interface UpdateBody {
  targetRadius?: number;
  targetGender?: MockCampaign['targetGender'];
  targetAgeGroups?: string[];
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
}

const toCouponFields = (body: CouponBody) => ({
  discountTargetType: body.discountTargetType,
  discountType: body.discountType,
  discountValue: body.discountValue,
  targetMenuId:
    body.discountTargetType === 'MENU' ? (body.targetMenuId ?? null) : null,
  issueQuantity: body.issueQuantity,
  usableStartTime: body.usableStartTime,
  usableEndTime: body.usableEndTime,
  minOrderAmount: body.minOrderAmount ?? null,
  notice: body.notice ?? null,
});

// 3 · 4단계 저장 응답. 저장한 뒤의 현재 값이다
const toUpdateResponse = (campaign: MockCampaign) => ({
  campaignId: campaign.campaignId,
  targetRadius: campaign.targetRadius,
  targetGender: campaign.targetGender,
  targetAgeGroups: campaign.targetAgeGroups,
  dailyBudget: campaign.dailyBudget,
  startDate: campaign.startDate,
  endDate: campaign.endDate,
});

// 하루 예산 · 집행 기간 검사. 화면이 먼저 막지만 서버처럼 한 번 더 본다 (422 CAMPAIGN-007 · 008 · 009)
const checkBudget = ({ dailyBudget, endDate, startDate }: UpdateBody) => {
  if (dailyBudget !== undefined && dailyBudget < MIN_DAILY_BUDGET) {
    return fail(
      422,
      'CAMPAIGN-007',
      `하루 예산은 ${MIN_DAILY_BUDGET.toLocaleString()}포인트 이상이어야 합니다.`,
    );
  }
  if (startDate && startDate < addDays(getKstToday(), 1)) {
    return fail(422, 'CAMPAIGN-009', '시작일은 내일부터 고를 수 있습니다.');
  }
  if (startDate && endDate && endDate < startDate) {
    return fail(422, 'CAMPAIGN-008', '종료일은 시작일과 같거나 늦어야 합니다.');
  }
  return null;
};

type CampaignAction = 'activate' | 'cancel' | 'pause' | 'resume' | 'end';

// 상태 변경 규칙. from 상태에서만 할 수 있고, 이미 to 상태면 다시 성공으로 답한다 (서버와 같다)
const ACTIONS: Record<
  CampaignAction,
  { from: MockCampaignStatus; to: MockCampaignStatus }
> = {
  // 자동 검수를 통과하면 대기 중. 시연에서는 늘 통과한다
  activate: { from: 'DRAFT', to: 'SCHEDULED' },
  // 대기 중 취소. 지우지 않고 작성 중으로 되돌린다
  cancel: { from: 'SCHEDULED', to: 'DRAFT' },
  pause: { from: 'ACTIVE', to: 'PAUSED' },
  resume: { from: 'PAUSED', to: 'ACTIVE' },
  end: { from: 'PAUSED', to: 'ENDED' },
};

// 상태 변경 전 추가 검사. 통과하면 null
const checkAction = (action: CampaignAction, campaign: MockCampaign) => {
  const db = getDb();

  if (action === 'activate') {
    if (
      !db.posters.some(({ campaignId }) => campaignId === campaign.campaignId)
    ) {
      return fail(409, 'POSTER-020', '포스터를 먼저 만들어 주세요.');
    }
    if (!campaign.dailyBudget || !campaign.startDate || !campaign.endDate) {
      return fail(
        422,
        'CAMPAIGN-011',
        '하루 예산과 집행 기간을 먼저 정해 주세요.',
      );
    }
  }

  // 점주가 직접 중단한 캠페인만 다시 시작할 수 있고, 집행 기간이 끝났으면 다시 시작할 수 없다
  if (action === 'resume') {
    if (campaign.pausedReason !== 'OWNER') {
      return fail(
        409,
        'CAMPAIGN-006',
        '직접 중단한 캠페인만 다시 시작할 수 있습니다.',
      );
    }
    if (campaign.endDate && campaign.endDate < getKstToday()) {
      return fail(
        422,
        'CAMPAIGN-012',
        '집행 기간이 끝나 다시 시작할 수 없습니다.',
      );
    }
  }

  return null;
};

const findCampaign = (campaignId: string) =>
  getDb().campaigns.find(
    (campaign) => String(campaign.campaignId) === campaignId,
  );

// 없는 캠페인. 서버는 다른 점주의 캠페인도 같은 코드로 거절한다
const campaignNotFound = () =>
  fail(404, 'CAMPAIGN-005', '캠페인을 찾을 수 없습니다.');

// 성과 조회 기간. 쿼리 문자열의 from, to (YYYY-MM-DD)
const readPeriod = (request: Request) => {
  const { searchParams } = new URL(request.url);

  return {
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  };
};

// 목록 항목에는 상세의 일부만 담긴다
const toListItem = ({
  campaignId,
  createdAt,
  dailyBudget,
  discountTargetType,
  discountType,
  discountValue,
  endDate,
  startDate,
  status,
}: MockCampaign) => ({
  campaignId,
  status,
  discountTargetType,
  discountType,
  discountValue,
  dailyBudget,
  startDate,
  endDate,
  createdAt,
});

export const campaignHandlers = [
  // 목록. 서버처럼 최근 등록 순으로 준다. 시연 데이터는 몇 개뿐이라 한 페이지에 모두 담는다
  http.get('*/v1/owner/campaigns', () => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    syncCampaignStatuses();

    const items = [...db.campaigns]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toListItem);

    return ok({ items, nextPageToken: null });
  }),

  http.get<CampaignParams>('*/v1/owner/campaigns/:campaignId', ({ params }) => {
    if (!getDb().owner.isLoggedIn) return unauthenticated();

    syncCampaignStatuses();

    const campaign = findCampaign(params.campaignId);

    return campaign ? ok(campaign) : campaignNotFound();
  }),

  // 찜 수 (기간 합계)
  http.get<CampaignParams>(
    '*/v1/owner/campaigns/:campaignId/analytics/funnel',
    ({ params, request }) => {
      if (!getDb().owner.isLoggedIn) return unauthenticated();

      const campaign = findCampaign(params.campaignId);

      if (!campaign) return campaignNotFound();

      const { from, to } = readPeriod(request);

      return ok({ wishCount: sumStats(campaign, from, to).wishCount });
    },
  ),

  // 쿠폰 발급 · 사용 수 (기간 합계)
  http.get<CampaignParams>(
    '*/v1/owner/campaigns/:campaignId/coupons/summary',
    ({ params, request }) => {
      if (!getDb().owner.isLoggedIn) return unauthenticated();

      const campaign = findCampaign(params.campaignId);

      if (!campaign) return campaignNotFound();

      const { from, to } = readPeriod(request);
      const { issuedCount, usedCount } = sumStats(campaign, from, to);

      return ok({ issuedCount, usedCount });
    },
  ),

  // 등록 1단계 쿠폰 조건 저장. 작성 중 캠페인이 없으면 새로 만들고(201), 있으면 쿠폰 조건만 덮어쓴다(200).
  // 끝나지 않은 캠페인(대기 중, 진행 중, 일시중지)이 있으면 409 CAMPAIGN-010
  http.post<never, CouponBody>('*/v1/owner/campaigns', async ({ request }) => {
    const db = getDb();

    if (!db.owner.isLoggedIn) return unauthenticated();

    syncCampaignStatuses();

    if (db.campaigns.some(({ status }) => RUNNING_STATUSES.includes(status))) {
      return fail(
        409,
        'CAMPAIGN-010',
        '끝나지 않은 캠페인이 있어 새 캠페인을 만들 수 없습니다.',
      );
    }

    const body = await request.json();
    const draft = db.campaigns.find(({ status }) => status === 'DRAFT');

    if (draft) {
      updateDb(() => Object.assign(draft, toCouponFields(body)));

      return ok({ campaignId: draft.campaignId, status: 'DRAFT' });
    }

    const campaignId = db.nextId;

    updateDb((current) => {
      current.nextId += 1;
      current.campaigns.push({
        campaignId,
        status: 'DRAFT',
        pausedReason: null,
        ...toCouponFields(body),
        targetRadius: 1000,
        targetGender: 'ALL',
        targetAgeGroups: ALL_AGE_GROUPS,
        dailyBudget: null,
        startDate: null,
        endDate: null,
        createdAt: toKstDateTime(getKstToday(), getKstTime()),
      });
    });

    return ok({ campaignId, status: 'DRAFT' });
  }),

  // 등록 3 · 4단계 저장(작성 중만)과 진행 중 캠페인의 하루 예산 변경.
  // 진행 중 하루 예산은 서버가 다음 영업일부터 적용할 값으로 따로 저장하고, 응답 · 상세는 지금 값만 준다
  http.patch<CampaignParams, UpdateBody>(
    '*/v1/owner/campaigns/:campaignId',
    async ({ params, request }) => {
      if (!getDb().owner.isLoggedIn) return unauthenticated();

      syncCampaignStatuses();

      const campaign = findCampaign(params.campaignId);

      if (!campaign) return campaignNotFound();

      const body = await request.json();
      const isDailyBudgetOnly =
        Object.keys(body).length === 1 && body.dailyBudget !== undefined;

      if (campaign.status === 'ACTIVE' && isDailyBudgetOnly) {
        return checkBudget(body) ?? ok(toUpdateResponse(campaign));
      }

      if (campaign.status !== 'DRAFT') {
        return fail(
          409,
          'CAMPAIGN-006',
          '작성 중인 캠페인만 바꿀 수 있습니다.',
        );
      }

      const rejected = checkBudget(body);

      if (rejected) return rejected;

      updateDb(() => Object.assign(campaign, body));

      return ok(toUpdateResponse(campaign));
    },
  ),

  // 상태 변경 (POST /v1/owner/campaigns/{id}:activate 등). 주소의 `:activate`는 경로 변수가 아니라 글자라 `\\:`로 쓴다
  ...(Object.keys(ACTIONS) as CampaignAction[]).map((action) =>
    http.post<CampaignParams>(
      `*/v1/owner/campaigns/:campaignId\\:${action}`,
      ({ params }) => {
        if (!getDb().owner.isLoggedIn) return unauthenticated();

        syncCampaignStatuses();

        const campaign = findCampaign(params.campaignId);

        if (!campaign) return campaignNotFound();

        const { from, to } = ACTIONS[action];
        const response = {
          campaignId: campaign.campaignId,
          status: to,
          ...(action === 'activate' && { reasons: [] }),
        };

        if (campaign.status === to) return ok(response);
        if (campaign.status !== from) {
          return fail(409, 'CAMPAIGN-006', '지금 상태에서는 할 수 없습니다.');
        }

        const rejected = checkAction(action, campaign);

        if (rejected) return rejected;

        updateDb(() => {
          campaign.status = to;
          campaign.pausedReason = action === 'pause' ? 'OWNER' : null;

          if (action === 'end') campaign.endedOn = getKstToday();
        });

        return ok(response);
      },
    ),
  ),
];
