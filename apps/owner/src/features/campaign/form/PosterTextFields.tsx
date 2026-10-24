import { useId } from 'react';
import { Input } from '@repo/ui';
import { Lock, TriangleAlert } from 'lucide-react';

import {
  countPosterTextLength,
  hasDiscountAmountText,
  POSTER_TEXT_RULES,
  type PosterTextValues,
  toPosterTextInput,
} from '@owner/api/poster';

interface FontSizeStepperProps {
  label: string;
  // null이면 템플릿이 px로 정하지 않아 크기를 모른다
  value: number | null;
  rule: {
    minFontSizePx: number;
    maxFontSizePx: number;
    defaultFontSizePx: number;
  };
  onChange: (value: number) => void;
}

// 글자 크기를 2px씩 바꾼다. 크기를 모르면 "기본"으로 보여주고, 처음 누를 때 대표 크기에서 시작한다
const FontSizeStepper = ({
  label,
  onChange,
  rule,
  value,
}: FontSizeStepperProps) => {
  const step = (delta: number) => {
    if (value === null) {
      onChange(rule.defaultFontSizePx);
      return;
    }

    onChange(
      Math.min(rule.maxFontSizePx, Math.max(rule.minFontSizePx, value + delta)),
    );
  };
  // 범위 끝이면 그쪽으로는 더 바꿀 수 없어 막는다. 비활성 색은 공통 버튼과 같다
  const buttonClassName =
    'flex h-9 w-11 items-center justify-center rounded-md border border-border-subtle bg-bg-surface font-bold text-text-primary transition-colors enabled:hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:cursor-not-allowed disabled:bg-action-primary-disabled disabled:text-action-disabled-fg';

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-caption-mobile text-text-secondary">글자 크기</span>
      <div className="flex items-center gap-1">
        <button
          aria-label={`${label} 글자 작게`}
          className={`${buttonClassName} text-caption-mobile`}
          disabled={value !== null && value <= rule.minFontSizePx}
          onClick={() => step(-2)}
          type="button"
        >
          가−
        </button>
        <span
          aria-live="polite"
          className="w-14 text-center text-body-sm-mobile font-bold text-text-primary"
        >
          {value === null ? '기본' : `${value}px`}
        </span>
        <button
          aria-label={`${label} 글자 크게`}
          className={`${buttonClassName} text-body-mobile`}
          disabled={value !== null && value >= rule.maxFontSizePx}
          onClick={() => step(2)}
          type="button"
        >
          가+
        </button>
      </div>
    </div>
  );
};

interface CountedLabelProps {
  htmlFor: string;
  label: string;
  optional?: boolean;
  count: number;
  maxLength: number;
  isInvalid?: boolean;
}

const CountedLabel = ({
  count,
  htmlFor,
  label,
  isInvalid = false,
  maxLength,
  optional = false,
}: CountedLabelProps) => (
  <div className="flex items-baseline justify-between">
    <label
      className="text-body-sm-mobile font-semibold text-text-primary"
      htmlFor={htmlFor}
    >
      {label}
      {optional && (
        <span className="font-normal text-text-secondary"> (선택)</span>
      )}
    </label>
    <span
      className={`text-caption-mobile ${isInvalid ? 'text-status-danger-fg' : 'text-text-secondary'}`}
    >
      {count}/{maxLength}
    </span>
  </div>
);

export interface PosterTextFieldsProps {
  // 지금 포스터에 들어가는 값. 고치지 않은 칸은 가게 이름, 빈 문구, 템플릿 크기로 채워 넘긴다
  value: PosterTextValues;
  storeName: string;
  // 쿠폰 조건으로 만든 할인 기본 문구. 고칠 수 없다
  baseDiscountText: string;
  // 쿠폰 사용 시간. 고칠 수 없다
  periodText: string;
  onChange: (patch: Partial<PosterTextValues>) => void;
}

