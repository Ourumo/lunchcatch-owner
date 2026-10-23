// 하루 예산 입력은 숫자만 받고 최대 8자리까지 둔다. 등록 4단계와 하루 예산 변경 시트가 같이 쓴다
const BUDGET_MAX_DIGITS = 8;

// 입력값에서 숫자만 남겨 포인트로 바꾼다. 비우면 null
export const toDailyBudgetOrNull = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, BUDGET_MAX_DIGITS);

  return digits ? Number(digits) : null;
};
