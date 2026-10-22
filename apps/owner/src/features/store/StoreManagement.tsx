import { type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@repo/ui';
import { ChartNoAxesColumn, ChevronRight, Store } from 'lucide-react';

import type { MyStore } from '@owner/api/store';
import { useAuth } from '@owner/auth/useAuth';
import { useChargePolicy } from '@owner/hooks/useChargePolicy';
import { usePointCharge } from '@owner/hooks/usePointCharge';
import { formatPoints } from '@owner/ui/campaignFormat';
import { PointChargeSheet } from '@owner/ui/PointChargeSheet/PointChargeSheet';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { LogoutSheet } from './LogoutSheet';
import {
  formatBusinessHours,
  formatMenuCount,
  formatStoreImageCount,
} from './storeFormat';
import {
  COUPON_USAGE_PATH,
  PAYMENT_HISTORY_PATH,
  POINT_HISTORY_PATH,
  POINT_REFUND_PATH,
  STORE_ANALYTICS_PATH,
  STORE_HOURS_PATH,
  STORE_IMAGES_PATH,
  STORE_MENUS_PATH,
} from './storePaths';
import { useStoreManagement } from './useStoreManagement';

const LOGIN_PATH = '/login';

const rowClassName =
  'flex min-h-14 items-center gap-3 px-4 py-3 text-body-mobile text-text-primary transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary';

// 기본 정보 수정은 명세에 없어 보기만 한다
const StoreProfile = ({ store }: { store: MyStore }) => (
  <div className="flex items-center gap-4">
    {store.logoImageUrl ? (
      <img
        alt=""
        className="size-14 shrink-0 rounded-xl bg-surface-subtle object-cover"
        src={store.logoImageUrl}
      />
    ) : (
      // 대표 이미지를 아직 올리지 않았으면 빈 자리를 보여준다
      <span
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-surface-subtle text-text-disabled"
      >
        <Store className="size-6" />
      </span>
    )}
    <div className="min-w-0">
      <p className="truncate text-h3-mobile font-bold text-text-primary">
        {store.name}
      </p>
      <p className="mt-0.5 text-body-sm-mobile break-keep text-text-secondary">
        {store.roadAddress}
      </p>
    </div>
  </div>
);

// 여러 캠페인에 걸친 가게 단위 기록이라 캠페인 탭이 아닌 가게 관리에 둔다
const AnalyticsLink = () => (
  <Link
    className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
    to={STORE_ANALYTICS_PATH}
  >
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-subtle">
      <ChartNoAxesColumn
        aria-hidden="true"
        className="size-5 text-text-secondary"
      />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-body-mobile font-bold text-text-primary">
        분석
      </span>
      <span className="mt-0.5 block text-caption-mobile break-keep text-text-secondary">
        쿠폰 사용 추이를 날짜별로 확인해요
      </span>
    </span>
    <ChevronRight
      aria-hidden="true"
      className="size-5 shrink-0 text-text-tertiary"
    />
  </Link>
);

interface ManagementSectionProps {
  title: string;
  children: ReactNode;
}

// 묶음마다 한 줄씩 추가할 수 있도록 제목과 카드만 둔다
const ManagementSection = ({ children, title }: ManagementSectionProps) => (
  <section className="flex flex-col gap-2">
    <h2 className="px-1 text-body-sm-mobile font-bold text-text-secondary">
      {title}
    </h2>
    <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {children}
    </div>
  </section>
);

interface LinkRowProps {
  to: string;
  label: string;
  // 오른쪽에 보여주는 현재 값
  value?: string;
}

const LinkRow = ({ label, to, value }: LinkRowProps) => (
  <Link className={rowClassName} to={to}>
    <span className="shrink-0">{label}</span>
    {value && (
      <span className="min-w-0 flex-1 truncate text-right text-body-sm-mobile text-text-secondary">
        {value}
      </span>
    )}
    <ChevronRight
      aria-hidden="true"
      className="ml-auto size-5 shrink-0 text-text-tertiary"
    />
  </Link>
);

interface BalanceRowProps {
  balance: number;
  onCharge: () => void;
}

const BalanceRow = ({ balance, onCharge }: BalanceRowProps) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3">
    <div>
      <p className="text-caption-mobile text-text-secondary">잔액</p>
      <p className="mt-0.5 text-h3-mobile font-bold text-text-primary">
        {formatPoints(balance)}
      </p>
    </div>
    <button
      className="flex h-9 shrink-0 items-center rounded-full border border-action-primary px-4 text-body-sm-mobile font-bold text-text-brand transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
      onClick={onCharge}
      type="button"
    >
      충전
    </button>
  </div>
);

const StoreManagementSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-6 px-page py-5">
    <span className="sr-only">가게 관리 화면을 불러오는 중</span>
    {[56, 80, 136, 184].map((height, index) => (
      <div
        aria-hidden="true"
        className="animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
        key={index}
        style={{ height }}
      />
    ))}
  </div>
);

const StoreManagementError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-page pb-16 text-center">
    <p className="text-body-mobile font-bold text-text-primary">
      가게 정보를 불러오지 못했어요
    </p>
    <p className="text-body-sm-mobile text-text-secondary">
      잠시 후 다시 시도해 주세요
    </p>
    <Button className="mt-2" onClick={onRetry} variant="secondary">
      다시 시도
    </Button>
  </div>
);

// 가게 관리 탭. 명세의 필수 기능(포인트 충전·내역, 영업시간·사진·메뉴 수정)만 둔다
export const StoreManagement = () => {
  const navigate = useNavigate();
  const { clearOwner } = useAuth();
  const { retry, state } = useStoreManagement();
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const chargePolicy = useChargePolicy();
  const startCharge = usePointCharge();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const renderContent = () => {
    if (state.status === 'loading') {
      return <StoreManagementSkeleton />;
    }

    if (state.status === 'error') {
      return <StoreManagementError onRetry={retry} />;
    }

    const { balance, store } = state;

    return (
      <div className="flex flex-col gap-6 px-page py-5">
        <StoreProfile store={store} />
        <AnalyticsLink />

        <ManagementSection title="포인트">
          <BalanceRow
            balance={balance}
            onCharge={() => setIsChargeOpen(true)}
          />
          <LinkRow label="포인트 내역" to={POINT_HISTORY_PATH} />
          <LinkRow label="결제 내역" to={PAYMENT_HISTORY_PATH} />
          <LinkRow label="포인트 환불" to={POINT_REFUND_PATH} />
        </ManagementSection>

        <ManagementSection title="쿠폰">
          <LinkRow label="쿠폰 사용 이력" to={COUPON_USAGE_PATH} />
        </ManagementSection>

        <ManagementSection title="가게 정보">
          <LinkRow
            label="영업시간"
            to={STORE_HOURS_PATH}
            value={formatBusinessHours(store.businessHours)}
          />
          <LinkRow
            label="매장 사진"
            to={STORE_IMAGES_PATH}
            value={formatStoreImageCount(store)}
          />
          <LinkRow
            label="대표 메뉴"
            to={STORE_MENUS_PATH}
            value={formatMenuCount(store)}
          />
        </ManagementSection>

        {/* 자주 쓰지 않고 잘못 누르면 다시 로그인해야 하므로 맨 아래 작은 글씨로 둔다 */}
        <button
          className="mx-auto flex h-11 items-center rounded-full px-4 text-body-sm-mobile text-text-secondary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={() => setIsLogoutOpen(true)}
          type="button"
        >
          로그아웃
        </button>

        {isChargeOpen && (
          <PointChargeSheet
            balance={balance}
            policy={chargePolicy}
            onCharge={startCharge}
            onClose={() => setIsChargeOpen(false)}
          />
        )}
        {isLogoutOpen && (
          <LogoutSheet
            onClose={() => setIsLogoutOpen(false)}
            // 뒤로 가기로 가게 관리에 돌아오지 않도록 지금 기록을 로그인 화면으로 바꾼다
            onLogout={() => {
              clearOwner();
              navigate(LOGIN_PATH, { replace: true });
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar title="가게 관리" />
      </div>
      <main className="flex flex-1 flex-col">{renderContent()}</main>
    </>
  );
};
