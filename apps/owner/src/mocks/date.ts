// 시연 데이터의 날짜 계산. 캠페인 기간과 실적을 "접속한 날" 기준으로 만들어, 언제 열어도 진행 중인 캠페인이 보이게 한다.
// 서버처럼 한국 날짜(YYYY-MM-DD)로 계산한다. mocks는 api의 함수를 가져오지 않아 같은 계산을 따로 둔다

const DAY_MS = 24 * 60 * 60 * 1000;

// 한국은 서머타임이 없어 UTC와 늘 9시간 차이다
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 오늘 한국 날짜
export const getKstToday = () =>
  new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);

// 지금 한국 시각의 시(0~23)
export const getKstHour = () =>
  new Date(Date.now() + KST_OFFSET_MS).getUTCHours();

// 지금 한국 시각(HH:mm:ss)
export const getKstTime = () =>
  new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(11, 19);

// YYYY-MM-DD에 일수를 더한다. 시간대 영향을 받지 않게 UTC 자정으로 계산한다
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

// from~to(양 끝 포함)의 날짜들. from이 to보다 늦으면 빈 배열
export const eachDate = (from: string, to: string) => {
  const dates: string[] = [];

  for (let date = from; date <= to; date = addDays(date, 1)) {
    dates.push(date);
  }

  return dates;
};

// 오늘 기준 며칠 전·후의 한국 날짜 시각(ISO 8601). 캠페인 등록 시각처럼 시각이 필요한 값에 쓴다
export const toKstDateTime = (date: string, time = '09:00:00') =>
  `${date}T${time}+09:00`;
