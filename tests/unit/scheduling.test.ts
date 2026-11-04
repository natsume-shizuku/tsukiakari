import { describe, expect, it } from 'vitest';
import { createEmptyCard, default_w, fsrs, generatorParameters, Rating } from 'ts-fsrs';
import { fixturePack } from '../../src/content/fixtures';
import { newDeckSettings } from '../../src/domain';
import type { LearningCopy, Preferences, ReviewLog, ReviewSession, SchedulerState, WorkspaceSnapshot } from '../../src/domain';
import { getDeckQueue, getStudyDay, initialState, scheduleReview, SCHEDULER_METADATA, studyDayStart } from '../../src/scheduling';
import { addStudyDays } from '../../src/studyDay';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const now = Date.parse('2026-10-20T18:00:00Z');
const preferences: Preferences = { id: 'preferences', theme: 'system', timeZone: 'America/Denver', dayStartsAtHour: 5 };

function studied(copyId: string, state: Exclude<SchedulerState['state'], 'new'> = 'review', dueAt = now): SchedulerState {
  return {
    ...initialState(copyId), state, dueAt, lastReviewAt: now - day,
    repetitions: 4, stability: 10, difficulty: 5, scheduledDays: state === 'review' ? 1 : 0,
  };
}

function workspace(): WorkspaceSnapshot {
  const decks = ['first', 'second'].map(id => ({ id, name: id, createdAt: now - day, settings: newDeckSettings() }));
  const copies = decks.flatMap(deck => fixturePack.cards.map((card, index): LearningCopy => ({
    id: `${deck.id}-${index}`, deckId: deck.id, packId: fixturePack.id, cardId: card.id,
    contentRevision: card.revision, createdAt: now - day + index, personalNote: '', tags: [], suspended: false,
  })));
  return { decks, copies, preferences: { ...preferences }, schedulerStates: [], reviewLogs: [], testAttempts: [], testExposures: [], session: null };
}

function logFor(copy: LearningCopy, state: SchedulerState['state'], at = now, undone = false): ReviewLog {
  const before = state === 'new' ? initialState(copy.id) : studied(copy.id, state, at);
  if (before.lastReviewAt !== null) before.lastReviewAt = at - day;
  const session: ReviewSession = {
    id: 'active', deckId: copy.deckId, copyId: copy.id, turnId: 'turn-before',
    revealed: true, selectedOptionId: null, guessed: false, startedAt: at, shownAt: at,
  };
  return {
    id: `log-${copy.id}-${at}-${state}`, copyId: copy.id, deckId: copy.deckId,
    at, studyDay: getStudyDay(at, preferences), rating: 'again', durationMs: 100,
    undone, contentRevision: 1, before,
    after: scheduleReview(before, 'again', newDeckSettings(), at, preferences),
    settings: newDeckSettings(), sequence: 1, undoable: true,
    timeZone: preferences.timeZone, dayStartsAtHour: preferences.dayStartsAtHour,
    copyBefore: structuredClone(copy), copyAfter: structuredClone(copy),
    sessionBefore: session, sessionAfter: { ...session, copyId: null, turnId: 'turn-after', revealed: false },
  };
}

