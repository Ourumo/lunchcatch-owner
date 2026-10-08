import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@repo/ui';
import { ChevronRight, QrCode, Wallet } from 'lucide-react';

import { chargePoints, MIN_CHARGE_AMOUNT } from '@owner/api/points';
import type { MyStore } from '@owner/api/store';
import { formatPoints } from '@owner/components/campaignFormat';
import { PointChargeSheet } from '@owner/components/PointChargeSheet/PointChargeSheet';

import { useHome } from './useHome';

const QR_SCAN_PATH = '/qr-scan';

interface HomeHeaderProps {
  balance: number;
  onBalanceClick: () => void;
  store: MyStore;
}

// 알림 기능이 없어 알림 아이콘 대신 잔액을 둔다. 잔액이 모자라면 캠페인이 멈추므로 늘 보이게 한다
const HomeHeader = ({ balance, onBalanceClick, store }: HomeHeaderProps) => (
  <header className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-caption-mobile text-text-secondary">
        오늘도 힘찬 점심 장사 되세요
      </p>
      <h1 className="mt-0.5 truncate text-h2-mobile font-bold text-text-primary">
        {store.name}
      </h1>
    </div>
    <button
      aria-label={`포인트 잔액 ${formatPoints(balance)}, 충전하기`}
      className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface pr-2.5 pl-3.5 text-body-sm-mobile font-bold text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      onClick={onBalanceClick}
      type="button"
    >
      <Wallet aria-hidden="true" className="size-4 text-text-secondary" />
      {formatPoints(balance)}
      <ChevronRight aria-hidden="true" className="size-4 text-text-tertiary" />
    </button>
  </header>
);

// 점심에 가장 자주 쓰는 기능이라 홈의 주 버튼으로 크게 둔다
const QrScanLink = () => (
  <Link
    className="flex h-16 items-center justify-center gap-2.5 rounded-xl bg-action-primary text-body-mobile font-bold text-text-inverse transition-colors hover:bg-action-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    to={QR_SCAN_PATH}
  >
    <QrCode aria-hidden="true" className="size-6" />
    QR 코드 스캔
  </Link>
);

const HomeSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-5 px-page py-5">
    <span className="sr-only">홈 화면을 불러오는 중</span>
    {[48, 64, 176].map((height, index) => (
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

    return (
      <div className="flex flex-col gap-5 px-page py-5">
        <HomeHeader
          balance={state.balance}
          onBalanceClick={() => setIsChargeOpen(true)}
          store={state.store}
        />
        <QrScanLink />

        {isChargeOpen && (
          <PointChargeSheet
            balance={state.balance}
            minChargeAmount={MIN_CHARGE_AMOUNT}
            onCharge={handleCharge}
            onClose={() => setIsChargeOpen(false)}
          />
        )}
      </div>
    );
  };

  return <main className="flex flex-1 flex-col">{renderContent()}</main>;
};
