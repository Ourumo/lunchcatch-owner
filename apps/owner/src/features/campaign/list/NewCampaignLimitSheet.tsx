import { Link } from 'react-router';
import { BottomSheet, Button } from '@repo/ui';

import type { Campaign } from '@owner/api/campaign';
import { formatShortDate } from '@owner/ui/campaignFormat';

export interface NewCampaignLimitSheetProps {
  // 운영 중인 캠페인 (대기 중, 진행 중, 일시중지)
  campaign: Campaign;
  title: string;
  onClose: () => void;
}

const getCampaignSummary = ({ budget, status }: Campaign, title: string) =>
  status === 'SCHEDULED'
    ? `${formatShortDate(budget.startDate)}에 시작할 "${title}" 캠페인이 있어요.`
    : `"${title}" 캠페인이 ${formatShortDate(budget.endDate)}까지 운영돼요.`;

// 끝나지 않은 캠페인이 있을 때 "새 캠페인"을 누르면 띄운다. 가게당 하나만 운영할 수 있어 새로 만들 수 없음을 알린다
export const NewCampaignLimitSheet = ({
  campaign,
  onClose,
  title,
}: NewCampaignLimitSheetProps) => (
  <BottomSheet isOpen onClose={onClose} title="운영 중인 캠페인이 있어요">
    <p className="text-center text-body-sm-mobile break-keep text-text-secondary">
      {getCampaignSummary(campaign, title)} 캠페인은 한 번에 하나만 운영할 수
      있어서, 지금 캠페인이 끝난 뒤에 새로 만들 수 있어요.
    </p>

    <div className="mt-5 flex gap-2">
      <Button className="h-12 flex-1" onClick={onClose} variant="neutral">
        닫기
      </Button>
      <Link
        className="flex h-12 flex-1 items-center justify-center rounded-md bg-action-primary text-body-sm-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        to={`/campaigns/${campaign.id}`}
      >
        캠페인 보기
      </Link>
    </div>
  </BottomSheet>
);
