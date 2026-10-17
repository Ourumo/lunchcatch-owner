import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { Button } from '@repo/ui';

import { getCampaignTitle } from '@owner/components/campaignFormat';
import { LoadMoreTrigger } from '@owner/components/LoadMoreTrigger/LoadMoreTrigger';
import { TopBar } from '@owner/components/TopBar/TopBar';
import { useGoBack } from '@owner/hooks/useGoBack';

import { EndedCampaignCard } from './EndedCampaignCard';
import { ENDED_CAMPAIGNS_PATH } from './endedCampaigns';
import { readEndedListScroll, saveEndedListScroll } from './endedListStorage';
import {
  type LoadMoreStatus,
  useEndedCampaignList,
} from './useEndedCampaignList';

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

interface ListFooterProps {
  hasMore: boolean;
  loadMore: LoadMoreStatus;
  onLoadMore: () => void;
}

// 목록 아래: 이어서 불러오는 중, 이어서 불러오기 실패, 끝까지 봤을 때
const ListFooter = ({ hasMore, loadMore, onLoadMore }: ListFooterProps) => {
  if (loadMore === 'loading') {
    return (
      <div className="flex justify-center py-4" role="status">
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-text-tertiary border-r-transparent motion-reduce:animate-none"
        />
        <span className="sr-only">지난 캠페인을 더 불러오는 중</span>
      </div>
    );
  }

  if (loadMore === 'error') {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <p className="text-body-sm-mobile text-text-secondary" role="alert">
          불러오지 못했어요
        </p>
        <Button onClick={onLoadMore} variant="secondary">
          다시 시도
        </Button>
      </div>
    );
  }

  if (hasMore) {
    return <LoadMoreTrigger onLoadMore={onLoadMore} />;
  }

  return (
    <p className="py-4 text-center text-body-sm-mobile text-text-secondary">
      모든 캠페인을 봤어요
    </p>
  );
};

// 스크롤 위치를 기록해 두었다가, 복원한 목록을 처음 그릴 때 그 위치로 돌려놓는다.
// 상세로 넘어가는 순간에는 화면이 짧아져 브라우저가 스크롤 값을 줄이므로, 떠날 때 읽지 않고 스크롤할 때마다 기록한다
const useEndedListScroll = (historyKey: string, isRestored: boolean) => {
  useLayoutEffect(() => {
    const y = isRestored ? readEndedListScroll(historyKey) : null;

    if (y !== null) {
      window.scrollTo(0, y);
    }
  }, [historyKey, isRestored]);

  useEffect(() => {
    let frame = 0;

    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // 이미 다른 화면으로 넘어갔으면 줄어든 스크롤 값을 기록하지 않는다
        if (window.location.pathname === ENDED_CAMPAIGNS_PATH) {
          saveEndedListScroll(historyKey, window.scrollY);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [historyKey]);
};

// 지난 캠페인 전체 목록. 캠페인 탭은 최근 몇 건만 보여주고 나머지는 여기서 본다.
// 20건씩 나눠 받아 목록 끝에 가까워지면 다음 구간을 이어 붙인다.
// 상세에 갔다가 뒤로 돌아오면 불러온 목록과 스크롤 위치를 그대로 복원한다
export const EndedCampaignList = () => {
  const goBack = useGoBack(CAMPAIGN_LIST_PATH);
  // 브라우저 기록 항목마다 다른 값. 뒤로 돌아오면 같고, 새로 들어오면 달라진다
  const historyKey = useLocation().key;
  const { isRestored, loadMore, retry, state } =
    useEndedCampaignList(historyKey);

  useEndedListScroll(historyKey, isRestored);

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

    if (state.campaigns.length === 0) {
      return (
        <EndedListMessage
          description="집행 기간이 끝난 캠페인이 여기에 모여요"
          title="아직 끝난 캠페인이 없어요"
        />
      );
    }

    return (
      <div className="px-page py-5">
        <ul className="flex flex-col gap-2">
          {state.campaigns.map((campaign) => (
            <li key={campaign.id}>
              <EndedCampaignCard
                campaign={campaign}
                title={getCampaignTitle(campaign.coupon, state.menus)}
              />
            </li>
          ))}
        </ul>
        <ListFooter
          hasMore={state.nextCursor !== null}
          loadMore={state.loadMore}
          onLoadMore={loadMore}
        />
      </div>
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
