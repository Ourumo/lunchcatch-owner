import { BottomSheet } from '@repo/ui';
import { Check } from 'lucide-react';

import type { Campaign } from '@owner/api/campaign';
import { formatPeriod } from '@owner/ui/campaignFormat';
import { CampaignStatusBadge } from '@owner/ui/CampaignStatusBadge/CampaignStatusBadge';

export interface CampaignSelectSheetProps {
  campaigns: Campaign[];
  selectedId: string;
  getTitle: (campaign: Campaign) => string;
  onSelect: (campaignId: string) => void;
  onClose: () => void;
}

// 분석할 캠페인을 고르는 시트. 열려 있을 때만 렌더링한다
export const CampaignSelectSheet = ({
  campaigns,
  getTitle,
  onClose,
  onSelect,
  selectedId,
}: CampaignSelectSheetProps) => (
  <BottomSheet isOpen onClose={onClose} title="캠페인 선택">
    {/* 캠페인이 쌓여도 제목이 화면 밖으로 밀리지 않게 목록만 스크롤한다. 항목의 포커스 테두리가 잘리지 않게 안쪽 여백을 두고 바깥 여백으로 되돌린다 */}
    <ul className="-m-1 flex max-h-[60dvh] flex-col gap-2 overflow-y-auto p-1">
      {campaigns.map((campaign) => {
        const isSelected = campaign.id === selectedId;

        return (
          <li key={campaign.id}>
            <button
              aria-current={isSelected ? 'true' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary ${
                isSelected
                  ? 'border-action-primary bg-surface-brand'
                  : 'border-border-subtle bg-bg-surface hover:border-brand-300'
              }`}
              onClick={() => onSelect(campaign.id)}
              type="button"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <CampaignStatusBadge
                    pausedReason={campaign.pausedReason}
                    status={campaign.status}
                  />
                  <span className="text-caption-mobile text-text-secondary">
                    {formatPeriod(
                      campaign.budget.startDate,
                      campaign.budget.endDate,
                    )}
                  </span>
                </span>
                <span className="mt-1.5 block truncate text-body-mobile font-bold text-text-primary">
                  {getTitle(campaign)}
                </span>
              </span>
              {isSelected && (
                <Check
                  aria-hidden="true"
                  className="size-5 shrink-0 text-text-brand"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </BottomSheet>
);
