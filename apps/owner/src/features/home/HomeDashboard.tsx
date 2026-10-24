import { useState } from 'react';
import { Link } from 'react-router';
import {
  ChevronRight,
  CircleAlert,
  CircleHelp,
  QrCode,
  RotateCw,
  Wallet,
} from 'lucide-react';

import type { MyStore } from '@owner/api/store';
import { useChargePolicy } from '@owner/hooks/useChargePolicy';
import { usePointCharge } from '@owner/hooks/usePointCharge';
import { formatPoints } from '@owner/ui/campaignFormat';
import { PointChargeSheet } from '@owner/ui/PointChargeSheet/PointChargeSheet';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';
import { StatusMessage } from '@owner/ui/StatusMessage/StatusMessage';

import { getCurrentCampaign } from './homeCampaigns';
import { HomeCampaignSection } from './HomeCampaignSection';
import { RecentPerformance } from './RecentPerformance';
import { TutorialSheet } from './TutorialSheet';
import { useHome } from './useHome';

const QR_SCAN_PATH = '/qr-scan';

interface HomeHeaderProps {
  // 불러오는 중이면 null. 가게 이름과 잔액 자리만 스켈레톤으로 두고 사용법은 그대로 그린다.
  // 잔액을 불러오지 못하면 'error'로, 잔액 자리만 다시 불러오기 버튼으로 바꾼다
  balance: number | 'error' | null;
  onBalanceClick: () => void;
  onBalanceRetry: () => void;
  onHelpClick: () => void;
  store: MyStore | null;
}

const balanceButtonClassName =
  'flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface text-body-sm-mobile font-bold text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary';

// 알림 기능이 없어 알림 아이콘 대신 잔액을 둔다. 잔액이 모자라면 캠페인이 멈추므로 늘 보이게 한다.
// 사용법은 자주 보지 않아 가게 이름 아래에 작은 글자로 둔다.
// 오른쪽 위 잔액과 줄도 방향도 달라 잘못 누르지 않고, 잔액이 커져도 가게 이름 자리를 줄이지 않는다
const HomeHeader = ({
  balance,
  onBalanceClick,
  onBalanceRetry,
  onHelpClick,
  store,
}: HomeHeaderProps) => (
  <header className="flex flex-col">
    <div className="flex items-center justify-between gap-3">
      {store ? (
        <h1 className="min-w-0 truncate text-h2-mobile font-bold text-text-primary">
          {store.name}
        </h1>
      ) : (
        <SkeletonBlock className="h-7 w-36" />
      )}
      {balance === null ? (
        <SkeletonBlock className="h-11 w-28" rounded="full" />
      ) : balance === 'error' ? (
        <button
          aria-label="잔액을 불러오지 못했어요, 다시 불러오기"
          className={`${balanceButtonClassName} px-3.5`}
          onClick={onBalanceRetry}
          type="button"
        >
          <RotateCw aria-hidden="true" className="size-4 text-text-secondary" />
          다시 불러오기
        </button>
      ) : (
        <button
          aria-label={`포인트 잔액 ${formatPoints(balance)}, 충전하기`}
          className={`${balanceButtonClassName} pr-2.5 pl-3.5`}
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
      )}
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
    {/* 경고 배경 위에 뜨는 표면색 버튼. 다크 모드에서는 경고 배경과 위험색 채움이 같은 색이라 채움 버튼이 보이지 않는다 */}
    <button
      className="flex h-9 shrink-0 items-center rounded-full bg-bg-surface px-3.5 text-body-sm-mobile font-bold text-status-danger-fg transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
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

// 홈 탭. 점심에 앱을 열면 가장 먼저 보는 화면이라 QR 스캔과 오늘 캠페인 상황을 위에 둔다
export const HomeDashboard = () => {
  const {
    balance,
    campaigns,
    recentDays,
    retry,
    retryBalance,
    retryCampaigns,
    retryRecentDays,
    store,
  } = useHome();
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const chargePolicy = useChargePolicy();
  const startCharge = usePointCharge();

  const renderContent = () => {
    // 가게 이름, 메뉴 이름, 최근 실적이 모두 가게 정보에 기대어 가게 정보만은 화면 전체 오류로 본다
    if (store.status === 'error') {
      return (
        <StatusMessage
          description="잠시 후 다시 시도해 주세요"
          fill
          onRetry={retry}
          title="홈 화면을 불러오지 못했어요"
        />
      );
    }

    // 자리마다 따로 불러와 받은 자리부터 채운다. 고정된 부분(사용법, QR, 섹션 제목)은 그대로 두고
    // 불러오는 중인 값 자리만 스켈레톤으로, 실패한 자리만 다시 시도로 둔다
    const storeData = store.status === 'success' ? store.data : null;
    const balanceValue =
      balance.status === 'success'
        ? balance.data
        : balance.status === 'error'
          ? 'error'
          : null;
    const campaignList =
      campaigns.status === 'success'
        ? campaigns.data
        : campaigns.status === 'error'
          ? 'error'
          : null;
    // 최근 실적은 캠페인 목록을 받아야 불러오므로, 캠페인 목록이 실패하면 함께 실패로 보여주고 캠페인 목록부터 다시 부른다
    const recentDaysValue =
      campaigns.status === 'error' || recentDays.status === 'error'
        ? 'error'
        : recentDays.status === 'success'
          ? recentDays.data
          : null;
    const current =
      campaigns.status === 'success' && getCurrentCampaign(campaigns.data);
    const isPausedByNoPoints =
      current &&
      current.status === 'PAUSED' &&
      current.pausedReason === 'NO_POINTS';
    const isLoading =
      !storeData || balanceValue === null || campaignList === null;
    const openCharge = () => setIsChargeOpen(true);

    return (
      <div
        aria-busy={isLoading ? true : undefined}
        className="flex flex-col gap-5 px-page py-5"
      >
        {isLoading && <span className="sr-only">홈 화면을 불러오는 중</span>}
        <HomeHeader
          balance={balanceValue}
          onBalanceClick={openCharge}
          onBalanceRetry={retryBalance}
          onHelpClick={() => setIsTutorialOpen(true)}
          store={storeData}
        />
        {isPausedByNoPoints && <LowBalanceAlert onCharge={openCharge} />}
        <QrScanLink />
        {/* 캠페인 제목에 가게 메뉴 이름이 들어가, 가게 정보를 받기 전에는 캠페인 자리도 불러오는 중으로 둔다 */}
        <HomeCampaignSection
          campaigns={storeData ? campaignList : null}
          menus={storeData?.menus ?? []}
          onRetry={retryCampaigns}
        />
        <RecentPerformance
          days={recentDaysValue}
          onRetry={
            campaigns.status === 'error' ? retryCampaigns : retryRecentDays
          }
        />

        {/* 잔액을 불러오지 못해도 잔액 부족 경고에서 충전할 수 있게 잔액 없이 연다 */}
        {isChargeOpen && (
          <PointChargeSheet
            balance={
              typeof balanceValue === 'number' ? balanceValue : undefined
            }
            policy={chargePolicy}
            onCharge={startCharge}
            onClose={() => setIsChargeOpen(false)}
          />
        )}
        {/* 다시 볼 때는 완료를 저장하지 않고 닫기만 한다. 튜토리얼을 봤는지(tutorialViewed)는 바꾸지 않는다 */}
        {isTutorialOpen && (
          <TutorialSheet onClose={() => setIsTutorialOpen(false)} />
        )}
      </div>
    );
  };

  return <main className="flex flex-1 flex-col">{renderContent()}</main>;
};
