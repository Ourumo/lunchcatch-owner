// 가게 분석 차트의 눈금·라벨·가리킨 위치 계산. 관리자 대시보드(dashboardChartUtils)와 같은 계산이라 나중에 공통 유틸로 합친다

export const getChartAxisMaximum = (values: number[]) => {
  const maximum = Math.max(1, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 4));
  // 눈금을 네 구간으로 나누되 1·2·2.5·5·10 배수로 올려 실제 최댓값이 축 밖으로 나가지 않게 한다.
  const step =
    [1, 2, 2.5, 5, 10].find((value) => value * magnitude >= maximum / 4) ?? 10;
  return step * magnitude * 4;
};

export const getChartLabelInterval = (count: number, width: number) =>
  Math.max(1, Math.ceil(count / Math.max(2, Math.floor(width / 120))));

export const getNearestChartIndex = (
  position: number,
  plotLeft: number,
  plotWidth: number,
  count: number,
) => {
  if (count <= 1) return 0;
  const index = Math.round(((position - plotLeft) / plotWidth) * (count - 1));
  return Math.max(0, Math.min(count - 1, index));
};
