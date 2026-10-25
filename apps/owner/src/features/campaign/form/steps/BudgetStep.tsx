import { type ReactNode, useEffect, useState } from 'react';
import { Input } from '@repo/ui';
import { CircleAlert } from 'lucide-react';

import {
  type BudgetStepValues,
  getDateValueFromToday,
  isValidDailyBudget,
  isValidPeriod,
} from '@owner/api/campaign';
import { getPointBalance, type PointBalance } from '@owner/api/points';
import {
  formatNumber,
  formatPoints,
  getPeriodDays,
} from '@owner/ui/campaignFormat';
import { DateRangePicker } from '@owner/ui/DateRangePicker/DateRangePicker';

import { toDailyBudgetOrNull } from '../../dailyBudgetInput';
import { PointSummary } from '../PointSummary';
import { useCampaignForm } from '../useCampaignForm';

// 신규 캠페인 우선 노출 기간과 같다 (docs/requirements-common.md "피드 구성")
const RECOMMENDED_MIN_DAYS = 3;

// 불러오는 중이면 undefined, 실패하면 null
type Loadable<T> = T | null | undefined;

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

// 등록 4단계: 하루 예산과 집행 기간, 필요 포인트와 잔액 비교
export const BudgetStep = () => {
  const { platformSettings, updateStepValues, values } = useCampaignForm();
  const { budget } = values;
  const [balance, setBalance] = useState<Loadable<PointBalance>>();
  // 값이 바뀌면 잔액을 다시 불러온다
  const [balanceRequestId, setBalanceRequestId] = useState(0);
  const tomorrow = getDateValueFromToday(1);

  useEffect(() => {
    let ignore = false;

    getPointBalance().then((result) => {
      if (!ignore) {
        setBalance(result.ok ? result.data : null);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [balanceRequestId]);

  const retryBalance = () => {
    setBalance(undefined);
    setBalanceRequestId((id) => id + 1);
  };

  const update = (patch: Partial<BudgetStepValues>) =>
    updateStepValues('budget', patch);

  const { minDailyBudget } = platformSettings;
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
  // 같은 날을 시작일과 종료일로 고른 경우. 서버는 최소 2일(양 끝 포함)부터 받는다
  const isSameDayPeriod =
    Boolean(budget.startDate) && budget.startDate === budget.endDate;

  return (
    <div className="flex flex-col gap-8 px-page">
      <FieldGroup
        description="하루 예산은 매일 00:00에 다시 채워지고, 남은 포인트는 다음 날로 넘어가지 않아요."
        legend="하루 예산"
      >
        <Input
          aria-label="하루 예산"
          errorMessage={budgetError}
          inputMode="numeric"
          onChange={(event) =>
            update({ dailyBudget: toDailyBudgetOrNull(event.target.value) })
          }
          placeholder={`최소 ${formatNumber(minDailyBudget)}`}
          trailing="P"
          value={
            budget.dailyBudget === null ? '' : formatNumber(budget.dailyBudget)
          }
        />
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
        {isSameDayPeriod && (
          <p
            className="-mt-1 text-caption-mobile text-status-danger-fg"
            role="alert"
          >
            집행 기간은 2일 이상이어야 해요. 종료일을 시작일 다음 날 이후로 골라
            주세요.
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
          onRetry={retryBalance}
          requiredPoints={budget.dailyBudget * periodDays}
          step="budget"
        />
      )}
    </div>
  );
};
