import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CircleAlert, Info } from 'lucide-react';

import {
  type Campaign,
  getCampaigns,
  isBudgetStepComplete,
  isCouponStepComplete,
  ISSUE_OPEN_TIME,
  isValidTarget,
  SERVING_TIME_END,
  SERVING_TIME_START,
} from '@owner/api/campaign';
import { getPointBalance, type PointBalance } from '@owner/api/points';
import {
  getPosterTemplates,
  isPosterComplete,
  type PosterTemplate,
} from '@owner/api/poster';
import { getMyStore, type StoreMenu } from '@owner/api/store';
import {
  formatAgeGroups,
  formatDiscount,
  formatGender,
  formatNumber,
  formatPeriod,
  formatPoints,
  formatRadius,
  getPeriodDays,
} from '@owner/features/campaign/campaignFormat';
import { DetailRow } from '@owner/features/campaign/detail/DetailSection';
import {
  type CampaignStep,
  campaignSteps,
  getCampaignEditPath,
} from '@owner/features/campaign/form/campaignSteps';
import { PointSummary } from '@owner/features/campaign/form/PointSummary';
import { useCampaignForm } from '@owner/features/campaign/form/useCampaignForm';
import { PosterPreview } from '@owner/features/campaign/PosterPreview';

const POSTER_PREVIEW_WIDTH = 200;

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

interface ReviewSectionProps {
  step: CampaignStep;
  campaignId: string;
  isComplete: boolean;
  children: ReactNode;
}

// 단계별 입력 요약 카드. 제목 옆 수정 링크로 그 단계로 돌아간다
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

// 등록 5단계: 앞 단계 입력을 한눈에 확인하고, 잔액과 진행 중인 캠페인을 안내한 뒤 활성화를 요청한다
export const ReviewStep = () => {
  const { campaignId, platformSettings, values } = useCampaignForm();
  const { budget, coupon, poster, target } = values;
  const [menus, setMenus] = useState<StoreMenu[]>([]);
  const [templates, setTemplates] = useState<PosterTemplate[]>([]);
  const [balance, setBalance] = useState<Loadable<PointBalance>>();
  const [runningCampaign, setRunningCampaign] = useState<Campaign>();

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore && result.ok) {
        setMenus(result.data.menus);
      }
    });
    getPosterTemplates().then((result) => {
      if (!ignore && result.ok) {
        setTemplates(result.data);
      }
    });
    getPointBalance().then((result) => {
      if (!ignore) {
        setBalance(result.ok ? result.data : null);
      }
    });
    // 가게당 집행 중인 캠페인은 1건이라, 이 캠페인이 시작되면 기존 캠페인은 종료된다
    getCampaigns().then((result) => {
      if (!ignore && result.ok) {
        setRunningCampaign(
          result.data.find(
            ({ id, status }) =>
              id !== campaignId && (status === 'ACTIVE' || status === 'PAUSED'),
          ),
        );
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  const menu = menus.find(({ id }) => id === coupon.menuId);
  const template = templates.find(({ id }) => id === poster?.templateId);
  const isBudgetComplete = isBudgetStepComplete(budget, platformSettings);
  const periodDays = isBudgetComplete
    ? getPeriodDays(budget.startDate, budget.endDate)
    : 0;

  return (
    <div className="flex flex-col gap-3 px-page">
      <p className="mb-2 text-body-sm-mobile break-keep text-text-secondary">
        입력한 내용을 확인하고 활성화를 요청해 주세요. 요청하면 포스터 자동
        검수를 거쳐요.
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
        </dl>
      </ReviewSection>

      <ReviewSection
        campaignId={campaignId}
        isComplete={isPosterComplete(poster)}
        step={findStep('poster')}
      >
        {poster && template ? (
          <div className="mt-3 flex justify-center">
            <div className="overflow-hidden rounded-lg border border-border-subtle">
              <PosterPreview
                html={template.html}
                slots={poster.slots}
                width={POSTER_PREVIEW_WIDTH}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-body-sm-mobile text-text-secondary">
            {poster
              ? '포스터를 불러오는 중이에요'
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
          <DetailRow
            label="노출 시간대"
            value={`점심 ${SERVING_TIME_START} ~ ${SERVING_TIME_END}`}
          />
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
          requiredPoints={budget.dailyBudget * periodDays}
        />
      )}

      {runningCampaign && (
        <p className="flex gap-1.5 rounded-xl bg-status-warning-bg px-4 py-3 text-caption-mobile break-keep text-text-primary">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-status-warning-fg"
          />
          지금 진행 중인 캠페인이 있어요. 가게마다 한 번에 하나만 노출되므로, 이
          캠페인이 시작되면 진행 중인 캠페인은 종료돼요.
        </p>
      )}

      <p className="flex gap-1.5 rounded-xl bg-surface-subtle px-4 py-3 text-caption-mobile break-keep text-text-primary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-text-secondary"
        />
        자동 검수를 통과하면 시작 대기 상태가 되고, 집행 시작일 00:00부터 피드에
        노출돼요. 통과하지 못하면 사유를 알려 드려요.
      </p>
    </div>
  );
};
