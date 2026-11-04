import type { WorkspaceSnapshot } from './domain';
import { addStudyDays, getStudyDay, studyDayAsUtcNoon } from './studyDay';

export interface DayActivity { date: string; reviews: number; durationMs: number; again: number; right: number; }
export interface ActivityTotal { reviews: number; durationMs: number; averageMs: number; }
export interface StudyStatistics {
  today: string; year: number; currentYear: number; earliestYear: number;
  todayActivity: ActivityTotal; weekActivity: ActivityTotal; lifetime: ActivityTotal;
  days: (DayActivity & { future: boolean })[];
  yearActivity: ActivityTotal; elapsedDays: number; studiedDays: number;
  dailyAverage: number; studiedPercentage: number; currentStreak: number; longestStreak: number;
}
function emptyDay(date: string): DayActivity { return { date, reviews: 0, durationMs: 0, again: 0, right: 0 }; }
function total(days: DayActivity[]): ActivityTotal {
  const reviews = days.reduce((sum, day) => sum + day.reviews, 0);
  const durationMs = days.reduce((sum, day) => sum + day.durationMs, 0);
  return { reviews, durationMs, averageMs: reviews ? durationMs / reviews : 0 };
}

/** Historical study-day labels are retained; only the current day uses today's preferences. */
export function getStatistics(workspace: WorkspaceSnapshot, now: number, requestedYear?: number, deckId?: string): StudyStatistics {
  const today = getStudyDay(now, workspace.preferences);
  const currentYear = Number(today.slice(0, 4));
  const year = requestedYear ?? currentYear;
  if (!Number.isInteger(year) || year < 1 || year > currentYear) throw new Error('Choose a calendar year up to the current study year.');
  const byDay = new Map<string, DayActivity>();
  for (const log of workspace.reviewLogs) {
    if (log.undone || log.at > now || log.studyDay > today || (deckId && log.deckId !== deckId)) continue;
    // Invalid calendar dates cannot create a heatmap cell or extend a streak.
    try { studyDayAsUtcNoon(log.studyDay); } catch { continue; }
    const activity = byDay.get(log.studyDay) ?? emptyDay(log.studyDay);
    activity.reviews++;
    activity.durationMs += log.durationMs;
    activity[log.rating]++;
    byDay.set(log.studyDay, activity);
  }
  const activityDays = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  const first = `${String(year).padStart(4, '0')}-01-01`;
  const last = `${String(year).padStart(4, '0')}-12-31`;
  const days: StudyStatistics['days'] = [];
  let date = first;
  while (date <= last) {
    days.push({ ...(byDay.get(date) ?? emptyDay(date)), future: date > today });
    if (date === last) break;
    date = addStudyDays(date, 1);
  }
  const elapsedDays = days.filter(day => !day.future).length;
  const studiedDays = days.filter(day => !day.future && day.reviews > 0).length;
  const yearActivity = total(days.filter(day => !day.future));
  let longestStreak = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of activityDays) {
    run = previous && addStudyDays(previous, 1) === day.date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day.date;
  }
  let currentStreak = 0;
  let streakDay = byDay.has(today) ? today : addStudyDays(today, -1);
  while (byDay.has(streakDay)) { currentStreak++; streakDay = addStudyDays(streakDay, -1); }
  const weekStart = addStudyDays(today, -6);
  return {
    today, year, currentYear, earliestYear: Math.min(currentYear, Number(activityDays[0]?.date.slice(0, 4) ?? currentYear)),
    todayActivity: total([byDay.get(today) ?? emptyDay(today)]),
    weekActivity: total(activityDays.filter(day => day.date >= weekStart)), lifetime: total(activityDays),
    days, yearActivity, elapsedDays, studiedDays,
    dailyAverage: elapsedDays ? yearActivity.reviews / elapsedDays : 0,
    studiedPercentage: elapsedDays ? 100 * studiedDays / elapsedDays : 0,
    currentStreak, longestStreak,
  };
}

export function formatActiveTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
}
