import type { Preferences } from './domain';

const DAY_MS = 86_400_000;
type CalendarDate = { year: number; month: number; day: number };
type ClockParts = CalendarDate & { hour: number; minute: number; second: number };
const formatters = new Map<string, Intl.DateTimeFormat>();

export function assertTimestamp(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || !Number.isFinite(new Date(value).getTime())) {
    throw new Error('Study time must be a valid timestamp.');
  }
}

function formatter(timeZone: string): Intl.DateTimeFormat {
  let result = formatters.get(timeZone);
  if (!result) {
    result = new Intl.DateTimeFormat('en-CA-u-ca-iso8601-nu-latn', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    formatters.set(timeZone, result);
  }
  return result;
}

function partsAt(at: number, timeZone: string): ClockParts {
  const values = Object.fromEntries(formatter(timeZone).formatToParts(at).map(part => [part.type, part.value]));
  return {
    year: Number(values.year), month: Number(values.month), day: Number(values.day),
    hour: Number(values.hour), minute: Number(values.minute), second: Number(values.second),
  };
}

/** UTC is used only as a neutral container for calendar arithmetic, never as a local-day duration. */
function calendarEpoch({ year, month, day }: CalendarDate, hour = 0, minute = 0, second = 0): number {
  const result = new Date(0);
  result.setUTCFullYear(year, month - 1, day);
  result.setUTCHours(hour, minute, second, 0);
  return result.getTime();
}

function formatDay(date: CalendarDate): string {
  if (date.year < 0 || date.year > 9999) throw new Error('Study date is outside the supported calendar.');
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

function parseDay(day: string): CalendarDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Study day must use YYYY-MM-DD.');
  const [year, month, date] = day.split('-').map(Number);
  const value = { year, month, day: date };
  const check = new Date(calendarEpoch(value));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== date) {
    throw new Error('Study day is not a calendar date.');
  }
  return value;
}

function assertBoundaryHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('The study-day boundary must be a whole hour from 0 to 23.');
}

export function addStudyDays(day: string, days: number): string {
  if (!Number.isSafeInteger(days)) throw new Error('Calendar-day offsets must be whole numbers.');
  const result = new Date(calendarEpoch(parseDay(day)) + days * DAY_MS);
  if (!Number.isFinite(result.getTime())) throw new Error('Study date is outside the supported calendar.');
  return formatDay({ year: result.getUTCFullYear(), month: result.getUTCMonth() + 1, day: result.getUTCDate() });
}

export function getStudyDay(now: number, preferences: Pick<Preferences, 'timeZone' | 'dayStartsAtHour'>): string {
  assertTimestamp(now);
  assertBoundaryHour(preferences.dayStartsAtHour);
  const local = partsAt(now, preferences.timeZone);
  const date = formatDay(local);
  return local.hour < preferences.dayStartsAtHour ? addStudyDays(date, -1) : date;
}

/**
 * Resolve a saved-zone calendar boundary to an instant. Offset candidates come from
 * both sides of the date, so spring/fall DST changes never assume a 24-hour day.
 * An ambiguous hour uses its first occurrence; a nonexistent hour shifts forward
 * by the timezone gap. The default 05:00 boundary avoids ordinary DST transitions.
 */
export function studyDayStart(day: string, preferences: Pick<Preferences, 'timeZone' | 'dayStartsAtHour'>): number {
  assertBoundaryHour(preferences.dayStartsAtHour);
  const target = calendarEpoch(parseDay(day), preferences.dayStartsAtHour);
  const offsets = new Set<number>();
  for (const days of [-2, -1, 0, 1, 2]) {
    const instant = target + days * DAY_MS;
    const local = partsAt(instant, preferences.timeZone);
    offsets.add(calendarEpoch(local, local.hour, local.minute, local.second) - instant);
  }
  const candidates = [...offsets].map(offset => {
    const instant = target - offset;
    const local = partsAt(instant, preferences.timeZone);
    return { instant, localEpoch: calendarEpoch(local, local.hour, local.minute, local.second) };
  });
  const exact = candidates.filter(candidate => candidate.localEpoch === target).sort((a, b) => a.instant - b.instant);
  if (exact.length) return exact[0].instant;
  const later = candidates.filter(candidate => candidate.localEpoch > target)
    .sort((a, b) => a.localEpoch - b.localEpoch || a.instant - b.instant);
  if (later.length) return later[0].instant;
  throw new Error('The study-day boundary could not be resolved in the saved timezone.');
}

/** Calendar date for the FSRS adapter; this never replaces a stored real timestamp. */
export function studyDayAsUtcNoon(day: string): number {
  return calendarEpoch(parseDay(day), 12);
}
