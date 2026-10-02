import { type ReactNode, useEffect, useState } from 'react';
import { Button, Input } from '@repo/ui';
import { CircleAlert, Sparkles } from 'lucide-react';

import {
  type BudgetRecommendation,
  type BudgetStepValues,
  DAILY_EXPOSURE_CAP,
  getBudgetRecommendation,
  getDateValueFromToday,
  isValidDailyBudget,
  isValidPeriod,
} from '@owner/api/campaign';
import { getPointBalance, type PointBalance } from '@owner/api/points';
import { DateRangePicker } from '@owner/components/DateRangePicker/DateRangePicker';
import {
  formatNumber,
  formatPoints,
  formatRadius,
  getPeriodDays,
} from '@owner/features/campaign/campaignFormat';
import { PointSummary } from '@owner/features/campaign/form/PointSummary';
import { useCampaignForm } from '@owner/features/campaign/form/useCampaignForm';

const BUDGET_MAX_DIGITS = 8;
// 신규 캠페인 우선 노출 기간과 같다 (docs/requirements-common.md "피드 구성")
const RECOMMENDED_MIN_DAYS = 3;

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

const toNumberOrNull = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, BUDGET_MAX_DIGITS);

  return digits ? Number(digits) : null;
};

interface FieldGroupProps {
  legend: string;
  description?: string;
  children: ReactNode;
}

const FieldGroup = ({ children, description, legend }: FieldGroupProps) => (
  <fieldset className="flex flex-col gap-3">
    <legend className="mb-3 text-body-mobile font-bold text-text-primary">
      {legend}
    </legend>
    {children}
    {description && (
      <p className="-mt-1 text-caption-mobile break-keep text-text-secondary">
        {description}
      </p>
    )}
  </fieldset>
);

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 text-body-sm-mobile">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="font-bold text-text-primary">{value}</dd>
  </div>
);

interface RecommendationCardProps {
  recommendation: Loadable<BudgetRecommendation>;
  radiusLabel: string;
  impressionUnitPrice: number;
  onApply: (dailyBudget: number) => void;
}

const RecommendationCard = ({
  impressionUnitPrice,
  onApply,
  radiusLabel,
  recommendation,
}: RecommendationCardProps) => {
  if (recommendation === undefined) {
    return (
      <div
        aria-busy="true"
        className="h-24 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
      >
        <span className="sr-only">추천 하루 예산을 계산하는 중</span>
      </div>
    );
  }

  if (recommendation === null) {
    return (
      <p className="rounded-xl bg-surface-subtle px-4 py-3 text-caption-mobile text-text-secondary">
        추천 하루 예산을 불러오지 못했어요. 직접 입력해 주세요.
      </p>
    );
  }

  return (
    <div className="rounded-xl bg-surface-brand p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-caption-mobile font-medium text-text-brand">
            <Sparkles aria-hidden="true" className="size-3.5" />
            추천 하루 예산
          </p>
          <p className="mt-0.5 text-h3-mobile font-bold text-text-primary">
            {formatPoints(recommendation.recommendedDailyBudget)}
          </p>
        </div>
        <Button
          onClick={() => onApply(recommendation.recommendedDailyBudget)}
          variant="secondary"
        >
          적용
        </Button>
      </div>
      <p className="mt-2 text-caption-mobile break-keep text-text-secondary">
        {recommendation.isBootstrap
          ? '주변 접속 기록이 아직 부족해 기본 추천값을 보여드려요.'
          : `반경 ${radiusLabel} 안 최근 7일 점심 접속자 중 조건에 맞는 ${formatNumber(recommendation.audienceCount)}명 × 하루 최대 ${DAILY_EXPOSURE_CAP}회 × 노출 단가 ${formatPoints(impressionUnitPrice)}`}
      </p>
    </div>
  );
};

interface EstimateCardProps {
  dailyBudget: number;
  impressionUnitPrice: number;
  recommendation: BudgetRecommendation;
}

// 입력한 하루 예산으로 살 수 있는 노출과, 조건에 맞는 사람이 하루에 받을 수 있는 노출을 비교해 보여준다
const EstimateCard = ({
  dailyBudget,
  impressionUnitPrice,
  recommendation,
}: EstimateCardProps) => {
  const maxImpressions = Math.floor(dailyBudget / impressionUnitPrice);
  const demandCap = recommendation.audienceCount * DAILY_EXPOSURE_CAP;
  const isOverDemand =
    !recommendation.isBootstrap && maxImpressions > demandCap;

  return (
    <section className="rounded-xl border border-border-subtle bg-bg-surface p-4">
      <h3 className="flex items-center gap-1.5 text-body-sm-mobile font-bold text-text-primary">
        예상 노출
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-caption-mobile font-medium text-text-secondary">
          예상
        </span>
      </h3>
      <dl className="mt-3 flex flex-col gap-2">
        <InfoRow
          label="하루 최대 노출 (예산 기준)"
          value={`${formatNumber(maxImpressions)}회`}
        />
        {!recommendation.isBootstrap && (
          <InfoRow
            label="노출 가능 인원 (최근 7일)"
            value={`${formatNumber(recommendation.audienceCount)}명`}
          />
        )}
        <InfoRow
          label="주변 경쟁 캠페인"
          value={`${formatNumber(recommendation.competingCampaignCount)}개`}
        />
      </dl>
      {isOverDemand && (
        <p className="mt-3 flex gap-1.5 rounded-lg bg-status-warning-bg px-3 py-2.5 text-caption-mobile break-keep text-text-primary">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0 text-status-warning-fg"
          />
          조건에 맞는 사람이 하루에 받을 수 있는 노출은 최대{' '}
          {formatNumber(demandCap)}회예요. 이보다 큰 예산은 다 쓰이지 않을 수
          있어요.
        </p>
      )}
      <p className="mt-3 text-caption-mobile break-keep text-text-secondary">
        예상치이며 최소 노출 수를 보장하지 않아요.
      </p>
    </section>
  );
};

