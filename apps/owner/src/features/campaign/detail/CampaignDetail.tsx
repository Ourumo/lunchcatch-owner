import { useLayoutEffect } from 'react';
import { Link } from 'react-router';
import { Info } from 'lucide-react';

import { type Campaign, ISSUE_OPEN_TIME } from '@owner/api/campaign';
import type { StoreMenu } from '@owner/api/store';
import { useCampaignPerformance } from '@owner/hooks/useCampaignPerformance';
import { useGoBack } from '@owner/hooks/useGoBack';
import {
  formatCreatedDate,
  formatDiscount,
  formatNumber,
  formatPeriod,
  formatPoints,
  formatShortDate,
  getCampaignTitle,
  getPeriodDays,
  pausedNotices,
} from '@owner/ui/campaignFormat';
import { CampaignStatusBadge } from '@owner/ui/CampaignStatusBadge/CampaignStatusBadge';
import { PerformanceError } from '@owner/ui/PerformanceError/PerformanceError';
import { SkeletonBlock } from '@owner/ui/SkeletonBlock/SkeletonBlock';
import { StatusMessage } from '@owner/ui/StatusMessage/StatusMessage';
import { TopBar } from '@owner/ui/TopBar/TopBar';

import { CampaignActions } from '../actions/CampaignActions';
import { formatAgeGroups, formatGender, formatRadius } from '../campaignFormat';
import { PosterPreview } from '../PosterPreview';
import { DetailNote, DetailRow, DetailSection } from './DetailSection';
import { useCampaignDetail } from './useCampaignDetail';

const LIST_PATH = '/campaigns';

const StatusNotice = ({ campaign }: { campaign: Campaign }) => {
  const { budget, pausedReason, status } = campaign;

  const message =
    status === 'DRAFT'
      ? '작성 중인 캠페인이에요. 모든 단계를 마치고 활성화를 요청하면 대기 중 상태가 돼요.'
      : status === 'SCHEDULED' && budget.startDate
        ? `${formatShortDate(budget.startDate)} 00:00부터 피드에 노출돼요.`
        : status === 'PAUSED' && pausedReason
          ? pausedNotices[pausedReason]
          : null;

  if (!message) {
    return null;
  }

  return (
    <p className="flex gap-1.5 rounded-xl bg-surface-subtle p-4 text-caption-mobile break-keep text-text-primary">
      <Info
        aria-hidden="true"
        className="mt-0.5 size-3.5 shrink-0 text-text-secondary"
      />
      {message}
    </p>
  );
};

// 서버가 만든 완성 포스터를 그대로 보여준다
const PosterSection = ({
  posterHtml,
}: {
  posterHtml: string | 'none' | null;
}) => (
  <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
    <h2 className="text-body-mobile font-bold text-text-primary">포스터</h2>
    {posterHtml && posterHtml !== 'none' ? (
      <div className="mt-3 overflow-hidden rounded-lg border border-border-subtle">
        <PosterPreview html={posterHtml} />
      </div>
    ) : (
      <p className="mt-3 flex h-32 items-center justify-center rounded-lg border border-dashed border-border-subtle text-body-sm-mobile text-text-secondary">
        {posterHtml === null
          ? '포스터를 불러오지 못했어요'
          : '아직 포스터를 만들지 않았어요'}
      </p>
    )}
  </section>
);

interface CampaignContentProps {
  campaign: Campaign;
  menus: StoreMenu[];
  posterHtml: string | 'none' | null;
}

