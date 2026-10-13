import { MENU_PRICE_MAX } from '@owner/api/signupFlow';

// 입점 등록(features/signup/menuPrice)과 같다. 입력 화면을 공용 컴포넌트로 나누기 전까지 복사해 둔다
const PRICE_MAX_DIGITS = String(MENU_PRICE_MAX).length;

// 입력값에서 숫자만 남긴다. 최댓값 자릿수를 넘는 입력은 자른다
export const toPriceDigits = (value: string) =>
  value.replace(/\D/g, '').replace(/^0+/, '').slice(0, PRICE_MAX_DIGITS);

// 12000 → 12,000
export const formatPriceDigits = (digits: string) =>
  digits ? Number(digits).toLocaleString('ko-KR') : '';
