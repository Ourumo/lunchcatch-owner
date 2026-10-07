interface DateParts {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
}

const emptyValue = '—';
const koreaDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const parseDateParts = (value?: string | null): DateParts | null => {
  const match = value
    ?.trim()
    .match(
      /^(\d{4})[-.](\d{2})[-.](\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/,
    );
  if (!match) return null;

  const [, year, month, day, hour, minute, second, zone] = match;
  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  // Date의 자동 보정으로 2월 30일 같은 잘못된 입력이 다른 날짜로 표시되지 않게 한다.
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day) ||
    (hour !== undefined && Number(hour) > 23) ||
    (minute !== undefined && Number(minute) > 59) ||
    (second !== undefined && Number(second) > 59)
  )
    return null;

  // 날짜만 있거나 시간대가 없는 값은 명시된 날짜·시각을 유지한다.
  if (!zone) return { year, month, day, hour, minute };

  const instant = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second ?? '00'}${zone}`,
  );
  if (Number.isNaN(instant.getTime())) return null;

  const parts = koreaDateTimeFormatter.formatToParts(instant);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
};

/** 날짜를 YYYY.MM.DD로 표시한다. 빈 값과 유효하지 않은 값은 대시로 표시한다. */
export const formatDate = (value?: string | null): string => {
  const parts = parseDateParts(value);
  return parts ? `${parts.year}.${parts.month}.${parts.day}` : emptyValue;
};

/** 시간대가 있는 일시는 한국 시간의 YYYY.MM.DD HH:mm으로 표시한다. */
export const formatDateTime = (value?: string | null): string => {
  const parts = parseDateParts(value);
  return parts?.hour !== undefined && parts.minute !== undefined
    ? `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`
    : emptyValue;
};

export const formatDateRange = (start?: string | null, end?: string | null) =>
  `${formatDate(start)} ~ ${formatDate(end)}`;