describe('saved-zone study-day calendar', () => {
  it('rolls the saved day over at precisely 05:00, independently of the device timezone', () => {
    expect(getStudyDay(Date.parse('2026-10-20T10:59:59.999Z'), preferences)).toBe('2026-10-19');
    expect(getStudyDay(Date.parse('2026-10-20T11:00:00Z'), preferences)).toBe('2026-10-20');
    expect(getStudyDay(now, { ...preferences, timeZone: 'Asia/Tokyo' })).toBe('2026-10-20');
    expect(getStudyDay(now + 2 * hour, { ...preferences, timeZone: 'Asia/Tokyo' })).toBe('2026-10-21');
  });

  it('handles leap years and month/year boundaries as calendar dates', () => {
    expect(addStudyDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addStudyDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addStudyDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(getStudyDay(Date.parse('2027-01-01T08:00:00Z'), preferences)).toBe('2026-12-31');
  });

  it('resolves spring DST boundaries without assuming 24 elapsed hours', () => {
    const before = studyDayStart('2026-03-07', preferences);
    const after = studyDayStart('2026-03-08', preferences);
    expect(before).toBe(Date.parse('2026-03-07T12:00:00Z'));
    expect(after).toBe(Date.parse('2026-03-08T11:00:00Z'));
    expect(after - before).toBe(23 * hour);
    expect(getStudyDay(after - 1, preferences)).toBe('2026-03-07');
    expect(getStudyDay(after, preferences)).toBe('2026-03-08');
  });

  it('resolves fall DST boundaries without assuming 24 elapsed hours', () => {
    const before = studyDayStart('2026-10-31', preferences);
    const after = studyDayStart('2026-11-01', preferences);
    expect(before).toBe(Date.parse('2026-10-31T11:00:00Z'));
    expect(after).toBe(Date.parse('2026-11-01T12:00:00Z'));
    expect(after - before).toBe(25 * hour);
    expect(getStudyDay(after - 1, preferences)).toBe('2026-10-31');
    expect(getStudyDay(after, preferences)).toBe('2026-11-01');
  });

  it('supports half-hour timezone offsets and deterministic DST gap/fold resolution', () => {
    expect(studyDayStart('2026-10-20', { ...preferences, timeZone: 'Asia/Kolkata' }))
      .toBe(Date.parse('2026-10-19T23:30:00Z'));
    expect(studyDayStart('2026-03-08', { ...preferences, timeZone: 'America/New_York', dayStartsAtHour: 2 }))
      .toBe(Date.parse('2026-03-08T07:00:00Z'));
    expect(studyDayStart('2026-11-01', { ...preferences, timeZone: 'America/New_York', dayStartsAtHour: 1 }))
      .toBe(Date.parse('2026-11-01T05:00:00Z'));
  });

  it('rejects invalid dates, timestamps, offsets and timezone settings', () => {
    expect(() => getStudyDay(NaN, preferences)).toThrow(/timestamp/);
    expect(() => getStudyDay(-1, preferences)).toThrow(/timestamp/);
    expect(() => getStudyDay(Number.MAX_SAFE_INTEGER, preferences)).toThrow(/timestamp/);
    expect(() => getStudyDay(now, { ...preferences, dayStartsAtHour: 24 })).toThrow(/whole hour/);
    expect(() => getStudyDay(now, { ...preferences, timeZone: 'not/a-zone' })).toThrow();
    expect(() => studyDayStart('2026-02-30', preferences)).toThrow(/calendar date/);
    expect(() => addStudyDays('2026-10-20', 0.5)).toThrow(/whole numbers/);
  });
});

describe('pinned FSRS scheduling adapter', () => {
  it('initializes an independent unscheduled new copy with versioned metadata', () => {
    expect(initialState('copy')).toEqual({
      copyId: 'copy', ...SCHEDULER_METADATA, state: 'new', dueAt: null,
      stability: 0, difficulty: 0, repetitions: 0, lapses: 0, elapsedDays: 0,
      scheduledDays: 0, learningStep: 0, lastReviewAt: null,
    });
    expect(() => initialState(' ')).toThrow();
    expect(initialState('first')).not.toBe(initialState('second'));
  });

  it('maps Again to 1m and Right to the 10m Good step using standard weights', () => {
    const source = initialState('copy');
    const settings = newDeckSettings();
    const snapshot = structuredClone({ source, settings, preferences });
    const again = scheduleReview(source, 'again', settings, now, preferences);
    const right = scheduleReview(source, 'right', settings, now, preferences);
    expect(again).toMatchObject({ state: 'learning', dueAt: now + minute, learningStep: 0, lapses: 0, repetitions: 1, lastReviewAt: now });
    expect(right).toMatchObject({ state: 'learning', dueAt: now + 10 * minute, learningStep: 1, lapses: 0, repetitions: 1 });
    const native = fsrs().next(createEmptyCard(now), now, Rating.Good).card;
    expect(right.stability).toBe(native.stability);
    expect(right.difficulty).toBe(native.difficulty);
    expect(generatorParameters({}).w).toEqual(default_w);
    expect({ source, settings, preferences }).toEqual(snapshot);
    expect(scheduleReview(source, 'right', settings, now, preferences)).toEqual(right);
  });

  it('progresses 10m to 1h then Review at a saved-zone day boundary', () => {
    const settings = newDeckSettings();
    const first = scheduleReview(initialState('copy'), 'right', settings, now, preferences);
    const second = scheduleReview(first, 'right', settings, first.dueAt!, preferences);
    expect(second).toMatchObject({ state: 'learning', dueAt: now + 70 * minute, learningStep: 2 });
    const third = scheduleReview(second, 'right', settings, second.dueAt!, preferences);
    expect(third.state).toBe('review');
    expect(third.learningStep).toBe(0);
    expect(third.repetitions).toBe(3);
    expect(third.dueAt).toBe(studyDayStart(addStudyDays(getStudyDay(second.dueAt!, preferences), third.scheduledDays), preferences));
  });

  it('resets failed initial learning to 1m without counting review lapses', () => {
    const first = scheduleReview(initialState('copy'), 'right', newDeckSettings(), now, preferences);
    const again = scheduleReview(first, 'again', newDeckSettings(), first.dueAt!, preferences);
    expect(again).toMatchObject({ state: 'learning', learningStep: 0, lapses: 0, dueAt: first.dueAt! + minute });
  });

  it('counts one review lapse then relearns through 10m and 1h without extra lapses', () => {
    const first = scheduleReview(studied('copy'), 'again', newDeckSettings(), now, preferences);
    expect(first).toMatchObject({ state: 'relearning', learningStep: 0, lapses: 1, dueAt: now + 10 * minute });
    const again = scheduleReview(first, 'again', newDeckSettings(), first.dueAt!, preferences);
    expect(again).toMatchObject({ state: 'relearning', learningStep: 0, lapses: 1, dueAt: first.dueAt! + 10 * minute });
    const right = scheduleReview(again, 'right', newDeckSettings(), again.dueAt!, preferences);
    expect(right).toMatchObject({ state: 'relearning', learningStep: 1, lapses: 1, dueAt: again.dueAt! + hour });
    const graduated = scheduleReview(right, 'right', newDeckSettings(), right.dueAt!, preferences);
    expect(graduated).toMatchObject({ state: 'review', lapses: 1 });
  });

  it('retains overdue elapsed study days and schedules from today', () => {
    const before = studied('copy');
    before.lastReviewAt = Date.parse('2026-10-10T18:00:00Z');
    before.dueAt = Date.parse('2026-10-12T11:00:00Z');
    const result = scheduleReview(before, 'right', newDeckSettings(), now, preferences);
    expect(result.elapsedDays).toBe(10);
    expect(result.lastReviewAt).toBe(now);
    expect(result.dueAt).toBe(studyDayStart(addStudyDays('2026-10-20', result.scheduledDays), preferences));
  });

  it('changes future intervals when desired retention changes', () => {
    const before = studied('copy');
    const higher = scheduleReview(before, 'right', { ...newDeckSettings(), desiredRetention: 0.99 }, now, preferences);
    const lower = scheduleReview(before, 'right', { ...newDeckSettings(), desiredRetention: 0.7 }, now, preferences);
    expect(higher.scheduledDays).toBeLessThan(lower.scheduledDays);
    expect(higher.dueAt!).toBeLessThan(lower.dueAt!);
  });

  it('keeps a learning review across UTC midnight in the same saved study day', () => {
    const at = Date.parse('2026-10-20T23:55:00Z');
    const first = scheduleReview(initialState('copy'), 'right', newDeckSettings(), at, preferences);
    const second = scheduleReview(first, 'right', newDeckSettings(), first.dueAt!, preferences);
    expect(second.elapsedDays).toBe(0);
    expect(second.lastReviewAt).toBe(Date.parse('2026-10-21T00:05:00Z'));
    expect(second.dueAt).toBe(Date.parse('2026-10-21T01:05:00Z'));
  });

  it('counts crossing 05:00 as one study day even when only ten minutes elapse', () => {
    const at = Date.parse('2026-10-20T10:55:00Z');
    const first = scheduleReview(initialState('copy'), 'right', newDeckSettings(), at, preferences);
    const second = scheduleReview(first, 'right', newDeckSettings(), first.dueAt!, preferences);
    expect(second.elapsedDays).toBe(1);
    expect(second.dueAt).toBe(Date.parse('2026-10-20T12:05:00Z'));
  });

  it.each([
    ['2026-03-07', '2026-03-08T11:00:00Z'],
    ['2026-10-31', '2026-11-01T12:00:00Z'],
  ])('lands a one-day graduation after %s on 05:00 across DST', (date, expectedDue) => {
    const at = studyDayStart(date, preferences) + hour;
    const settings = { ...newDeckSettings(), learningStepsMinutes: [1], desiredRetention: 0.99 };
    const result = scheduleReview(initialState('copy'), 'right', settings, at, preferences);
    expect(result.scheduledDays).toBe(1);
    expect(result.dueAt).toBe(Date.parse(expectedDue));
  });

  it('does not graduate an Again when learning steps were shortened', () => {
    const settings = newDeckSettings();
    const first = scheduleReview(initialState('copy'), 'right', settings, now, preferences);
    const second = scheduleReview(first, 'right', settings, first.dueAt!, preferences);
    const changed = { ...settings, learningStepsMinutes: [5] };
    const again = scheduleReview(second, 'again', changed, second.dueAt!, preferences);
    expect(again).toMatchObject({ state: 'learning', learningStep: 0, dueAt: second.dueAt! + 5 * minute });
    const right = scheduleReview(second, 'right', changed, second.dueAt!, preferences);
    expect(right.state).toBe('review');
  });

  it('does not graduate an Again when relearning steps were shortened', () => {
    const settings = newDeckSettings();
    const first = scheduleReview(studied('copy'), 'again', settings, now, preferences);
    const second = scheduleReview(first, 'right', settings, first.dueAt!, preferences);
    const snapshot = structuredClone(second);
    const again = scheduleReview(second, 'again', { ...settings, relearningStepsMinutes: [20] }, second.dueAt!, preferences);
    expect(again).toMatchObject({ state: 'relearning', learningStep: 0, lapses: 1, dueAt: second.dueAt! + 20 * minute });
    expect(second).toEqual(snapshot);
  });

  it.each([
    ['2026-03-08T08:55:00Z', '2026-03-08T09:05:00Z'],
    ['2026-11-01T07:55:00Z', '2026-11-01T08:05:00Z'],
  ])('keeps intraday minutes exact across the DST transition after %s', (start, expected) => {
    const first = scheduleReview(initialState('copy'), 'right', newDeckSettings(), Date.parse(start), preferences);
    expect(first.dueAt).toBe(Date.parse(expected));
    const second = scheduleReview(first, 'right', newDeckSettings(), first.dueAt!, preferences);
    expect(second.elapsedDays).toBe(0);
    expect(second.dueAt).toBe(first.dueAt! + hour);
  });

  it('does not mutate a saved before state when editing settings or reviewing', () => {
    const before = studied('copy');
    const snapshot = structuredClone(before);
    scheduleReview(before, 'again', { ...newDeckSettings(), relearningStepsMinutes: [20, 120] }, now, preferences);
    expect(before).toEqual(snapshot);
  });

  it('rejects invalid settings, unrecognized scheduler metadata and backwards clocks', () => {
    expect(() => scheduleReview(studied('copy'), 'right', newDeckSettings(), now - 2 * day, preferences)).toThrow(/precede/);
    expect(() => scheduleReview(initialState('copy'), 'right', { ...newDeckSettings(), desiredRetention: 1 }, now, preferences)).toThrow();
    expect(() => scheduleReview(initialState('copy'), 'right', { ...newDeckSettings(), learningStepsMinutes: [1440] }, now, preferences)).toThrow();
    expect(() => scheduleReview({ ...initialState('copy'), libraryVersion: 'unknown' }, 'right', newDeckSettings(), now, preferences)).toThrow(/unsupported/);
  });
});

describe('per-deck due queues and daily allowances', () => {
  it('treats absent scheduler rows as new without mutating learner data', () => {
    const value = workspace();
    const original = structuredClone(value);
    expect(getDeckQueue(value, 'first', now)).toMatchObject({
      newIds: ['first-0', 'first-1', 'first-2', 'first-3'], learningIds: [], reviewIds: [],
      newRemaining: 20, reviewRemaining: 9999, newUsed: 0, reviewsUsed: 0, nextDueAt: null,
    });
    expect(value).toEqual(original);
  });

  it('orders overdue learning first, reviews second, and stable new cards last', () => {
    const value = workspace();
    value.schedulerStates = [
      studied('first-0', 'review', now - day),
      studied('first-1', 'learning', now - minute),
      studied('first-2', 'relearning', now - 2 * minute),
    ];
    expect(getDeckQueue(value, 'first', now).orderedIds).toEqual(['first-2', 'first-1', 'first-0', 'first-3']);
  });

  it('applies allowances independently to decks containing the same published cards', () => {
    const value = workspace();
    value.decks[0].settings.newCardsPerDay = 1;
    value.reviewLogs.push(logFor(value.copies[0], 'new'));
    value.schedulerStates.push(studied('first-0', 'learning', now + minute));
    expect(getDeckQueue(value, 'first', now).newIds).toEqual([]);
    expect(getDeckQueue(value, 'second', now).newIds).toEqual(['second-0', 'second-1', 'second-2', 'second-3']);
  });

  it('counts review actions toward review caps but never learning/relearning repetitions', () => {
    const value = workspace();
    value.decks[0].settings.maximumReviewsPerDay = 2;
    value.reviewLogs = [
      logFor(value.copies[0], 'review'),
      logFor(value.copies[1], 'learning'),
      logFor(value.copies[2], 'relearning'),
    ];
    value.schedulerStates = [studied('first-0'), studied('first-1'), studied('first-2')];
    const result = getDeckQueue(value, 'first', now);
    expect(result.reviewsUsed).toBe(1);
    expect(result.reviewRemaining).toBe(1);
    expect(result.reviewIds).toEqual(['first-0']);
  });

  it('keeps due learning and relearning available when both allowances are zero', () => {
    const value = workspace();
    value.decks[0].settings.newCardsPerDay = 0;
    value.decks[0].settings.maximumReviewsPerDay = 0;
    value.schedulerStates = [studied('first-0', 'learning'), studied('first-1', 'relearning'), studied('first-2')];
    expect(getDeckQueue(value, 'first', now).orderedIds).toEqual(['first-0', 'first-1']);
  });

  it('excludes undone events from both counters', () => {
    const value = workspace();
    value.decks[0].settings.newCardsPerDay = 1;
    value.decks[0].settings.maximumReviewsPerDay = 1;
    value.reviewLogs = [logFor(value.copies[0], 'new', now, true), logFor(value.copies[1], 'review', now, true)];
    value.schedulerStates = [studied('first-1')];
    expect(getDeckQueue(value, 'first', now)).toMatchObject({
      newUsed: 0, reviewsUsed: 0, newIds: ['first-0'], reviewIds: ['first-1'],
    });
  });

  it('resets allowances at 05:00 without accruing unused prior-day allowances', () => {
    const value = workspace();
    value.decks[0].settings.newCardsPerDay = 1;
    value.decks[0].settings.maximumReviewsPerDay = 1;
    const beforeBoundary = Date.parse('2026-10-20T10:59:00Z');
    value.reviewLogs = [logFor(value.copies[0], 'new', beforeBoundary), logFor(value.copies[1], 'review', beforeBoundary)];
    value.schedulerStates = [studied('first-0', 'learning', beforeBoundary + hour), studied('first-1', 'review', beforeBoundary)];
    const before = getDeckQueue(value, 'first', beforeBoundary);
    expect(before.newRemaining).toBe(0);
    expect(before.reviewRemaining).toBe(0);
    const after = getDeckQueue(value, 'first', beforeBoundary + minute);
    expect(after.newRemaining).toBe(1);
    expect(after.reviewRemaining).toBe(1);
    expect(after.reviewIds).toEqual(['first-1']);
    expect(getDeckQueue(value, 'first', now + 4 * day).newRemaining).toBe(1);
  });

  it('reports the next future due time even when reviews are capped', () => {
    const value = workspace();
    value.decks[0].settings.maximumReviewsPerDay = 0;
    value.schedulerStates = [
      studied('first-0', 'review', now + 2 * minute),
      studied('first-1', 'learning', now + 3 * minute),
    ];
    expect(getDeckQueue(value, 'first', now).nextDueAt).toBe(now + 2 * minute);
  });

  it('excludes suspended and unavailable cards; unsuspension restores existing eligibility', () => {
    const value = workspace();
    value.copies[0].suspended = true;
    value.copies[1].packId = 'not-installed';
    value.copies[2].cardId = 'not-installed';
    value.schedulerStates = [studied('first-0')];
    expect(getDeckQueue(value, 'first', now)).toMatchObject({ orderedIds: ['first-3'], suspendedCount: 1 });
    value.copies[0].suspended = false;
    expect(getDeckQueue(value, 'first', now).orderedIds).toEqual(['first-0', 'first-3']);
  });

  it('uses stable identity ordering when creation or due timestamps tie', () => {
    const value = workspace();
    value.copies = value.copies.reverse().map(copy => ({ ...copy, createdAt: now - day }));
    expect(getDeckQueue(value, 'first', now).newIds).toEqual(['first-0', 'first-1', 'first-2', 'first-3']);
    value.schedulerStates = [studied('first-0'), studied('first-1')];
    expect(getDeckQueue(value, 'first', now).reviewIds).toEqual(['first-0', 'first-1']);
  });

  it('rejects unknown decks instead of silently creating a queue', () => {
    expect(() => getDeckQueue(workspace(), 'missing', now)).toThrow(/no longer exists/);
  });
});
