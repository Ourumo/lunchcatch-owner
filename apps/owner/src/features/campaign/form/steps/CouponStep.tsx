import { type ReactNode, useEffect, useId, useState } from 'react';
import { Input, SegmentedControl } from '@repo/ui';
import { Info, Minus, Plus } from 'lucide-react';

import {
  type CouponStepValues,
  type DiscountTarget,
  type DiscountType,
  getUsableMinutes,
  getUsableTimeSlots,
  ISSUE_OPEN_TIME,
  isValidDiscountValue,
  MIN_USABLE_MINUTES,
  USABLE_TIME_END,
  USABLE_TIME_START,
  USABLE_TIME_STEP_MINUTES,
} from '@owner/api/campaign';
import { getMyStore, type StoreMenu } from '@owner/api/store';
import { formatNumber } from '@owner/features/campaign/campaignFormat';
import { useCampaignForm } from '@owner/features/campaign/form/useCampaignForm';

const AMOUNT_MAX_DIGITS = 7;
const ISSUE_LIMIT_MAX_DIGITS = 4;
const ISSUE_LIMIT_MAX = 10 ** ISSUE_LIMIT_MAX_DIGITS - 1;
// 수량 빠른 조정 버튼에 0(초기화) 다음으로 이 순서대로 보여준다
const ISSUE_LIMIT_QUICK_STEPS = [-10, -5, 5, 10, 30];

const discountTargetItems: { value: DiscountTarget; label: string }[] = [
  { value: 'ALL', label: '전체 메뉴' },
  { value: 'MENU', label: '특정 메뉴' },
];

const discountTypeItems: { value: DiscountType; label: string }[] = [
  { value: 'PERCENT', label: '퍼센트(%) 할인' },
  { value: 'AMOUNT', label: '금액(원) 할인' },
];

// 숫자만 남겨 정수로 바꾼다. 비우면 null(미입력)
const toNumberOrNull = (value: string, maxDigits: number) => {
  const digits = value.replace(/\D/g, '').slice(0, maxDigits);

  return digits ? Number(digits) : null;
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
};

