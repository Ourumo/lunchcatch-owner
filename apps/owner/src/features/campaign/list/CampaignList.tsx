import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { CalendarClock, Megaphone, Plus } from 'lucide-react';

import type { Campaign } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';
import { getCampaignTitle } from '@owner/components/campaignFormat';
import { CurrentCampaignCard } from '@owner/components/CurrentCampaignCard/CurrentCampaignCard';
import { TopBar } from '@owner/components/TopBar/TopBar';

import { EndedCampaignCard } from './EndedCampaignCard';
import { UpcomingCampaignCard } from './UpcomingCampaignCard';
import { useCampaignList } from './useCampaignList';

const NEW_CAMPAIGN_PATH = '/campaigns/new';

const isCurrent = ({ status }: Campaign) =>
  status === 'ACTIVE' || status === 'PAUSED';

// 가게당 집행 중인 캠페인은 1건이므로, 지금 집행 중인 것 / 준비 중인 것 / 끝난 것으로 나눠 보여준다
const groupCampaigns = (campaigns: Campaign[]) => {
  const scheduled = campaigns
    .filter(({ status }) => status === 'SCHEDULED')
    .sort((a, b) => a.budget.startDate.localeCompare(b.budget.startDate));
  // 목록이 등록 시각 최신순으로 오므로 작성 중인 캠페인은 그 순서를 따른다
  const drafts = campaigns.filter(({ status }) => status === 'DRAFT');
  const ended = campaigns
    .filter(({ status }) => status === 'ENDED')
    .sort((a, b) => b.budget.endDate.localeCompare(a.budget.endDate));

  return {
    current: campaigns.find(isCurrent),
    upcoming: [...scheduled, ...drafts],
    ended,
  };
};

const NewCampaignLink = () => (
  <Link
    className="-mr-2 flex h-11 items-center gap-1 rounded-full px-2 text-body-sm-mobile font-bold text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
    to={NEW_CAMPAIGN_PATH}
  >
    <Plus aria-hidden="true" className="size-4" />새 캠페인
  </Link>
);

interface CampaignSectionProps {
  title: string;
  count?: number;
  children: ReactNode;
}

const CampaignSection = ({ children, count, title }: CampaignSectionProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="flex items-center gap-1.5 text-body-mobile font-bold text-text-primary">
      {title}
      {count !== undefined && (
        <span className="text-body-sm-mobile font-medium text-text-secondary">
          {count}
        </span>
      )}
    </h2>
    {children}
  </section>
);

const NoCurrentCampaign = ({ upcoming }: { upcoming: Campaign[] }) => {
  const hasScheduled = upcoming.some(({ status }) => status === 'SCHEDULED');

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border-subtle bg-bg-surface px-4 py-6 text-center">
      <CalendarClock
        aria-hidden="true"
        className="mb-1 size-6 text-text-tertiary"
      />
      <p className="text-body-sm-mobile font-bold text-text-primary">
        지금 진행 중인 캠페인이 없어요
      </p>
      <p className="text-caption-mobile break-keep text-text-secondary">
        {hasScheduled
          ? '시작 대기 중인 캠페인은 집행 시작일 00:00부터 노출돼요'
          : '새 캠페인을 만들어 주변 직장인에게 가게를 알려 보세요'}
      </p>
      {!hasScheduled && (
        <Link
          className="mt-3 flex h-10 items-center rounded-full bg-surface-brand px-4 text-body-sm-mobile font-bold text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
          to={NEW_CAMPAIGN_PATH}
        >
          캠페인 만들기
        </Link>
      )}
    </div>
  );
};

const EmptyCampaigns = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 px-page pb-16 text-center">
    <span className="mb-2 flex size-20 items-center justify-center rounded-full bg-surface-brand">
      <Megaphone aria-hidden="true" className="size-9 text-action-primary" />
    </span>
    <p className="text-h3-mobile font-bold text-text-primary">
      아직 등록된 캠페인이 없어요
    </p>
    <p className="text-body-sm-mobile text-text-secondary">
      첫 캠페인을 만들어 주변 직장인에게
      <br />
      우리 가게를 알려 보세요
    </p>
    <Link
      className="mt-4 flex h-12 items-center rounded-full bg-action-primary px-6 text-body-sm-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      to={NEW_CAMPAIGN_PATH}
    >
      첫 캠페인 만들기
    </Link>
  </div>
);

const CampaignListSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-8 px-page py-5">
    <span className="sr-only">캠페인 목록을 불러오는 중</span>
    {[176, 96, 96].map((height, index) => (
      <div
        aria-hidden="true"
        className="animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
        key={index}
        style={{ height }}
      />
    ))}
  </div>
);

const CampaignListError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
    <p className="text-body-mobile font-bold text-text-primary">
      캠페인 목록을 불러오지 못했어요
    </p>
    <p className="text-body-sm-mobile text-text-secondary">
      잠시 후 다시 시도해 주세요
    </p>
    <Button className="mt-2" onClick={onRetry} variant="secondary">
      다시 시도
    </Button>
  </div>
);

interface CampaignSectionsProps {
  campaigns: Campaign[];
  menus: StoreMenu[];
}

const CampaignSections = ({ campaigns, menus }: CampaignSectionsProps) => {
  const { current, ended, upcoming } = groupCampaigns(campaigns);
  const getTitle = (campaign: Campaign) =>
    getCampaignTitle(campaign.coupon, menus);

  return (
    <div className="flex flex-col gap-8 px-page py-5">
      <CampaignSection title="진행 중인 캠페인">
        {current ? (
          <CurrentCampaignCard campaign={current} title={getTitle(current)} />
        ) : (
          <NoCurrentCampaign upcoming={upcoming} />
        )}
      </CampaignSection>
      {upcoming.length > 0 && (
        <CampaignSection count={upcoming.length} title="준비 중인 캠페인">
          <ul className="flex flex-col gap-2">
            {upcoming.map((campaign) => (
              <li key={campaign.id}>
                <UpcomingCampaignCard
                  campaign={campaign}
                  title={getTitle(campaign)}
                />
              </li>
            ))}
          </ul>
        </CampaignSection>
      )}
      {ended.length > 0 && (
        <CampaignSection count={ended.length} title="지난 캠페인">
          <ul className="flex flex-col gap-2">
            {ended.map((campaign) => (
              <li key={campaign.id}>
                <EndedCampaignCard
                  campaign={campaign}
                  title={getTitle(campaign)}
                />
              </li>
            ))}
          </ul>
        </CampaignSection>
      )}
    </div>
  );
};

// 캠페인 탭. 점주 본인 가게의 캠페인만 보여준다
export const CampaignList = () => {
  const { retry, state } = useCampaignList();

  const renderContent = () => {
    if (state.status === 'loading') {
      return <CampaignListSkeleton />;
    }

    if (state.status === 'error') {
      return <CampaignListError onRetry={retry} />;
    }

    if (state.campaigns.length === 0) {
      return <EmptyCampaigns />;
    }

    return <CampaignSections campaigns={state.campaigns} menus={state.menus} />;
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar title="캠페인" trailing={<NewCampaignLink />} />
      </div>
      <main className="flex flex-1 flex-col">{renderContent()}</main>
    </>
  );
};
