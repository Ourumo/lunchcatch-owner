// 대표 메뉴 가격 입력 정리. 입점 등록의 메뉴 시트·목록이 함께 쓴다

// 입력값에서 숫자만 남긴다. 앞의 0은 지우고 최댓값 자릿수를 넘는 입력은 자른다
export const toPriceDigits = (value: string, maxDigits: number) =>
  value.replace(/\D/g, '').replace(/^0+/, '').slice(0, maxDigits);

// 12000 → 12,000
export const formatPriceDigits = (digits: string) =>
  digits ? Number(digits).toLocaleString('ko-KR') : '';
