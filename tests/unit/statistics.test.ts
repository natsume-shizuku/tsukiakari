import { describe, expect, it } from 'vitest';
import { newDeckSettings, type ReviewLog, type WorkspaceSnapshot } from '../../src/domain';
import { initialState } from '../../src/scheduling';
import { createActiveTimer } from '../../src/activeTime';
import { formatActiveTime, getStatistics } from '../../src/statistics';

const now = Date.parse('2026-10-27T18:00:00Z');
function workspace(): WorkspaceSnapshot {
  return { decks: ['first', 'second'].map(id => ({ id, name: id, createdAt: 1, settings: newDeckSettings() })), copies: [], schedulerStates: [], reviewLogs: [], session: null, testAttempts: [], testExposures: [], preferences: { id: 'preferences', theme: 'dark', timeZone: 'America/Denver', dayStartsAtHour: 5 } };
}
function log(date: string, options: { durationMs?: number; undone?: boolean; deckId?: string; at?: number; rating?: 'again' | 'right' } = {}): ReviewLog {
  const deckId = options.deckId ?? 'first';
  const at = options.at ?? Date.parse(date + 'T18:00:00Z');
  const copy = { id: deckId + '-copy', deckId, packId: 'pack', cardId: 'card', contentRevision: 1, createdAt: 1, personalNote: '', tags: [], suspended: false };
  const state = initialState(copy.id);
  const session = { id: 'active' as const, deckId, copyId: copy.id, turnId: 'turn', revealed: true, selectedOptionId: null, guessed: false, startedAt: at, shownAt: at };
  return { id: crypto.randomUUID(), copyId: copy.id, deckId, at, studyDay: date, rating: options.rating ?? 'right', durationMs: options.durationMs ?? 1000, undone: options.undone ?? false, contentRevision: 1, before: state, after: { ...state, lastReviewAt: at }, settings: newDeckSettings(), sequence: 1, undoable: false, timeZone: 'America/Denver', dayStartsAtHour: 5, copyBefore: copy, copyAfter: copy, sessionBefore: session, sessionAfter: { ...session, revealed: false } };
}

