import { Button } from '@repo/ui';

import { getCampaignTitle } from '@owner/components/campaignFormat';
import { TopBar } from '@owner/components/TopBar/TopBar';
import { useGoBack } from '@owner/hooks/useGoBack';

import { EndedCampaignCard } from './EndedCampaignCard';
import { getEndedCampaigns } from './endedCampaigns';
import { useCampaignList } from './useCampaignList';

const CAMPAIGN_LIST_PATH = '/campaigns';

const EndedListSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-2 px-page py-5">
    <span className="sr-only">지난 캠페인을 불러오는 중</span>
    {[0, 1, 2].map((index) => (
      <div
        aria-hidden="true"
        className="h-40 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
        key={index}
      />
    ))}
  </div>
);

const EndedListMessage = ({
  description,
  onRetry,
  title,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
    <p className="text-body-mobile font-bold text-text-primary">{title}</p>
    <p className="text-body-sm-mobile break-keep text-text-secondary">
      {description}
    </p>
    {onRetry && (
      <Button className="mt-2" onClick={onRetry} variant="secondary">
        다시 시도
      </Button>
    )}
  </div>
);

// 지난 캠페인 전체 목록. 캠페인 탭은 최근 몇 건만 보여주고 나머지는 여기서 본다.
// 지금은 전체를 한 번에 불러온다. 무한 스크롤은 커서 방식 API가 정해지면 붙인다
export const EndedCampaignList = () => {
  const goBack = useGoBack(CAMPAIGN_LIST_PATH);
  const { retry, state } = useCampaignList();

  const renderContent = () => {
    if (state.status === 'loading') {
      return <EndedListSkeleton />;
    }

    if (state.status === 'error') {
      return (
        <EndedListMessage
          description="잠시 후 다시 시도해 주세요"
          onRetry={retry}
          title="지난 캠페인을 불러오지 못했어요"
        />
      );
    }

    const ended = getEndedCampaigns(state.campaigns);

    if (ended.length === 0) {
      return (
        <EndedListMessage
          description="집행 기간이 끝난 캠페인이 여기에 모여요"
          title="아직 끝난 캠페인이 없어요"
        />
      );
    }

    return (
      <ul className="flex flex-col gap-2 px-page py-5">
        {ended.map((campaign) => (
          <li key={campaign.id}>
            <EndedCampaignCard
              campaign={campaign}
              title={getCampaignTitle(campaign.coupon, state.menus)}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={goBack} title="지난 캠페인" />
      </div>
      <main className="flex flex-1 flex-col">{renderContent()}</main>
    </>
  );
};
