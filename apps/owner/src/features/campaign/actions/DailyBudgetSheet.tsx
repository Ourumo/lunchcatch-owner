import { useEffect, useState } from 'react';
import { BottomSheet, Button, Input } from '@repo/ui';
import { Info } from 'lucide-react';

import { isValidDailyBudget } from '@owner/api/campaign';
import {
  getPlatformSettings,
  type PlatformSettings,
} from '@owner/api/platform';
import { formatNumber, formatPoints } from '@owner/ui/campaignFormat';

import { toDailyBudgetOrNull } from '../dailyBudgetInput';
import type { CampaignActionResult } from './CampaignActionSheet';

const DEFAULT_ERROR_MESSAGE = '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

export interface DailyBudgetSheetProps {
  // 지금 적용 중인 하루 예산
  currentDailyBudget: number;
  onSave: (dailyBudget: number) => Promise<CampaignActionResult>;
  onClose: () => void;
}

// 진행 중 캠페인의 하루 예산 변경 시트. 입력 규칙은 등록 4단계와 같다.
// 바꾼 값은 다음 날 00:00부터 적용되고, 서버가 예약해 둔 값을 주지 않아 다시 열면 지금 하루 예산으로 보인다.
// 열 때마다 새로 그려 입력과 오류 문구를 초기화하므로 열려 있을 때만 렌더링한다
export const DailyBudgetSheet = ({
  currentDailyBudget,
  onClose,
  onSave,
}: DailyBudgetSheetProps) => {
  const [dailyBudget, setDailyBudget] = useState<number | null>(
    currentDailyBudget,
  );
  const [settings, setSettings] = useState<PlatformSettings>();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let ignore = false;

    getPlatformSettings().then((result) => {
      if (!ignore && result.ok) {
        setSettings(result.data);
      }
    });

    // 응답 전에 시트를 닫으면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const isValid =
    settings !== undefined && isValidDailyBudget(dailyBudget, settings);
  const isSame = dailyBudget === currentDailyBudget;
  const budgetError =
    settings && dailyBudget !== null && !isValid
      ? `하루 예산은 최소 ${formatPoints(settings.minDailyBudget)}부터 정할 수 있어요`
      : undefined;

  const handleSave = async () => {
    if (dailyBudget === null) {
      return;
    }

    setIsPending(true);
    setErrorMessage(undefined);

    const result = await onSave(dailyBudget);

    setIsPending(false);

    if (result.ok) {
      onClose();
      return;
    }

    setErrorMessage(result.message ?? DEFAULT_ERROR_MESSAGE);
  };

  return (
    // 처리 중에는 배경, 드래그, Esc로 닫지 않는다
    <BottomSheet
      closeOnBackdrop={!isPending}
      isOpen
      onClose={() => {
        if (!isPending) {
          onClose();
        }
      }}
      title="하루 예산 변경"
    >
      <dl className="flex items-baseline justify-between gap-3 text-body-sm-mobile">
        <dt className="text-text-secondary">지금 하루 예산</dt>
        <dd className="font-bold text-text-primary">
          {formatPoints(currentDailyBudget)}
        </dd>
      </dl>

      <div className="mt-4">
        <Input
          errorMessage={budgetError}
          helperText={isSame ? '지금과 다른 금액을 입력해 주세요' : undefined}
          inputMode="numeric"
          label="새 하루 예산"
          onChange={(event) =>
            setDailyBudget(toDailyBudgetOrNull(event.target.value))
          }
          placeholder={
            settings ? `최소 ${formatNumber(settings.minDailyBudget)}` : ''
          }
          trailing="P"
          value={dailyBudget === null ? '' : formatNumber(dailyBudget)}
        />
      </div>

      <p className="mt-4 flex gap-1.5 rounded-lg bg-surface-subtle px-3 py-2.5 text-caption-mobile break-keep text-text-primary">
        <Info
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-text-secondary"
        />
        바꾼 하루 예산은 내일 00:00부터 적용돼요. 그 전까지는 지금 하루 예산으로
        보여요. 다시 저장하면 마지막 값이 적용돼요.
      </p>

      {errorMessage && (
        <p
          className="mt-3 text-center text-body-sm-mobile break-keep text-status-danger-fg"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <Button
          className="h-12 flex-1"
          disabled={isPending}
          onClick={onClose}
          variant="neutral"
        >
          닫기
        </Button>
        <Button
          className="h-12 flex-1"
          disabled={!isValid || isSame}
          isLoading={isPending}
          onClick={handleSave}
        >
          저장
        </Button>
      </div>
    </BottomSheet>
  );
};