describe('flashcard statistics', () => {
  it('returns honest zeros and a full calendar without review data', () => {
    const stats = getStatistics(workspace(), now);
    expect(stats.todayActivity).toEqual({ reviews: 0, durationMs: 0, averageMs: 0 });
    expect(stats.days).toHaveLength(365);
    expect(stats.elapsedDays).toBe(300);
    expect(stats.studiedDays).toBe(0);
    expect(stats.dailyAverage).toBe(0);
    expect(stats.studiedPercentage).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.days.filter(day => day.future)).toHaveLength(65);
  });
  it('counts repeat reviews, sums active durations and excludes undone reviews', () => {
    const data = workspace();
    data.reviewLogs = [log('2026-10-27', { durationMs: 3500 }), log('2026-10-27', { durationMs: 6500, rating: 'again' }), log('2026-10-27', { durationMs: 999999, undone: true })];
    const stats = getStatistics(data, now);
    expect(stats.todayActivity).toEqual({ reviews: 2, durationMs: 10000, averageMs: 5000 });
    expect(stats.studiedDays).toBe(1);
    expect(stats.dailyAverage).toBeCloseTo(2 / 300);
    expect(stats.studiedPercentage).toBeCloseTo(100 / 300);
    expect(stats.days.find(day => day.date === '2026-10-27')).toMatchObject({ reviews: 2, right: 1, again: 1 });
  });
  it('uses the current study-day boundary before and after 5am', () => {
    const data = workspace();
    data.reviewLogs = [log('2026-10-26', { at: Date.parse('2026-10-27T10:30:00Z') })];
    const early = getStatistics(data, Date.parse('2026-10-27T10:59:59Z'));
    expect(early.today).toBe('2026-10-26');
    expect(early.todayActivity.reviews).toBe(1);
    const boundary = getStatistics(data, Date.parse('2026-10-27T11:00:00Z'));
    expect(boundary.today).toBe('2026-10-27');
    expect(boundary.todayActivity.reviews).toBe(0);
    expect(boundary.currentStreak).toBe(1);
  });
  it('counts a seven-calendar-day window across daylight-saving transitions', () => {
    const data = workspace();
    data.reviewLogs = ['2026-03-02', '2026-03-03', '2026-03-08', '2026-03-09'].map(date => log(date));
    const stats = getStatistics(data, Date.parse('2026-03-09T18:00:00Z'));
    expect(stats.weekActivity.reviews).toBe(3);
    expect(stats.lifetime.reviews).toBe(4);
  });
  it('keeps historical saved study-day labels after preferences change', () => {
    const data = workspace();
    data.preferences.timeZone = 'Asia/Tokyo';
    data.reviewLogs = [log('2026-10-26', { at: Date.parse('2026-10-27T10:30:00Z') })];
    const stats = getStatistics(data, now);
    expect(stats.today).toBe('2026-10-27');
    expect(stats.todayActivity.reviews).toBe(0);
    expect(stats.days.find(day => day.date === '2026-10-26')?.reviews).toBe(1);
  });
  it('keeps current streak through yesterday but breaks after a missed day', () => {
    const data = workspace();
    data.reviewLogs = ['2026-10-24', '2026-10-25', '2026-10-26'].map(date => log(date));
    expect(getStatistics(data, now).currentStreak).toBe(3);
    expect(getStatistics(data, Date.parse('2026-10-28T18:00:00Z')).currentStreak).toBe(0);
    data.reviewLogs.push(log('2026-10-27'));
    expect(getStatistics(data, now).currentStreak).toBe(4);
  });
  it('calculates longest streak over all retained history across year boundaries', () => {
    const data = workspace();
    data.reviewLogs = ['2024-12-30', '2024-12-31', '2025-01-01', '2025-01-02', '2026-10-26', '2026-10-27'].map(date => log(date));
    const stats = getStatistics(data, now);
    expect(stats.longestStreak).toBe(4);
    expect(stats.currentStreak).toBe(2);
    expect(stats.earliestYear).toBe(2024);
  });
  it('undo removes a study day from heatmap, averages and streaks', () => {
    const data = workspace();
    data.reviewLogs = [log('2026-10-25'), log('2026-10-26', { undone: true }), log('2026-10-27')];
    const stats = getStatistics(data, now);
    expect(stats.studiedDays).toBe(2);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
    expect(stats.days.find(day => day.date === '2026-10-26')?.reviews).toBe(0);
  });
  it('includes all days in completed leap years and only elapsed days in current years', () => {
    const data = workspace();
    data.reviewLogs = [log('2024-02-29')];
    const completed = getStatistics(data, now, 2024);
    expect(completed.days).toHaveLength(366);
    expect(completed.elapsedDays).toBe(366);
    expect(completed.dailyAverage).toBeCloseTo(1 / 366);
    expect(completed.days.find(day => day.date === '2024-02-29')?.reviews).toBe(1);
    const current = getStatistics(data, Date.parse('2024-02-29T18:00:00Z'), 2024);
    expect(current.elapsedDays).toBe(60);
    expect(current.dailyAverage).toBeCloseTo(1 / 60);
  });
  it('counts January 1 as one elapsed day, without division by zero', () => {
    const data = workspace();
    data.reviewLogs = [log('2026-01-01')];
    const stats = getStatistics(data, Date.parse('2026-01-01T18:00:00Z'));
    expect(stats.elapsedDays).toBe(1);
    expect(stats.studiedPercentage).toBe(100);
    expect(stats.dailyAverage).toBe(1);
  });
  it('filters by deck and retains history from archived decks and removed cards', () => {
    const data = workspace();
    data.decks[0].archived = true;
    data.reviewLogs = [log('2026-10-26'), log('2026-10-27', { deckId: 'second' })];
    expect(getStatistics(data, now).lifetime.reviews).toBe(2);
    const filtered = getStatistics(data, now, 2026, 'first');
    expect(filtered.lifetime.reviews).toBe(1);
    expect(filtered.todayActivity.reviews).toBe(0);
    expect(filtered.currentStreak).toBe(1);
  });
  it('ignores future timestamps and future day labels instead of overstating activity', () => {
    const data = workspace();
    data.reviewLogs = [log('2026-10-27', { at: now + 1 }), log('2026-10-28', { at: now - 1 }), log('2026-10-26')];
    expect(getStatistics(data, now).lifetime.reviews).toBe(1);
  });
  it('does not count tests, browsing, copies, or an unfinished session', () => {
    const data = workspace();
    data.session = { id: 'active', deckId: 'first', copyId: null, turnId: 'turn', revealed: false, selectedOptionId: null, guessed: false, startedAt: now, shownAt: now };
    const snapshot = structuredClone(data);
    expect(getStatistics(data, now).lifetime.reviews).toBe(0);
    expect(data).toEqual(snapshot);
  });
  it('uses recorded active duration rather than estimating wall-clock or idle time', () => {
    const timer = createActiveTimer(0);
    timer.read(120000);
    timer.setActive(120000, false);
    timer.read(200000);
    const data = workspace();
    data.reviewLogs = [log('2026-10-27', { durationMs: timer.read(250000) })];
    expect(getStatistics(data, now).todayActivity.durationMs).toBe(30000);
  });
  it('rejects future or invalid years and skips malformed saved calendar dates', () => {
    const data = workspace();
    data.reviewLogs = [log('2026-02-30', { at: now - 1 })];
    expect(getStatistics(data, now).lifetime.reviews).toBe(0);
    for (const year of [0, 2027, 2026.5, NaN]) expect(() => getStatistics(data, now, year)).toThrow(/calendar year/);
  });
});

describe('active-time display', () => {
  it('formats seconds, minutes and hours without reporting wall-clock time', () => {
    expect(formatActiveTime(0)).toBe('0s');
    expect(formatActiveTime(59999)).toBe('59s');
    expect(formatActiveTime(65000)).toBe('1m 5s');
    expect(formatActiveTime(3720000)).toBe('1h 2m');
  });
});
