import { type ReactNode, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router';
import { Info } from 'lucide-react';

import {
  isBudgetStepComplete,
  isCouponStepComplete,
  ISSUE_OPEN_TIME,
  isValidTarget,
} from '@owner/api/campaign';
import {
  getCampaignPoster,
  isPosterComplete,
  type SavedPoster,
} from '@owner/api/poster';
import { getMyStore, type StoreMenu } from '@owner/api/store';
import {
  formatDiscount,
  formatNumber,
  formatPeriod,
  formatPoints,
  getPeriodDays,
} from '@owner/ui/campaignFormat';

import {
  formatAgeGroups,
  formatGender,
  formatRadius,
} from '../../campaignFormat';
import { DetailNote, DetailRow } from '../../detail/DetailSection';
import { PosterPreview } from '../../PosterPreview';
import {
  type CampaignStep,
  campaignSteps,
  FROM_REVIEW_STATE,
  getCampaignEditPath,
} from '../campaignSteps';
import { PointSummary } from '../PointSummary';
import { useCampaignForm } from '../useCampaignForm';
import type { ReviewOutletContext } from '../useReviewBalance';

const POSTER_PREVIEW_WIDTH = 200;

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

interface ReviewSectionProps {
  step: CampaignStep;
  campaignId: string;
  isComplete: boolean;
  children: ReactNode;
}

// 단계별 입력 요약 카드. 제목 옆 수정 링크로 그 단계로 가고, 저장하면 확인 단계로 돌아온다
const ReviewSection = ({
  campaignId,
  children,
  isComplete,
  step,
}: ReviewSectionProps) => (
  <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-body-mobile font-bold text-text-primary">
        {step.title}
        {!isComplete && (
          <span className="rounded-full bg-status-danger-bg px-2 py-0.5 text-caption-mobile font-medium text-status-danger-fg">
            채우지 않음
          </span>
        )}
      </h3>
      <Link
        aria-label={`${step.title} 수정`}
        className="-mr-2 flex h-9 items-center rounded-full px-2 text-body-sm-mobile font-semibold text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
        state={FROM_REVIEW_STATE}
        to={getCampaignEditPath(campaignId, step)}
      >
        수정
      </Link>
    </div>
    {children}
  </section>
);

const findStep = (id: CampaignStep['id']) =>
  campaignSteps.find((step) => step.id === id) as CampaignStep;

// 등록 5단계: 앞 단계 입력을 한눈에 확인하고, 잔액을 안내한 뒤 활성화를 요청한다
export const ReviewStep = () => {
  const { campaignId, platformSettings, values } = useCampaignForm();
  const { budget, coupon, poster, target } = values;
  const [menus, setMenus] = useState<StoreMenu[]>([]);
  // 서버가 만든 완성 포스터. 아직 만들지 않았으면 'none'
  const [savedPoster, setSavedPoster] =
    useState<Loadable<SavedPoster | 'none'>>();
  // 활성화를 막을지 판단하는 레이아웃이 불러온 잔액을 그대로 보여준다
  const { balance, retryBalance } = useOutletContext<ReviewOutletContext>();

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore && result.ok) {
        setMenus(result.data.menus);
      }
    });
    getCampaignPoster(campaignId).then((result) => {
      if (!ignore) {
        setSavedPoster(result.ok ? (result.data ?? 'none') : null);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  const menu = menus.find(({ id }) => id === coupon.menuId);
  const isBudgetComplete = isBudgetStepComplete(budget, platformSettings);
  const periodDays = isBudgetComplete
    ? getPeriodDays(budget.startDate, budget.endDate)
    : 0;

  return (
    <div className="flex flex-col gap-3 px-page">
      <p className="mb-2 text-body-sm-mobile break-keep text-text-secondary">
        입력한 내용을 확인하고 활성화를 요청해 주세요.
      </p>

      <ReviewSection
        campaignId={campaignId}
        isComplete={isCouponStepComplete(coupon)}
        step={findStep('coupon')}
      >
        <dl className="mt-3 flex flex-col gap-2.5">
          <DetailRow
            label="할인 대상"
            value={
              coupon.discountTarget === 'ALL'
                ? '전 메뉴'
                : menu && `${menu.name} (${formatNumber(menu.price)}원)`
            }
          />
          <DetailRow
            isHighlighted
            label="할인"
            value={formatDiscount(coupon)}
          />
          <DetailRow
            label="하루 선착순 수량"
            value={
              coupon.issueLimit !== null &&
              `${formatNumber(coupon.issueLimit)}장`
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
          {coupon.notice && (
            <DetailNote label="유의사항" value={coupon.notice} />
          )}
        </dl>
      </ReviewSection>

      <ReviewSection
        campaignId={campaignId}
        isComplete={isPosterComplete(poster)}
        step={findStep('poster')}
      >
        {/* 2단계에서 입력한 글이 아니라 서버가 만든 포스터를 보여준다. 서버가 아직 글을 받지 않아 글이 다를 수 있다 */}
        {savedPoster && savedPoster !== 'none' ? (
          <div className="mt-3 flex justify-center">
            <div className="overflow-hidden rounded-lg border border-border-subtle">
              <PosterPreview
                html={savedPoster.html}
                width={POSTER_PREVIEW_WIDTH}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-body-sm-mobile text-text-secondary">
            {savedPoster === undefined
              ? '포스터를 불러오는 중이에요'
              : savedPoster === null
                ? '포스터를 불러오지 못했어요'
                : '아직 포스터를 만들지 않았어요'}
          </p>
        )}
      </ReviewSection>

      <ReviewSection
        campaignId={campaignId}
        isComplete={isValidTarget(target)}
        step={findStep('target')}
      >
        <dl className="mt-3 flex flex-col gap-2.5">
          <DetailRow
            label="노출 반경"
            value={`가게 반경 ${formatRadius(target.radius)}`}
          />
          <DetailRow label="성별" value={formatGender(target.gender)} />
          <DetailRow label="연령대" value={formatAgeGroups(target.ageGroups)} />
        </dl>
      </ReviewSection>

      <ReviewSection
        campaignId={campaignId}
        isComplete={isBudgetComplete}
        step={findStep('budget')}
      >
        <dl className="mt-3 flex flex-col gap-2.5">
          <DetailRow
            label="하루 예산"
            value={
              budget.dailyBudget !== null && formatPoints(budget.dailyBudget)
            }
          />
          <DetailRow
            label="집행 기간"
            value={
              isBudgetComplete &&
              `${formatPeriod(budget.startDate, budget.endDate)} (${periodDays}일)`
            }
          />
        </dl>
      </ReviewSection>

      {isBudgetComplete && budget.dailyBudget !== null && (
        <PointSummary
          balance={balance}
          onRetry={retryBalance}
          requiredPoints={budget.dailyBudget * periodDays}
          step="review"
        />
      )}

      <p className="flex gap-1.5 rounded-xl bg-surface-subtle px-4 py-3 text-caption-mobile break-keep text-text-primary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-text-secondary"
        />
        활성화를 요청하면 대기 중 상태가 되고, 집행 시작일 00:00부터 피드에
        노출돼요.
      </p>
    </div>
  );
};
