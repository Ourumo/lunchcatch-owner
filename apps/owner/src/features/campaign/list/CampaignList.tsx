import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { CalendarClock, Megaphone, Plus } from 'lucide-react';

import { type Campaign, isUpcomingCampaign } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';
import { getCampaignTitle } from '@owner/components/campaignFormat';
import { CurrentCampaignCard } from '@owner/components/CurrentCampaignCard/CurrentCampaignCard';
import { TopBar } from '@owner/components/TopBar/TopBar';

import { EndedCampaignCard } from './EndedCampaignCard';
import { getEndedCampaigns } from './endedCampaigns';
import { NewCampaignLimitSheet } from './NewCampaignLimitSheet';
import { UpcomingCampaignCard } from './UpcomingCampaignCard';
import { useCampaignList } from './useCampaignList';

const NEW_CAMPAIGN_PATH = '/campaigns/new';

const isCurrent = ({ status }: Campaign) =>
  status === 'ACTIVE' || status === 'PAUSED';

// 진행 중과 준비 중(작성 중 + 시작 대기)은 가게당 1건씩이라 "지금 1개 + 다음 1개 + 끝난 것"으로 나눠 보여준다
const groupCampaigns = (campaigns: Campaign[]) => {
  return {
    current: campaigns.find(isCurrent),
    next: campaigns.find(isUpcomingCampaign),
    ended: getEndedCampaigns(campaigns),
  };
};

const newCampaignClassName =
  '-mr-2 flex h-11 items-center gap-1 rounded-full px-2 text-body-sm-mobile font-bold text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary';

// 다음 캠페인 자리가 차 있으면 이동하지 않고 안내 시트를 연다
const NewCampaignButton = ({ onLimited }: { onLimited?: () => void }) => {
  const content = (
    <>
      <Plus aria-hidden="true" className="size-4" />새 캠페인
    </>
  );

  if (onLimited) {
    return (
      <button
        className={newCampaignClassName}
        onClick={onLimited}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link className={newCampaignClassName} to={NEW_CAMPAIGN_PATH}>
      {content}
    </Link>
  );
};

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

const createLinkClassName =
  'mt-3 flex h-10 items-center rounded-full bg-surface-brand px-4 text-body-sm-mobile font-bold text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

interface EmptySlotProps {
  title: string;
  description: string;
  // 다음 캠페인 자리가 차 있으면 만들 수 없으므로 링크를 두지 않는다
  createLabel?: string;
}

const EmptySlot = ({ createLabel, description, title }: EmptySlotProps) => (
  <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border-subtle bg-bg-surface px-4 py-6 text-center">
    <CalendarClock
      aria-hidden="true"
      className="mb-1 size-6 text-text-tertiary"
    />
    <p className="text-body-sm-mobile font-bold text-text-primary">{title}</p>
    <p className="text-caption-mobile break-keep text-text-secondary">
      {description}
    </p>
    {createLabel && (
      <Link className={createLinkClassName} to={NEW_CAMPAIGN_PATH}>
        {createLabel}
      </Link>
    )}
  </div>
);

const getNoCurrentDescription = (next?: Campaign) => {
  if (next?.status === 'SCHEDULED') {
    return '시작 대기 중인 캠페인은 집행 시작일 00:00부터 노출돼요';
  }

  if (next?.status === 'DRAFT') {
    return '작성 중인 캠페인을 마치고 활성화를 요청하면 시작 대기 상태가 돼요';
  }

  return '새 캠페인을 만들어 주변 직장인에게 가게를 알려 보세요';
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
  onChanged: () => void;
}

const CampaignSections = ({
  campaigns,
  menus,
  onChanged,
}: CampaignSectionsProps) => {
  const { current, ended, next } = groupCampaigns(campaigns);
  const getTitle = (campaign: Campaign) =>
    getCampaignTitle(campaign.coupon, menus);

  return (
    <div className="flex flex-col gap-8 px-page py-5">
      <CampaignSection title="진행 중인 캠페인">
        {current ? (
          <CurrentCampaignCard campaign={current} title={getTitle(current)} />
        ) : (
          <EmptySlot
            createLabel={next ? undefined : '캠페인 만들기'}
            description={getNoCurrentDescription(next)}
            title="지금 진행 중인 캠페인이 없어요"
          />
        )}
      </CampaignSection>
      {/* 진행 중도 다음 캠페인도 없으면 위 칸에서 만들기를 권하므로 이 섹션은 숨긴다 */}
      {(next || current) && (
        <CampaignSection title="다음 캠페인">
          {next ? (
            <UpcomingCampaignCard
              campaign={next}
              onChanged={onChanged}
              title={getTitle(next)}
            />
          ) : (
            <EmptySlot
              createLabel="다음 캠페인 만들기"
              description="진행 중인 캠페인이 끝나면 이어서 노출할 캠페인을 미리 준비해 두세요"
              title="준비 중인 캠페인이 없어요"
            />
          )}
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
  const { reload, retry, state } = useCampaignList();
  const [isLimitSheetOpen, setIsLimitSheetOpen] = useState(false);
  // 목록을 불러오기 전에는 자리를 알 수 없어 바로 이동한다. 이때도 작성 화면이 제한을 다시 확인한다
  const next =
    state.status === 'success'
      ? state.campaigns.find(isUpcomingCampaign)
      : undefined;

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

    return (
      <CampaignSections
        campaigns={state.campaigns}
        menus={state.menus}
        onChanged={reload}
      />
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar
          title="캠페인"
          trailing={
            <NewCampaignButton
              onLimited={next ? () => setIsLimitSheetOpen(true) : undefined}
            />
          }
        />
      </div>
      <main className="flex flex-1 flex-col">{renderContent()}</main>

      {isLimitSheetOpen && next && state.status === 'success' && (
        <NewCampaignLimitSheet
          campaign={next}
          onClose={() => setIsLimitSheetOpen(false)}
          title={getCampaignTitle(next.coupon, state.menus)}
        />
      )}
    </>
  );
};