const CampaignContent = ({
  campaign,
  menus,
  posterHtml,
}: CampaignContentProps) => {
  const { budget, coupon, createdAt, pausedReason, status } = campaign;
  const { retry: retryPerformance, state: performanceState } =
    useCampaignPerformance(campaign);
  // 작성 중·대기 중은 집행 전이라 성과가 없다
  const canHavePerformance = status !== 'DRAFT' && status !== 'SCHEDULED';
  const performance =
    performanceState.status === 'success' ? performanceState.data : null;
  const menu = menus.find(({ id }) => id === coupon.menuId);
  const hasPeriod = Boolean(budget.startDate && budget.endDate);
  const periodDays = hasPeriod
    ? getPeriodDays(budget.startDate, budget.endDate)
    : 0;
  const today = performance?.today;
  const total = performance?.total;

  return (
    <div className="flex flex-col gap-3 px-page pt-5 pb-10">
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <CampaignStatusBadge pausedReason={pausedReason} status={status} />
          <span className="text-caption-mobile text-text-secondary">
            {formatCreatedDate(createdAt)} 등록
          </span>
        </div>
        <h2 className="mt-2 text-h1 font-bold break-keep text-text-primary">
          {getCampaignTitle(coupon, menus)}
        </h2>
      </div>

      <StatusNotice campaign={campaign} />
      <PosterSection posterHtml={posterHtml} />

      <DetailSection title="쿠폰 조건">
        <DetailRow
          label="할인 대상"
          value={
            coupon.discountTarget === 'ALL'
              ? '전 메뉴'
              : menu && `${menu.name} (${formatNumber(menu.price)}원)`
          }
        />
        <DetailRow isHighlighted label="할인" value={formatDiscount(coupon)} />
        <DetailRow
          label="하루 선착순 수량"
          value={
            coupon.issueLimit !== null && `${formatNumber(coupon.issueLimit)}장`
          }
        />
        <DetailRow label="선착순 오픈" value={`매일 ${ISSUE_OPEN_TIME}`} />
        <DetailRow
          label="사용 가능 시간"
          value={`매일 ${coupon.usableFrom} ~ ${coupon.usableUntil}`}
        />
        {coupon.minOrderAmount !== null && (
          <DetailRow
            label="최소 주문 금액"
            value={`${formatNumber(coupon.minOrderAmount)}원 이상`}
          />
        )}
        {coupon.notice && <DetailNote label="유의사항" value={coupon.notice} />}
      </DetailSection>

      <DetailSection title="노출 대상">
        <DetailRow
          label="노출 반경"
          value={`가게 반경 ${formatRadius(campaign.target.radius)}`}
        />
        <DetailRow label="성별" value={formatGender(campaign.target.gender)} />
        <DetailRow
          label="연령대"
          value={formatAgeGroups(campaign.target.ageGroups)}
        />
      </DetailSection>

      <DetailSection title="예산과 기간">
        <DetailRow
          label="하루 예산"
          value={
            budget.dailyBudget !== null && formatPoints(budget.dailyBudget)
          }
        />
        <DetailRow
          label="집행 기간"
          value={
            hasPeriod &&
            `${formatPeriod(budget.startDate, budget.endDate)} (${periodDays}일)`
          }
        />
        <DetailRow
          isHighlighted
          label="총 필요 포인트"
          value={
            budget.dailyBudget !== null &&
            hasPeriod &&
            formatPoints(budget.dailyBudget * periodDays)
          }
        />
      </DetailSection>

      {canHavePerformance && performanceState.status === 'loading' && (
        <SkeletonBlock className="h-40" label="실적을 불러오는 중" />
      )}

      {canHavePerformance && performanceState.status === 'error' && (
        <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
          <h2 className="text-body-mobile font-bold text-text-primary">실적</h2>
          <PerformanceError className="mt-3" onRetry={retryPerformance} />
        </section>
      )}

      {today && (
        <DetailSection title="오늘 실적">
          <DetailRow
            label="쿠폰 발급"
            value={`${formatNumber(today.issuedCount)} / ${formatNumber(coupon.issueLimit ?? 0)}장`}
          />
          <DetailRow
            label="쿠폰 사용"
            value={`${formatNumber(today.redeemedCount)}장`}
          />
          <DetailRow
            label="소진 포인트"
            value={`${formatPoints(today.spentPoints)} / ${formatPoints(today.reservedPoints)}`}
          />
          <DetailRow
            isHighlighted
            label="남은 예산"
            value={formatPoints(today.reservedPoints - today.spentPoints)}
          />
        </DetailSection>
      )}

      {total && (
        <DetailSection title="누적 실적">
          <DetailRow label="찜" value={`${formatNumber(total.savedCount)}명`} />
          <DetailRow
            label="쿠폰 발급"
            value={`${formatNumber(total.issuedCount)}장`}
          />
          <DetailRow
            label="쿠폰 사용"
            value={`${formatNumber(total.redeemedCount)}장 (${
              total.issuedCount > 0
                ? Math.round((total.redeemedCount / total.issuedCount) * 100)
                : 0
            }%)`}
          />
          <DetailRow
            label="소진 포인트"
            value={formatPoints(total.spentPoints)}
          />
        </DetailSection>
      )}
    </div>
  );
};

const CampaignDetailSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-3 px-page pt-5">
    <span className="sr-only">캠페인을 불러오는 중</span>
    {[64, 420, 200, 160].map((height, index) => (
      <SkeletonBlock height={height} key={index} />
    ))}
  </div>
);

export interface CampaignDetailProps {
  id: string;
}

// 캠페인 상세 조회. 화면 아래에 상태별 처리(중단, 다시 시작, 종료, 대기 중 취소, 이어서 작성, 하루 예산 변경)를 붙이고, 처리한 뒤 다시 불러온다
export const CampaignDetail = ({ id }: CampaignDetailProps) => {
  const goBack = useGoBack(LIST_PATH);
  const { reload, retry, state } = useCampaignDetail(id);

  // 앱이 화면을 옮길 때 스크롤을 되돌리지 않아, 길게 내린 목록(지난 캠페인 전체 등)에서 들어오면 중간부터 보인다.
  // 상세는 항상 맨 위에서 시작한다
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const renderContent = () => {
    if (state.status === 'loading') {
      return <CampaignDetailSkeleton />;
    }

    if (state.status === 'error') {
      return (
        <StatusMessage
          action={
            <Link
              className="inline-flex min-h-10 items-center rounded-md px-4 text-body-sm-mobile font-medium text-text-primary hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
              to={LIST_PATH}
            >
              목록으로
            </Link>
          }
          description={state.message ?? '잠시 후 다시 시도해 주세요.'}
          fill
          onRetry={retry}
          title="캠페인을 불러오지 못했어요"
        />
      );
    }

    return (
      <CampaignContent
        campaign={state.campaign}
        menus={state.menus}
        posterHtml={state.posterHtml}
      />
    );
  };

  return (
    <>
      <div className="sticky top-0 z-10">
        <TopBar onBack={goBack} title="캠페인 상세" />
      </div>
      <main className="flex flex-1 flex-col">{renderContent()}</main>
      {state.status === 'success' && (
        <CampaignActions
          campaign={state.campaign}
          canChangeDailyBudget
          layout="bar"
          onChanged={reload}
        />
      )}
    </>
  );
};
