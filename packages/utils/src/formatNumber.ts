export interface NumberFormatOptions {
  signed?: boolean;
}

type NumberValue = number | null | undefined;

const emptyValue = '—';
const numberFormatter = new Intl.NumberFormat('ko-KR');
const signedNumberFormatter = new Intl.NumberFormat('ko-KR', {
  signDisplay: 'exceptZero',
});

/** 숫자는 한국어 천 단위 구분자로, 미확정 값은 0 대신 대시로 표시한다. */
export const formatNumber = (
  value: NumberValue,
  { signed = false }: NumberFormatOptions = {},
): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return emptyValue;
  return (signed ? signedNumberFormatter : numberFormatter).format(value);
};

const formatWithUnit = (
  value: NumberValue,
  unit: string,
  options?: NumberFormatOptions,
) => {
  const formatted = formatNumber(value, options);
  return formatted === emptyValue ? emptyValue : `${formatted} ${unit}`;
};

export const formatPoints = (
  value: NumberValue,
  options?: NumberFormatOptions,
) => formatWithUnit(value, 'P', options);

export const formatWon = (value: NumberValue, options?: NumberFormatOptions) =>
  formatWithUnit(value, '원', options);
