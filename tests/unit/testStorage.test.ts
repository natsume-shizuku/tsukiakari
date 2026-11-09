import { sel } from '../support/selection';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { engineeringQuestionBank as testFixturePack } from '../../src/content/engineeringQuestionBank';
import { fixturePack } from '../../src/content/fixtures';
import { addCardsToDeck, createDatabase, createDeck, loadWorkspace, type TsukiakariDatabase } from '../../src/storage';
import { abandonTestAttempt, expireTestAttempts, finishTestAttempt, retryTestAttempt, revealTestAnswer, saveTestAnswer, startTest } from '../../src/testStorage';

const now = 1_800_000_000_000;
const options = { mode: 'practice' as const, count: 50, durationMinutes: 120, fixturePreview: true };
let db: TsukiakariDatabase;
beforeEach(() => { db = createDatabase('tsukiakari-tests-' + crypto.randomUUID()); });
afterEach(async () => { await db.delete(); });

describe('transactional test persistence', () => {
  it('persists answers and reveals across database reopen', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    const question = attempt.questions[0].card;
    await saveTestAnswer(attempt.id, question.id, sel(question).correctOptionIds, db, now + 1);
    await revealTestAnswer(attempt.id, question.id, db, now + 2);
    db.close(); await db.open();
    const restored = (await loadWorkspace(db)).testAttempts[0];
    expect(restored.responses[0]).toEqual({ cardId: question.id, selectedOptionIds: sel(question).correctOptionIds, revealed: true });
    await expect(saveTestAnswer(attempt.id, question.id, [], db, now + 3)).rejects.toThrow(/revealed/);
    expect((await db.testAttempts.get(attempt.id))?.responses[0]).toEqual(restored.responses[0]);
  });
  it('serializes competing starts and keeps only one active attempt', async () => {
    const results = await Promise.allSettled([startTest(testFixturePack, options, db, now), startTest(testFixturePack, options, db, now)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(await db.testAttempts.count()).toBe(1);
  });
  it('keeps completed history, retries separately and rejects a retry while another test is active', async () => {
    const original = await startTest(testFixturePack, options, db, now);
    const finished = await finishTestAttempt(original.id, db, now + 1);
    const next = await retryTestAttempt(original.id, db, now + 2);
    expect(next.questions).toEqual(original.questions);
    expect(next.retryOf).toBe(original.id);
    expect(await db.testAttempts.get(original.id)).toEqual(finished);
    await expect(retryTestAttempt(original.id, db, now + 3)).rejects.toThrow(/current test/);
    expect(await db.testAttempts.count()).toBe(2);
  });
  it('reuses snapshot questions for retry even if the pack is no longer installed', async () => {
    const original = await startTest(testFixturePack, options, db, now);
    await finishTestAttempt(original.id, db, now + 1);
    const retry = await retryTestAttempt(original.id, db, now + 2);
    expect(retry.questions).toEqual(original.questions);
    expect(retry.responses.every(response => response.selectedOptionIds.length === 0 && !response.revealed)).toBe(true);
  });
  it('finalizes expired exams at their original deadlines on reopen', async () => {
    const attempt = await startTest(testFixturePack, { ...options, mode: 'exam', durationMinutes: 1 }, db, now);
    db.close(); await db.open();
    const completed = await expireTestAttempts(db, now + 999999);
    expect(completed).toHaveLength(1);
    expect(completed[0].completedAt).toBe(now + 60000);
    expect(completed[0].result).toEqual({ correct: 0, wrong: 0, skipped: 50 });
    expect(await expireTestAttempts(db, now + 1000000)).toEqual([]);
    expect((await loadWorkspace(db)).testAttempts[0].id).toBe(attempt.id);
  });
  it('commits expiry without committing a response received at or after the deadline', async () => {
    const attempt = await startTest(testFixturePack, { ...options, mode: 'exam', durationMinutes: 1 }, db, now);
    const question = attempt.questions[0].card;
    const late = await saveTestAnswer(attempt.id, question.id, sel(question).correctOptionIds, db, now + 60000);
    expect(late.completedAt).toBe(now + 60000);
    expect(late.responses[0].selectedOptionIds).toEqual([]);
    expect(await db.testAttempts.get(attempt.id)).toEqual(late);
  });
  it('does not replace a test until its expiry is explicitly persisted', async () => {
    await startTest(testFixturePack, { ...options, mode: 'exam', durationMinutes: 1 }, db, now);
    await expect(startTest(testFixturePack, options, db, now + 60001)).rejects.toThrow(/current test/);
    await expireTestAttempts(db, now + 60001);
    await startTest(testFixturePack, options, db, now + 60002);
    expect(await db.testAttempts.count()).toBe(2);
  });
  it('does not repeat exposed questions while enough unseen questions remain', async () => {
    const original = await startTest(testFixturePack, options, db, now);
    await finishTestAttempt(original.id, db, now + 1);
    const next = await startTest(testFixturePack, options, db, now + 2);
    const originalIds = new Set(original.questions.map(question => question.card.id));
    expect(next.questions.some(question => originalIds.has(question.card.id))).toBe(false);
  });
  it('does not change flashcard schedules, reviews, copies, settings or the active flashcard session', async () => {
    const deck = await createDeck('Independent flashcards', db);
    await addCardsToDeck(deck.id, fixturePack, [fixturePack.cards[0].id], db);
    await db.reviewSessions.put({ id: 'active', deckId: deck.id, copyId: null, turnId: 'turn', revealed: false, selectedOptionId: null, guessed: false, startedAt: now, shownAt: now });
    const before = await loadWorkspace(db);
    const attempt = await startTest(testFixturePack, options, db, now);
    await saveTestAnswer(attempt.id, attempt.questions[0].card.id, sel(attempt.questions[0].card).correctOptionIds, db, now + 1);
    await finishTestAttempt(attempt.id, db, now + 2);
    const after = await loadWorkspace(db);
    expect({ ...after, testAttempts: [], testExposures: [] }).toEqual({ ...before, testAttempts: [], testExposures: [] });
  });
  it('retains the saved response after a failed write and permits retry', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    const question = attempt.questions[0].card;
    const fail = () => { throw new Error('Simulated quota failure'); };
    db.testAttempts.hook('updating', fail);
    await expect(saveTestAnswer(attempt.id, question.id, sel(question).correctOptionIds, db, now + 1)).rejects.toThrow(/quota/);
    expect(await db.testAttempts.get(attempt.id)).toEqual(attempt);
    db.testAttempts.hook('updating').unsubscribe(fail);
    expect((await saveTestAnswer(attempt.id, question.id, sel(question).correctOptionIds, db, now + 2)).responses[0].selectedOptionIds).toEqual(sel(question).correctOptionIds);
  });
  it('retains an unfinished attempt when completion fails', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    db.testAttempts.hook('updating', () => { throw new Error('Simulated completion failure'); });
    await expect(finishTestAttempt(attempt.id, db, now + 1)).rejects.toThrow(/completion failure/);
    expect(await db.testAttempts.get(attempt.id)).toEqual(attempt);
  });
  it('completion is idempotent without additional writes', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    const completed = await finishTestAttempt(attempt.id, db, now + 1);
    db.testAttempts.hook('updating', () => { throw new Error('Unexpected write'); });
    expect(await finishTestAttempt(attempt.id, db, now + 2)).toEqual(completed);
  });
  it('rejects corrupt history without deleting or repairing it', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    const corrupt = { ...attempt, responses: [] };
    await db.testAttempts.put(corrupt);
    await expect(loadWorkspace(db)).rejects.toThrow(/exactly one response/);
    await expect(finishTestAttempt(attempt.id, db, now + 1)).rejects.toThrow();
    expect(await db.testAttempts.get(attempt.id)).toEqual(corrupt);
  });
  it('detects multiple active attempts rather than silently choosing one', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    await db.testAttempts.add({ ...attempt, id: 'second-invalid-active' });
    await expect(loadWorkspace(db)).rejects.toThrow(/multiple unfinished/);
    expect(await db.testAttempts.count()).toBe(2);
  });
  it('rejects invalid requests and unavailable IDs without writing', async () => {
    await expect(startTest(testFixturePack, { ...options, count: 301 }, db, now)).rejects.toThrow(/exceeds/);
    await expect(finishTestAttempt('missing', db, now)).rejects.toThrow(/not found/);
    expect(await db.testAttempts.count()).toBe(0);
  });
  it('abandons an unfinished test and allows a fresh attempt while preserving completed history and flashcards', async () => {
    const deck = await createDeck('Preserved deck', db);
    await addCardsToDeck(deck.id, fixturePack, [fixturePack.cards[0].id], db);
    const finished = await startTest(testFixturePack, options, db, now);
    await finishTestAttempt(finished.id, db, now + 1);
    const active = await startTest(testFixturePack, { ...options, mode: 'exam' }, db, now + 2);
    await saveTestAnswer(active.id, active.questions[0].card.id, sel(active.questions[0].card).correctOptionIds, db, now + 3);
    const before = await loadWorkspace(db);
    await abandonTestAttempt(active.id, db);
    db.close(); await db.open();
    expect(await loadWorkspace(db)).toEqual({ ...before, testAttempts: before.testAttempts.filter(item => item.id !== active.id) });
    const next = await startTest(testFixturePack, options, db, now + 4);
    expect(next.id).not.toBe(active.id);
    expect(await db.testAttempts.count()).toBe(2);
  });
  it('rejects abandoning completed or missing attempts without changing data', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    await finishTestAttempt(attempt.id, db, now + 1);
    const before = await loadWorkspace(db);
    await expect(abandonTestAttempt(attempt.id, db)).rejects.toThrow(/completed test/);
    await expect(abandonTestAttempt('missing', db)).rejects.toThrow(/not found/);
    expect(await loadWorkspace(db)).toEqual(before);
  });
  it('refuses to abandon an expired exam so its saved answers can still be scored', async () => {
    const attempt = await startTest(testFixturePack, { ...options, mode: 'exam' }, db, now);
    await saveTestAnswer(attempt.id, attempt.questions[0].card.id, sel(attempt.questions[0].card).correctOptionIds, db, now + 1);
    const before = await loadWorkspace(db);
    await expect(abandonTestAttempt(attempt.id, db, attempt.deadlineAt! + 1)).rejects.toThrow(/time limit/);
    expect(await loadWorkspace(db)).toEqual(before);
    const [scored] = await expireTestAttempts(db, attempt.deadlineAt! + 1);
    expect(scored.id).toBe(attempt.id);
    expect(scored.result?.correct).toBe(1);
  });
  it('keeps the unfinished attempt after a failed abandonment and permits retry', async () => {
    const attempt = await startTest(testFixturePack, options, db, now);
    await saveTestAnswer(attempt.id, attempt.questions[0].card.id, sel(attempt.questions[0].card).correctOptionIds, db, now + 1);
    const before = await loadWorkspace(db);
    const fail = () => { throw new Error('Simulated delete failure'); };
    db.testAttempts.hook('deleting', fail);
    await expect(abandonTestAttempt(attempt.id, db)).rejects.toThrow(/delete failure/);
    expect(await loadWorkspace(db)).toEqual(before);
    await expect(startTest(testFixturePack, options, db, now + 2)).rejects.toThrow(/current test/);
    db.testAttempts.hook('deleting').unsubscribe(fail);
    await abandonTestAttempt(attempt.id, db);
    expect(await db.testAttempts.count()).toBe(0);
  });
});
