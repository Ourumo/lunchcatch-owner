import { Link } from 'react-router';

import type { Campaign } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';
import { useTodayPerformance } from '@owner/hooks/useCampaignPerformance';
import { getCampaignTitle } from '@owner/ui/campaignFormat';
import { CurrentCampaignCard } from '@owner/ui/CurrentCampaignCard/CurrentCampaignCard';

import { getCurrentCampaign } from './homeCampaigns';

const NEW_CAMPAIGN_PATH = '/campaigns/new';

const NoCurrentNotice = () => (
  <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border-subtle bg-bg-surface px-4 py-6 text-center">
    <p className="text-body-mobile font-bold break-keep text-text-primary">
      운영 중인 캠페인이 없어요
    </p>
    <p className="text-caption-mobile break-keep text-text-secondary">
      새 캠페인을 만들어 주변 직장인에게 가게를 알려 보세요.
    </p>
    <Link
      className="mt-3 flex h-10 items-center rounded-full bg-action-primary px-4 text-body-sm-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      to={NEW_CAMPAIGN_PATH}
    >
      캠페인 만들기
    </Link>
  </div>
);

// 작성 중이면 카드 아래에서 바로 이어서 작성하게 한다. 등록 화면은 저장된 입력값을 불러와 첫 단계부터 보여준다
const ContinueDraftLink = ({ campaignId }: { campaignId: string }) => (
  <div className="border-t border-border-subtle p-3">
    <Link
      className="flex h-11 w-full items-center justify-center rounded-md border border-action-primary bg-bg-surface text-body-sm-web font-medium text-action-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      to={`/campaigns/${campaignId}/edit`}
    >
      이어서 작성
    </Link>
  </div>
);

interface CurrentCampaignProps {
  campaign: Campaign;
  title: string;
}

// 현재 캠페인 카드. 오늘 실적은 캠페인과 따로 불러와, 못 받아도 카드는 그대로 보여준다
const CurrentCampaign = ({ campaign, title }: CurrentCampaignProps) => {
  const todayPerformance = useTodayPerformance(campaign);

  return (
    <CurrentCampaignCard
      campaign={campaign}
      footer={
        campaign.status === 'DRAFT' && (
          <ContinueDraftLink campaignId={campaign.id} />
        )
      }
      title={title}
      todayPerformance={todayPerformance}
    />
  );
};

export interface HomeCampaignSectionProps {
  campaigns: Campaign[];
  menus: StoreMenu[];
}

// 현재 캠페인. 카드를 누르면 상세로 가고, 전체 목록은 가운데 캠페인 탭으로 가므로 "전체 보기"는 두지 않는다
export const HomeCampaignSection = ({
  campaigns,
  menus,
}: HomeCampaignSectionProps) => {
  const current = getCurrentCampaign(campaigns);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-body-mobile font-bold text-text-primary">
        현재 캠페인
      </h2>
      {current ? (
        <CurrentCampaign
          campaign={current}
          title={getCampaignTitle(current.coupon, menus)}
        />
      ) : (
        <NoCurrentNotice />
      )}
    </section>
  );
};