// 등록 4단계: 하루 예산(추천값, 예상 노출)과 집행 기간, 필요 포인트와 잔액 비교
export const BudgetStep = () => {
  const { campaignId, platformSettings, updateStepValues, values } =
    useCampaignForm();
  const { budget, target } = values;
  const [recommendation, setRecommendation] =
    useState<Loadable<BudgetRecommendation>>();
  const [balance, setBalance] = useState<Loadable<PointBalance>>();
  const tomorrow = getDateValueFromToday(1);

  useEffect(() => {
    let ignore = false;

    // 추천값은 저장된 노출 대상(3단계)으로 계산하므로 이 단계에 들어올 때마다 다시 불러온다
    getBudgetRecommendation(campaignId).then((result) => {
      if (!ignore) {
        setRecommendation(result.ok ? result.data : null);
      }
    });
    getPointBalance().then((result) => {
      if (!ignore) {
        setBalance(result.ok ? result.data : null);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  const update = (patch: Partial<BudgetStepValues>) =>
    updateStepValues('budget', patch);

  const { impressionUnitPrice, minDailyBudget } = platformSettings;
  const hasBudget = isValidDailyBudget(budget.dailyBudget, platformSettings);
  const hasPeriod = isValidPeriod(budget);
  const periodDays = hasPeriod
    ? getPeriodDays(budget.startDate, budget.endDate)
    : 0;
  const budgetError =
    budget.dailyBudget !== null && !hasBudget
      ? `하루 예산은 최소 ${formatPoints(minDailyBudget)}부터 정할 수 있어요`
      : undefined;
  // 저장해 둔 시작일이 그사이 지나 버린 경우
  const isStartDatePast =
    Boolean(budget.startDate) && budget.startDate < tomorrow;

  return (
    <div className="flex flex-col gap-8 px-page">
      <FieldGroup legend="하루 예산">
        <Input
          aria-label="하루 예산"
          errorMessage={budgetError}
          inputMode="numeric"
          onChange={(event) =>
            update({ dailyBudget: toNumberOrNull(event.target.value) })
          }
          placeholder={`최소 ${formatNumber(minDailyBudget)}`}
          trailing="P"
          value={
            budget.dailyBudget === null ? '' : formatNumber(budget.dailyBudget)
          }
        />
        {/* 아래 추천·예상 카드보다 먼저, 입력칸 바로 밑에 규칙을 보여준다 */}
        <p className="-mt-1 text-caption-mobile break-keep text-text-secondary">
          하루 예산은 매일 00:00에 다시 채워지고, 남은 포인트는 다음 날로
          넘어가지 않아요.
        </p>
        <RecommendationCard
          impressionUnitPrice={impressionUnitPrice}
          onApply={(dailyBudget) => update({ dailyBudget })}
          radiusLabel={formatRadius(target.radius)}
          recommendation={recommendation}
        />
        {hasBudget && budget.dailyBudget !== null && recommendation && (
          <EstimateCard
            dailyBudget={budget.dailyBudget}
            impressionUnitPrice={impressionUnitPrice}
            recommendation={recommendation}
          />
        )}
      </FieldGroup>

      <FieldGroup
        description="활성화한 뒤에는 집행 기간을 바꿀 수 없어요. 시작일 전날 23:59까지 활성화를 요청해야 시작일부터 노출돼요."
        legend="집행 기간"
      >
        <DateRangePicker
          ariaLabel="집행 기간 선택"
          minDate={tomorrow}
          onValueChange={({ endDate, startDate }) =>
            update({ endDate, startDate })
          }
          placeholder="시작일과 종료일을 골라 주세요"
          value={{ endDate: budget.endDate, startDate: budget.startDate }}
        />
        {isStartDatePast && (
          <p
            className="-mt-1 text-caption-mobile text-status-danger-fg"
            role="alert"
          >
            시작일이 지났어요. 내일 이후로 다시 골라 주세요.
          </p>
        )}
        {hasPeriod && (
          <p className="-mt-1 text-caption-mobile font-medium text-text-primary">
            총 {periodDays}일 동안 노출돼요
          </p>
        )}
        {hasPeriod && periodDays < RECOMMENDED_MIN_DAYS && (
          <p className="flex gap-1.5 rounded-lg bg-status-warning-bg px-3 py-2.5 text-caption-mobile break-keep text-text-primary">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-status-warning-fg"
            />
            새 캠페인은 처음 {RECOMMENDED_MIN_DAYS}일 동안 우선 노출돼요. 집행
            기간은 {RECOMMENDED_MIN_DAYS}일 이상을 권장해요.
          </p>
        )}
      </FieldGroup>

      {hasBudget && hasPeriod && budget.dailyBudget !== null && (
        <PointSummary
          balance={balance}
          requiredPoints={budget.dailyBudget * periodDays}
        />
      )}
    </div>
  );
};
