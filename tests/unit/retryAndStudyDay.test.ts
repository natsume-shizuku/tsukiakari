import { sel } from '../support/selection';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { engineeringQuestionBank as bank } from '../../src/content/engineeringQuestionBank';
import { defaultPreferences, type ReviewLog, type ReviewSession, type TestAttempt } from '../../src/domain';
import { createDatabase, saveStudyDay, savePreferences, type TsukiakariDatabase } from '../../src/storage';
import { answerTestAttempt, completeTestAttempt, createTestAttempt, questionOutcome, retryMissedAttempt } from '../../src/testEngine';

const start = 1_800_000_000_000;
function finished(mode: 'practice' | 'exam', count: number, correctAnswers: number, wrongAnswers: number): TestAttempt {
  let attempt = createTestAttempt(bank, { mode, count, durationMinutes: 120, fixturePreview: true }, [], start, () => 0.5);
  attempt.questions.slice(0, correctAnswers).forEach(question => { attempt = answerTestAttempt(attempt, question.card.id, sel(question.card).correctOptionIds, start + 1); });
  attempt.questions.slice(correctAnswers, correctAnswers + wrongAnswers).forEach(question => {
    const wrong = sel(question.card).options.filter(option => !sel(question.card).correctOptionIds.includes(option.id)).slice(0, 1).map(option => option.id);
    attempt = answerTestAttempt(attempt, question.card.id, wrong, start + 1);
  });
  return completeTestAttempt(attempt, start + 2);
}

describe('retrying missed questions', () => {
  it('keeps only wrong and skipped questions, with fresh answers', () => {
    const original = finished('practice', 10, 3, 2);
    const retry = retryMissedAttempt(original, start + 3);
    expect(retry.questions).toHaveLength(7);
    expect(retry.questions.every(question => questionOutcome(original, question) !== 'correct')).toBe(true);
    expect(retry.responses.every(response => !response.selectedOptionIds.length && !response.revealed)).toBe(true);
    expect(retry.retryOf).toBe(original.id);
    expect(retry.completedAt).toBeNull();
    expect(retry.result).toBeNull();
  });
  it('turns a missed exam set into untimed practice, because it is no longer an exam', () => {
    const retry = retryMissedAttempt(finished('exam', 50, 2, 1), start + 3);
    expect(retry.mode).toBe('practice');
    expect(retry.deadlineAt).toBeNull();
    expect(retry.questions).toHaveLength(48);
  });
  it('refuses when nothing was missed, and when the test is unfinished', () => {
    expect(() => retryMissedAttempt(finished('practice', 2, 2, 0), start + 3)).toThrow(/nothing to retry/);
    const unfinished = createTestAttempt(bank, { mode: 'practice', count: 2, durationMinutes: 120, fixturePreview: true }, [], start, () => 0.5);
    expect(() => retryMissedAttempt(unfinished, start + 3)).toThrow(/Finish this test/);
  });
});

describe('changing the study day', () => {
  let db: TsukiakariDatabase;
  const session = { id: 'active', deckId: 'deck' } as unknown as ReviewSession;
  const log = (id: string, undoable: boolean) => ({ id, undoable, studyDay: '2026-11-04', copyId: 'copy', deckId: 'deck', at: start, timeZone: 'UTC', dayStartsAtHour: 5 }) as unknown as ReviewLog;
  beforeEach(async () => {
    db = createDatabase(`tsukiakari-unit-${crypto.randomUUID()}`);
    await savePreferences({ ...defaultPreferences(), timeZone: 'UTC', dayStartsAtHour: 5 }, db);
    await db.reviewSessions.put(session);
    await db.reviewLogs.bulkPut([log('recent', true), log('older', false)]);
  });
  afterEach(async () => { await db.delete(); });

  it('saves the new boundary, ends the review and clears undo without rewriting history', async () => {
    await saveStudyDay({ timeZone: 'Asia/Tokyo', dayStartsAtHour: 4 }, db);
    expect(await db.preferences.get('preferences')).toMatchObject({ timeZone: 'Asia/Tokyo', dayStartsAtHour: 4 });
    expect(await db.reviewSessions.count()).toBe(0);
    const recent = await db.reviewLogs.get('recent');
    expect(recent?.undoable).toBe(false);
    expect(recent).toMatchObject({ studyDay: '2026-11-04', timeZone: 'UTC', dayStartsAtHour: 5 });
  });
  it('changes nothing when the values are the same', async () => {
    await saveStudyDay({ timeZone: 'UTC', dayStartsAtHour: 5 }, db);
    expect(await db.reviewSessions.count()).toBe(1);
    expect((await db.reviewLogs.get('recent'))?.undoable).toBe(true);
  });
  it('rejects an invalid boundary and leaves everything as it was', async () => {
    await expect(saveStudyDay({ timeZone: 'Not/AZone', dayStartsAtHour: 5 }, db)).rejects.toThrow(/Timezone/);
    await expect(saveStudyDay({ timeZone: 'UTC', dayStartsAtHour: 24 }, db)).rejects.toThrow();
    expect(await db.preferences.get('preferences')).toMatchObject({ timeZone: 'UTC', dayStartsAtHour: 5 });
    expect(await db.reviewSessions.count()).toBe(1);
  });
});
