import { ApiError, request } from './client';
import type { ApiResult } from './types';

// 포인트 환불 요청 (docs/requirements-owner.md "포인트 환불 요청").
// 잔액 전액만 환불할 수 있어 금액은 보내지 않는다. 관리자가 승인해야 처리되고, 실제 환불은 mock이다

// 지금 환불을 요청할 수 없는 이유. 요청을 거절한 이유도 같은 이름으로 돌려준다
export type RefundBlockedReason =
  // 환불할 수 있는 포인트가 없음
  | 'NO_BALANCE'
  // 집행 중(진행 중, 일시중지)인 캠페인이 있음
  | 'ACTIVE_CAMPAIGN'
  // 처리를 기다리는 요청이 있음
  | 'PENDING_REQUEST';

// 요청 실패 사유. 미리보기를 본 뒤 상태가 바뀌었으면 막힌 이유와 같은 값이고,
// 서버가 잠시 처리하지 못했거나 응답을 받지 못했으면 UNAVAILABLE이다
export type RefundRequestFailureCode = RefundBlockedReason | 'UNAVAILABLE';

export type RefundRequestStatus =
  'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface RefundPreview {
  // 환불 대상 포인트. 그날 예약된 포인트는 빠진다
  refundablePoint: number;
  // 서버가 계산한 수수료(원)
  fee: number;
  expectedRefundAmount: number;
  canRequest: boolean;
  // 요청할 수 있으면 null
  blockedReason: RefundBlockedReason | null;
}

export interface RefundRequestItem {
  id: string;
  amount: number;
  fee: number;
  status: RefundRequestStatus;
  // 점주가 적은 사유. 없으면 null
  reason: string | null;
  // 거절 사유. 거절이 아니면 null
  rejectReason: string | null;
  // ISO 8601
  requestedAt: string;
  // 처리 전이면 null
  processedAt: string | null;
}

export interface RefundRequestPage {
  items: RefundRequestItem[];
  // 다음 구간을 받을 때 넘기는 값. 마지막 구간이면 null
  nextCursor: string | null;
}

export const REFUND_REASON_MAX_LENGTH = 255;

export const REFUND_REQUEST_PAGE_SIZE = 20;

const failureCodesByServerCode: Record<string, RefundBlockedReason> = {
  'BILLING-010': 'ACTIVE_CAMPAIGN',
  'BILLING-011': 'PENDING_REQUEST',
  'BILLING-012': 'NO_BALANCE',
};

interface RefundPreviewResponse {
  refundablePoint: number;
  fee: number;
  expectedRefundAmount: number;
  canRequest: boolean;
  blockedReason: RefundBlockedReason | null;
}

interface RefundRequestCreateResponse {
  refundRequestId: number;
  amount: number;
  fee: number;
  status: RefundRequestStatus;
}

interface RefundRequestListResponse {
  items: {
    refundRequestId: number;
    amount: number;
    fee: number;
    status: RefundRequestStatus;
    reason: string | null;
    rejectReason: string | null;
    requestedAt: string;
    processedAt: string | null;
  }[];
  nextPageToken: string | null;
}

// 환불 대상 포인트, 수수료, 예상 환불액과 지금 요청할 수 있는지. 아무것도 기록하지 않는다
export const getRefundPreview = async (): Promise<ApiResult<RefundPreview>> => {
  try {
    const data = await request<RefundPreviewResponse>(
      '/v1/owner/refund-requests/preview',
    );

    return {
      ok: true,
      data: {
        refundablePoint: data.refundablePoint,
        fee: data.fee,
        expectedRefundAmount: data.expectedRefundAmount,
        canRequest: data.canRequest,
        blockedReason: data.canRequest ? null : data.blockedReason,
      },
    };
  } catch {
    return { ok: false };
  }
};

// 요청 시점 잔액 전액의 환불을 요청한다. 사유는 선택이고, 비어 있으면 보내지 않는다.
// 사유 길이(255자)는 입력에서 막으므로 그 밖의 거절과 응답을 받지 못한 경우는 다시 시도하도록 안내한다. 성공하면 만든 요청의 ID를 돌려준다
export const requestRefund = async (
  reason: string,
): Promise<ApiResult<string>> => {
  const trimmedReason = reason.trim();

  try {
    const data = await request<RefundRequestCreateResponse>(
      '/v1/owner/refund-requests',
      {
        method: 'POST',
        body: trimmedReason ? { reason: trimmedReason } : {},
      },
    );

    return { ok: true, data: String(data.refundRequestId) };
  } catch (error) {
    const blockedReason =
      error instanceof ApiError && error.code !== null
        ? failureCodesByServerCode[error.code]
        : undefined;

    return {
      ok: false,
      code: (blockedReason ?? 'UNAVAILABLE') satisfies RefundRequestFailureCode,
    };
  }
};

// 내 환불 요청 한 구간. 요청 시각 최신순이고, 다음 구간은 받은 커서로 이어서 부른다
export const getRefundRequestPage = async ({
  cursor,
}: { cursor?: string } = {}): Promise<ApiResult<RefundRequestPage>> => {
  const params = new URLSearchParams({
    pageSize: String(REFUND_REQUEST_PAGE_SIZE),
  });

  if (cursor) {
    params.set('pageToken', cursor);
  }

  try {
    const data = await request<RefundRequestListResponse>(
      `/v1/owner/refund-requests?${params}`,
    );

    return {
      ok: true,
      data: {
        items: data.items.map((item) => ({
          id: String(item.refundRequestId),
          amount: item.amount,
          fee: item.fee,
          status: item.status,
          reason: item.reason || null,
          rejectReason: item.rejectReason || null,
          requestedAt: item.requestedAt,
          processedAt: item.processedAt,
        })),
        nextCursor: data.nextPageToken || null,
      },
    };
  } catch {
    return { ok: false };
  }
};