// 등록 2단계의 포스터 문구 편집. 가게명은 글과 크기를, 할인은 기본 문구 뒤에 붙일 말과 크기를 고친다.
// 시간과 이미지는 고칠 수 없다. 고친 값은 미리보기에 바로 보이고 "다음"에서 저장한다
export const PosterTextFields = ({
  baseDiscountText,
  onChange,
  periodText,
  storeName,
  value,
}: PosterTextFieldsProps) => {
  const eventNameId = useId();
  const suffixId = useId();
  const suffixWarningId = useId();
  const { discount, eventName } = POSTER_TEXT_RULES;
  const isEventNameEmpty =
    countPosterTextLength(value.eventName.trim()) < eventName.minLength;
  const hasAmountText = hasDiscountAmountText(value.discountSuffix);

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-bg-surface p-4">
      <h3 className="text-body-mobile font-bold text-text-primary">
        포스터 문구
      </h3>

      <div className="flex flex-col gap-2">
        <CountedLabel
          count={countPosterTextLength(value.eventName)}
          htmlFor={eventNameId}
          isInvalid={isEventNameEmpty}
          label="가게명"
          maxLength={eventName.maxLength}
        />
        <Input
          errorMessage={
            isEventNameEmpty ? '가게명을 1자 이상 입력해 주세요' : undefined
          }
          id={eventNameId}
          onChange={(event) =>
            onChange({
              eventName: toPosterTextInput(
                event.target.value,
                eventName.maxLength,
              ),
            })
          }
          placeholder="가게명을 입력해 주세요"
          value={value.eventName}
        />
        <FontSizeStepper
          label="가게명"
          onChange={(size) => onChange({ eventNameFontSizePx: size })}
          rule={eventName}
          value={value.eventNameFontSizePx}
        />
        {value.eventName !== storeName && (
          <button
            className="self-start rounded-sm py-1 text-caption-mobile font-semibold text-text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
            onClick={() => onChange({ eventName: storeName })}
            type="button"
          >
            가게 이름으로 되돌리기
          </button>
        )}
      </div>

      <div className="h-px bg-surface-subtle" />

      <div className="flex flex-col gap-2">
        <span className="text-body-sm-mobile font-semibold text-text-primary">
          할인 문구
        </span>
        <p className="flex items-center gap-1.5 rounded-lg bg-surface-subtle px-3 py-2.5 text-body-sm-mobile break-keep text-text-primary">
          <Lock
            aria-hidden="true"
            className="size-3.5 shrink-0 text-text-secondary"
          />
          {baseDiscountText}
        </p>
        <p className="-mt-0.5 text-caption-mobile break-keep text-text-secondary">
          쿠폰 조건으로 자동으로 만들어요. 금액은 1단계에서 바꿔 주세요.
        </p>
        <div className="mt-1.5">
          <CountedLabel
            count={countPosterTextLength(value.discountSuffix)}
            htmlFor={suffixId}
            label="뒤에 붙일 문구"
            maxLength={discount.maxLength}
            optional
          />
        </div>
        <Input
          aria-describedby={hasAmountText ? suffixWarningId : undefined}
          id={suffixId}
          onChange={(event) =>
            onChange({
              discountSuffix: toPosterTextInput(
                event.target.value,
                discount.maxLength,
              ),
            })
          }
          placeholder="예: (1인 1개), 포장 가능"
          value={value.discountSuffix}
        />
        {hasAmountText && (
          <p
            className="flex gap-1.5 rounded-lg bg-status-warning-bg px-3 py-2.5 text-caption-mobile break-keep text-text-primary"
            id={suffixWarningId}
          >
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-status-warning-fg"
            />
            금액(원)이나 할인율(%)을 쓰면 쿠폰 조건과 다른 할인으로 보일 수
            있어요. 할인 금액은 1단계 쿠폰 조건에서 바꿔 주세요.
          </p>
        )}
        <FontSizeStepper
          label="할인 문구"
          onChange={(size) => onChange({ discountFontSizePx: size })}
          rule={discount}
          value={value.discountFontSizePx}
        />
      </div>

      <div className="h-px bg-surface-subtle" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-body-sm-mobile font-semibold text-text-primary">
            시간
          </span>
          <span className="text-body-sm-mobile text-text-primary">
            {periodText}
          </span>
        </div>
        <p className="text-caption-mobile break-keep text-text-secondary">
          쿠폰 사용 시간이 들어가요. 바꾸려면 1단계에서 사용 가능 시간을 고쳐
          주세요.
        </p>
      </div>
    </section>
  );
};
