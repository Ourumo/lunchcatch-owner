import { StatusBadge, type StatusBadgeVariant } from '@repo/ui';

import type { CampaignStatus, PausedReason } from '@owner/api/campaign';

export interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  // PAUSED이면 중단 사유에 따라 문구와 색이 달라진다
  pausedReason?: PausedReason | null;
}

interface BadgeStyle {
  label: string;
  variant: StatusBadgeVariant;
}

const statusBadges: Record<CampaignStatus, BadgeStyle> = {
  DRAFT: { label: '작성 중', variant: 'neutral' },
  SCHEDULED: { label: '시작 대기', variant: 'info' },
  ACTIVE: { label: '진행 중', variant: 'success' },
  PAUSED: { label: '중단', variant: 'warning' },
  ENDED: { label: '종료', variant: 'neutral' },
};

// 점주가 직접 다시 시작할 수 있는 중단만 경고색으로, 점주가 재개할 수 없는 중단은 위험색으로 보여준다
const pausedBadges: Record<PausedReason, BadgeStyle> = {
  OWNER: { label: '일시 중단', variant: 'warning' },
  NO_POINTS: { label: '잔액 부족', variant: 'danger' },
  ADMIN: { label: '관리자 중단', variant: 'danger' },
};

// 캠페인 상태 배지 (docs/requirements-common.md "캠페인 상태 정의")
export const CampaignStatusBadge = ({
  pausedReason,
  status,
}: CampaignStatusBadgeProps) => {
  const { label, variant } =
    status === 'PAUSED' && pausedReason
      ? pausedBadges[pausedReason]
      : statusBadges[status];

  return <StatusBadge variant={variant}>{label}</StatusBadge>;
};