const getDiscountedPrice = (
  price: number,
  { discountType, discountValue }: CouponStepValues,
) => {
  if (discountValue === null) {
    return null;
  }

  return discountType === 'PERCENT'
    ? Math.round((price * (100 - discountValue)) / 100)
    : price - discountValue;
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

interface MenuOptionsProps {
  menus: StoreMenu[] | null;
  selectedMenuId: string | null;
  onSelect: (menuId: string) => void;
}

// 입점 때 등록한 대표 메뉴 중 할인할 메뉴 하나를 고른다
const MenuOptions = ({ menus, onSelect, selectedMenuId }: MenuOptionsProps) => {
  const name = useId();

  if (!menus) {
    return (
      <p aria-busy="true" className="text-caption-mobile text-text-secondary">
        대표 메뉴를 불러오는 중이에요
      </p>
    );
  }

  if (menus.length === 0) {
    return (
      <p className="text-caption-mobile text-status-danger-fg">
        대표 메뉴를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {menus.map((menu) => (
        <label className="cursor-pointer" key={menu.id}>
          <input
            checked={selectedMenuId === menu.id}
            className="peer sr-only"
            name={name}
            onChange={() => onSelect(menu.id)}
            type="radio"
            value={menu.id}
          />
          <span className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-surface px-3.5 py-3 transition-colors peer-checked:border-action-primary peer-checked:bg-surface-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary peer-checked:[&>.radio]:border-action-primary peer-checked:[&>.radio>span]:opacity-100">
            <span className="radio flex size-5 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-surface">
              <span className="size-2.5 rounded-full bg-action-primary opacity-0" />
            </span>
            <span className="min-w-0 flex-1 truncate text-body-sm-mobile font-medium text-text-primary">
              {menu.name}
            </span>
            <span className="shrink-0 text-body-sm-mobile text-text-secondary">
              {formatNumber(menu.price)}원
            </span>
          </span>
        </label>
      ))}
    </div>
  );
};

interface IssueLimitStepperProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

const IssueLimitStepper = ({ onChange, value }: IssueLimitStepperProps) => {
  const current = value ?? 0;
  const buttonClassName =
    'flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-brand text-action-primary transition-colors hover:bg-brand-200 focus-visible:outline-2 focus-visible:outline-action-primary disabled:bg-surface-subtle disabled:text-text-disabled';
  const quickButtonClassName =
    'flex h-9 min-w-0 items-center justify-center rounded-full border text-caption-mobile font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-subtle disabled:text-text-disabled';

  // 0 아래로는 내려가지 않고, 0이 되면 미입력(null)으로 둔다
  const adjust = (delta: number) => {
    const next = Math.min(ISSUE_LIMIT_MAX, Math.max(0, current + delta));

    onChange(next === 0 ? null : next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface p-1.5">
        <button
          aria-label="1장 줄이기"
          className={buttonClassName}
          disabled={current <= 0}
          onClick={() => adjust(-1)}
          type="button"
        >
          <Minus aria-hidden="true" className="size-5" />
        </button>
        <label className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <span className="sr-only">하루 선착순 수량</span>
          <input
            className="w-16 bg-transparent text-right text-h3-mobile font-bold text-text-primary placeholder:text-text-disabled focus:outline-none"
            inputMode="numeric"
            onChange={(event) =>
              onChange(
                toNumberOrNull(event.target.value, ISSUE_LIMIT_MAX_DIGITS),
              )
            }
            placeholder="0"
            value={value ?? ''}
          />
          <span className="text-body-mobile text-text-primary">장</span>
        </label>
        <button
          aria-label="1장 늘리기"
          className={buttonClassName}
          disabled={current >= ISSUE_LIMIT_MAX}
          onClick={() => adjust(1)}
          type="button"
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>
      {/* 큰 단위로 빠르게 맞추는 버튼. 위 ± 버튼은 1장씩 미세 조정한다 */}
      <div className="grid grid-cols-6 gap-1.5">
        <button
          aria-label="수량 0으로 초기화"
          className={`${quickButtonClassName} border-border-subtle bg-bg-surface text-text-secondary hover:bg-surface-subtle`}
          disabled={value === null}
          onClick={() => onChange(null)}
          type="button"
        >
          0
        </button>
        {ISSUE_LIMIT_QUICK_STEPS.map((delta) => {
          const isDecrease = delta < 0;

          return (
            <button
              aria-label={`${Math.abs(delta)}장 ${isDecrease ? '줄이기' : '늘리기'}`}
              className={`${quickButtonClassName} ${
                isDecrease
                  ? 'border-border-subtle bg-bg-surface text-text-primary hover:bg-surface-subtle'
                  : 'border-brand-200 bg-surface-brand text-text-brand hover:bg-brand-200'
              }`}
              disabled={isDecrease ? current <= 0 : current >= ISSUE_LIMIT_MAX}
              key={delta}
              onClick={() => adjust(delta)}
              type="button"
            >
              {isDecrease ? `−${Math.abs(delta)}` : `+${delta}`}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface UsableTimeFieldProps {
  from: string;
  until: string;
  onChange: (range: { usableFrom: string; usableUntil: string }) => void;
}

// 막대 위에 눈금 시각을 보여줄 칸. 11:30과 12:00은 붙어 있어 12:00은 생략한다
const TIME_LABELS = [USABLE_TIME_START, '13:00', '14:00', USABLE_TIME_END];

// 두 손잡이를 겹친 range input. 막대는 손잡이만 잡을 수 있고, 키보드 화살표로도 30분씩 움직인다
const rangeInputClassName = [
  'pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent focus:outline-none',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[6px] [&::-webkit-slider-thumb]:border-action-primary [&::-webkit-slider-thumb]:bg-bg-surface [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(36,36,36,0.2)] active:[&::-webkit-slider-thumb]:cursor-grabbing focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_var(--color-brand-200)]',
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[6px] [&::-moz-range-thumb]:border-action-primary [&::-moz-range-thumb]:bg-bg-surface [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(36,36,36,0.2)] focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_4px_var(--color-brand-200)] [&::-moz-range-track]:bg-transparent',
].join(' ');

// 허용 범위(11:30~15:00) 막대에서 시작과 종료 손잡이를 끌어 30분 단위로 고른다.
// 두 손잡이는 1시간보다 가까워지지 않아, 범위 밖이거나 1시간 미만인 구간은 만들 수 없다
const UsableTimeField = ({ from, onChange, until }: UsableTimeFieldProps) => {
  const slots = getUsableTimeSlots();
  const lastIndex = slots.length - 1;
  const minGap = MIN_USABLE_MINUTES / USABLE_TIME_STEP_MINUTES;
  const fromIndex = Math.max(0, slots.indexOf(from));
  const untilIndex = Math.max(0, slots.indexOf(until));
  const toPercent = (index: number) => (index / lastIndex) * 100;

  const handleFromChange = (index: number) => {
    onChange({
      usableFrom: slots[Math.min(index, untilIndex - minGap)],
      usableUntil: until,
    });
  };

  const handleUntilChange = (index: number) => {
    onChange({
      usableFrom: from,
      usableUntil: slots[Math.max(index, fromIndex + minGap)],
    });
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        {/* 길이 문구(1시간 ~ 3시간 30분)는 글자 수가 바뀌므로 왼쪽에 두어, 오른쪽 시각이 손잡이를 움직일 때 밀리지 않게 한다 */}
        <span className="text-caption-mobile text-text-secondary">
          적용 시간대 ·{' '}
          <span className="font-medium text-text-primary">
            {formatDuration(getUsableMinutes(from, until))}
          </span>
        </span>
        <span className="text-body-mobile font-bold whitespace-nowrap text-text-brand tabular-nums">
          {from} ~ {until}
        </span>
      </div>
      <div className="relative mt-4 h-7">
        {/* 손잡이 반지름(14px)만큼 안쪽에 막대를 그려 손잡이 중심과 눈금 위치를 맞춘다 */}
        <div
          aria-hidden="true"
          className="absolute inset-x-3.5 top-1/2 h-2 -translate-y-1/2 rounded-full bg-surface-subtle"
        >
          <div
            className="absolute inset-y-0 rounded-full bg-action-primary"
            style={{
              left: `${toPercent(fromIndex)}%`,
              width: `${toPercent(untilIndex - fromIndex)}%`,
            }}
          />
          {slots.map((slot, index) => (
            <span
              className={`absolute top-1/2 size-1 -translate-1/2 rounded-full ${
                index > fromIndex && index < untilIndex
                  ? 'bg-bg-surface/70'
                  : 'bg-text-disabled'
              }`}
              key={slot}
              style={{ left: `${toPercent(index)}%` }}
            />
          ))}
        </div>
        <input
          aria-label="사용 시작 시각"
          aria-valuetext={from}
          className={rangeInputClassName}
          max={lastIndex}
          min={0}
          onChange={(event) => handleFromChange(Number(event.target.value))}
          step={1}
          type="range"
          value={fromIndex}
        />
        <input
          aria-label="사용 종료 시각"
          aria-valuetext={until}
          className={rangeInputClassName}
          max={lastIndex}
          min={0}
          onChange={(event) => handleUntilChange(Number(event.target.value))}
          step={1}
          type="range"
          value={untilIndex}
        />
      </div>
      <div
        aria-hidden="true"
        className="relative mx-3.5 mt-2 h-4 text-caption-mobile text-text-secondary"
      >
        {TIME_LABELS.map((label) => (
          <span
            className="absolute -translate-x-1/2"
            key={label}
            style={{ left: `${toPercent(slots.indexOf(label))}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

// 등록 1단계: 할인 대상, 할인 유형과 값, 하루 선착순 수량, 사용 가능 시간
export const CouponStep = () => {
  const { updateStepValues, values } = useCampaignForm();
  const { coupon } = values;
  const [menus, setMenus] = useState<StoreMenu[] | null>(null);

  useEffect(() => {
    let ignore = false;

    getMyStore().then((result) => {
      if (!ignore) {
        setMenus(result.ok ? result.data.menus : []);
      }
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const update = (patch: Partial<CouponStepValues>) =>
    updateStepValues('coupon', patch);

  const selectedMenu =
    coupon.discountTarget === 'MENU'
      ? menus?.find((menu) => menu.id === coupon.menuId)
      : undefined;
  const discountedPrice =
    selectedMenu && isValidDiscountValue(coupon)
      ? getDiscountedPrice(selectedMenu.price, coupon)
      : null;
  const isPercent = coupon.discountType === 'PERCENT';
  const discountError =
    coupon.discountValue !== null && !isValidDiscountValue(coupon)
      ? isPercent
        ? '할인율은 1~100% 사이로 입력해 주세요'
        : '할인 금액은 1원 이상 입력해 주세요'
      : undefined;

  return (
    <div className="flex flex-col gap-8 px-page">
      <FieldGroup legend="할인 대상">
        <SegmentedControl
          ariaLabel="할인 대상"
          items={discountTargetItems}
          onValueChange={(discountTarget) =>
            // 전체 메뉴로 바꾸면 골라 둔 메뉴는 쓰지 않으므로 비운다
            update({
              discountTarget,
              menuId: discountTarget === 'ALL' ? null : coupon.menuId,
            })
          }
          value={coupon.discountTarget}
        />
        {coupon.discountTarget === 'MENU' && (
          <MenuOptions
            menus={menus}
            onSelect={(menuId) => update({ menuId })}
            selectedMenuId={coupon.menuId}
          />
        )}
      </FieldGroup>

      <FieldGroup legend="할인">
        <SegmentedControl
          ariaLabel="할인 유형"
          items={discountTypeItems}
          onValueChange={(discountType) =>
            // 단위가 달라 입력한 값을 그대로 쓰면 뜻이 바뀌므로 비운다
            update({
              discountType,
              discountValue:
                discountType === coupon.discountType
                  ? coupon.discountValue
                  : null,
            })
          }
          value={coupon.discountType}
        />
        <Input
          aria-label={isPercent ? '할인율' : '할인 금액'}
          errorMessage={discountError}
          inputMode="numeric"
          onChange={(event) =>
            update({
              discountValue: toNumberOrNull(
                event.target.value,
                isPercent ? 3 : AMOUNT_MAX_DIGITS,
              ),
            })
          }
          placeholder={isPercent ? '예) 20' : '예) 2,000'}
          trailing={isPercent ? '%' : '원'}
          value={
            coupon.discountValue === null
              ? ''
              : isPercent
                ? String(coupon.discountValue)
                : formatNumber(coupon.discountValue)
          }
        />
        {selectedMenu && discountedPrice !== null && (
          <p
            className={`-mt-1 text-caption-mobile ${
              discountedPrice <= 0
                ? 'text-status-danger-fg'
                : 'text-text-secondary'
            }`}
          >
            {discountedPrice <= 0
              ? '할인 금액이 메뉴 가격과 같거나 커요. 금액을 다시 확인해 주세요.'
              : `${selectedMenu.name} ${formatNumber(selectedMenu.price)}원 → ${formatNumber(discountedPrice)}원`}
          </p>
        )}
      </FieldGroup>

      <FieldGroup
        description="매일 선착순으로 이 수량만큼 발급되고, 다음 날 다시 채워져요."
        legend="하루 선착순 수량"
      >
        <IssueLimitStepper
          onChange={(issueLimit) => update({ issueLimit })}
          value={coupon.issueLimit}
        />
      </FieldGroup>

      <FieldGroup
        description={`${USABLE_TIME_START}~${USABLE_TIME_END} 사이에서 30분 단위로, 최소 1시간 이상 골라 주세요.`}
        legend="사용 가능 시간"
      >
        <UsableTimeField
          from={coupon.usableFrom}
          onChange={update}
          until={coupon.usableUntil}
        />
      </FieldGroup>

      <p className="-mt-4 flex items-center gap-1.5 rounded-xl bg-surface-brand px-4 py-3 text-caption-mobile font-medium text-text-brand">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        선착순 오픈은 매일 {ISSUE_OPEN_TIME}이에요
      </p>
    </div>
  );
};
