export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function differenceInDays(fromDate: Date, toDate: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay);
}

const IST_TIME_ZONE = 'Asia/Kolkata';
const millisecondsPerDay = 1000 * 60 * 60 * 24;
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});
const dateTimePartsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

type IndianDateParts = {
  year: number;
  month: number;
  day: number;
};

export function getIndianDateKey(date: Date) {
  return dateFormatter.format(date);
}

export function parseIndianDateKey(dateKey: string): IndianDateParts {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}

export function getIndianDateParts(date: Date): IndianDateParts {
  return parseIndianDateKey(getIndianDateKey(date));
}

export function addIndianDays(dateKey: string, days: number) {
  const { year, month, day } = parseIndianDateKey(dateKey);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return getIndianDateKey(utcDate);
}

export function differenceInIndianCalendarDays(fromDate: Date, toDate: Date) {
  const fromParts = parseIndianDateKey(getIndianDateKey(fromDate));
  const toParts = parseIndianDateKey(getIndianDateKey(toDate));
  const fromUtc = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day);
  const toUtc = Date.UTC(toParts.year, toParts.month - 1, toParts.day);
  return Math.round((toUtc - fromUtc) / millisecondsPerDay);
}

export function hasIndianDatePassed(date: Date, referenceDate = new Date()) {
  return differenceInIndianCalendarDays(referenceDate, date) < 0;
}

export function getIndianHourAndMinute(date: Date) {
  const parts = dateTimePartsFormatter.formatToParts(date);
  const lookup = new Map(parts.map((part) => [part.type, part.value]));

  return {
    hour: Number(lookup.get('hour') ?? '0'),
    minute: Number(lookup.get('minute') ?? '0')
  };
}
