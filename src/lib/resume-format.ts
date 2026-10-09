const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

// API dates are "YYYY-MM-DD". Parsed by hand: new Date() would shift them
// by the server's time zone.
const parts = (iso: string) => {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? { year: match[1], month, day: String(Number(match[3])) } : null;
};

export const formatMonth = (iso: string): string => {
  const date = parts(iso);
  return date ? `${date.month} ${date.year}` : iso;
};

export const formatDay = (iso: string): string => {
  const date = parts(iso);
  return date ? `${date.day} ${date.month} ${date.year}` : iso;
};

export const formatPeriod = (start: string, end: string | null): string =>
  `${formatMonth(start)} — ${end ? formatMonth(end) : "сейчас"}`;

export const formatYears = (start: string, end: string | null, studyingNow: boolean): string =>
  `${start.slice(0, 4)} — ${studyingNow || !end ? "учусь" : end.slice(0, 4)}`;

export const newestFirst = <T>(rows: T[], date: (row: T) => string): T[] =>
  [...rows].sort((a, b) => date(b).localeCompare(date(a)));
