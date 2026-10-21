import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';
import {
  ChevronRight,
  CircleAlert,
  CircleHelp,
  QrCode,
  Wallet,
} from 'lucide-react';

import { chargePoints } from '@owner/api/points';
import type { MyStore } from '@owner/api/store';
import { useChargePolicy } from '@owner/hooks/useChargePolicy';
import { formatPoints } from '@owner/ui/campaignFormat';
import { PointChargeSheet } from '@owner/ui/PointChargeSheet/PointChargeSheet';

import { getCurrentCampaign } from './homeCampaigns';
import { HomeCampaignSection } from './HomeCampaignSection';
import { RecentPerformance } from './RecentPerformance';
import { TutorialSheet } from './TutorialSheet';
import { useHome } from './useHome';

const QR_SCAN_PATH = '/qr-scan';

interface HomeHeaderProps {
  balance: number;
  onBalanceClick: () => void;
  onHelpClick: () => void;
  store: MyStore;
}

// 알림 기능이 없어 알림 아이콘 대신 잔액을 둔다. 잔액이 모자라면 캠페인이 멈추므로 늘 보이게 한다.
// 사용법은 자주 보지 않아 가게 이름 아래에 작은 글자로 둔다.
// 오른쪽 위 잔액과 줄도 방향도 달라 잘못 누르지 않고, 잔액이 커져도 가게 이름 자리를 줄이지 않는다
const HomeHeader = ({
  balance,
  onBalanceClick,
  onHelpClick,
  store,
}: HomeHeaderProps) => (
  <header className="flex flex-col">
    <div className="flex items-center justify-between gap-3">
      <h1 className="min-w-0 truncate text-h2-mobile font-bold text-text-primary">
        {store.name}
      </h1>
      <button
        aria-label={`포인트 잔액 ${formatPoints(balance)}, 충전하기`}
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface pr-2.5 pl-3.5 text-body-sm-mobile font-bold text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        onClick={onBalanceClick}
        type="button"
      >
        <Wallet aria-hidden="true" className="size-4 text-text-secondary" />
        {formatPoints(balance)}
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-text-tertiary"
        />
      </button>
    </div>
    {/* 누르는 영역은 높이 44px로 두되 위쪽 영역이 높아지지 않도록 바깥 여백을 당긴다 */}
    <button
      className="-my-2 -ml-2 flex h-11 items-center gap-1 self-start rounded-full px-2 text-caption-mobile font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
      onClick={onHelpClick}
      type="button"
    >
      <CircleHelp aria-hidden="true" className="size-4" />
      런치캐치 사용법
    </button>
  </header>
);

// 진행 중 캠페인이 잔액 부족으로 멈췄을 때만 보여준다. 충전하면 다시 시작되므로 바로 충전으로 잇는다
const LowBalanceAlert = ({ onCharge }: { onCharge: () => void }) => (
  <div className="flex items-center gap-2 rounded-xl bg-status-danger-bg py-2.5 pr-2.5 pl-3.5">
    <CircleAlert
      aria-hidden="true"
      className="size-5 shrink-0 text-status-danger-fg"
    />
    <p className="min-w-0 flex-1 text-body-sm-mobile font-bold break-keep text-status-danger-fg">
      포인트가 부족해 캠페인이 멈췄어요
    </p>
    <button
      className="flex h-9 shrink-0 items-center rounded-full bg-status-danger-border px-3.5 text-body-sm-mobile font-bold text-text-inverse transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      onClick={onCharge}
      type="button"
    >
      충전
    </button>
  </div>
);

// 쿠폰 사용 처리는 실제로 매장 기기에서 손님이 직접 하고, 점주 앱 QR 스캔은 시연용이다.
// 홈의 주 기능처럼 보이지 않도록 보조 버튼으로 두되, 시연할 때 바로 찾을 수 있게 자리는 위에 둔다
const QrScanLink = () => (
  <Link
    className="flex h-13 items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-surface px-4 text-body-mobile font-medium text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    to={QR_SCAN_PATH}
  >
    <QrCode aria-hidden="true" className="size-5 text-action-primary" />
    <span className="flex-1">QR로 쿠폰 사용 처리</span>
    <ChevronRight
      aria-hidden="true"
      className="size-5 shrink-0 text-text-tertiary"
    />
  </Link>
);

const HomeSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-5 px-page py-5">
    <span className="sr-only">홈 화면을 불러오는 중</span>
    {[64, 52, 176].map((height, index) => (
      <div
        aria-hidden="true"
        className="animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
        key={index}
        style={{ height }}
      />
    ))}
  </div>
);

const HomeError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
    <p className="text-body-mobile font-bold text-text-primary">
      홈 화면을 불러오지 못했어요
    </p>
    <p className="text-body-sm-mobile text-text-secondary">
      잠시 후 다시 시도해 주세요
    </p>
    <Button className="mt-2" onClick={onRetry} variant="secondary">
      다시 시도
    </Button>
  </div>
);

// 홈 탭. 점심에 앱을 열면 가장 먼저 보는 화면이라 QR 스캔과 오늘 캠페인 상황을 위에 둔다
export const HomeDashboard = () => {
  const { retry, state, updateBalance } = useHome();
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const chargePolicy = useChargePolicy();

  const handleCharge = async (amount: number) => {
    const result = await chargePoints(amount);

    if (result.ok) {
      updateBalance(result.data.balance);
    }

    return result;
  };

  const renderContent = () => {
    if (state.status === 'loading') {
      return <HomeSkeleton />;
    }

    if (state.status === 'error') {
      return <HomeError onRetry={retry} />;
    }

    const current = getCurrentCampaign(state.campaigns);
    const isPausedByNoPoints =
      current?.status === 'PAUSED' && current.pausedReason === 'NO_POINTS';
    const openCharge = () => setIsChargeOpen(true);

    return (
      <div className="flex flex-col gap-5 px-page py-5">
        <HomeHeader
          balance={state.balance}
          onBalanceClick={openCharge}
          onHelpClick={() => setIsTutorialOpen(true)}
          store={state.store}
        />
        {isPausedByNoPoints && <LowBalanceAlert onCharge={openCharge} />}
        <QrScanLink />
        <HomeCampaignSection
          campaigns={state.campaigns}
          menus={state.store.menus}
        />
        <RecentPerformance days={state.recentDays} />

        {isChargeOpen && (
          <PointChargeSheet
            balance={state.balance}
            policy={chargePolicy}
            onCharge={handleCharge}
            onClose={() => setIsChargeOpen(false)}
          />
        )}
        {/* 다시 볼 때는 완료를 저장하지 않고 닫기만 한다. 튜토리얼을 봤는지(tutorialViewed)는 바꾸지 않는다 */}
        {isTutorialOpen && (
          <TutorialSheet
            onFinish={async () => {
              setIsTutorialOpen(false);
              return true;
            }}
          />
        )}
      </div>
    );
  };

  return <main className="flex flex-1 flex-col">{renderContent()}</main>;
};
