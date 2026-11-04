import { engineeringQuestionBank as testFixturePack } from '../../src/content/engineeringQuestionBank';
import { createTestAttempt, completeTestAttempt, answerTestAttempt } from '../../src/testEngine';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixturePack } from '../../src/content/fixtures';
import { defaultPreferences, type DeckSettings, type ReviewSession, type SchedulerState } from '../../src/domain';
import { getDeckQueue, initialState } from '../../src/scheduling';
import { addCardsToDeck, createDatabase, createDeck, loadWorkspace, savePreferences, type TsukiakariDatabase } from '../../src/storage';
import {
  refreshReview, revealReview, saveDeckSettings, setCopySuspended,
  startReview, submitReview, undoLastReview,
} from '../../src/reviewStorage';

const now = Date.parse('2026-10-20T12:00:00Z');
const minute = 60_000;
const day = 24 * 60 * minute;
const recallIds = fixturePack.cards.filter(card => card.kind === 'recall').map(card => card.id);
const mcq = fixturePack.cards.find(card => card.kind === 'mcq')!;
let db: TsukiakariDatabase;
beforeEach(() => { db = createDatabase(`tsukiakari-review-unit-${crypto.randomUUID()}`); });
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });

async function deckWith(cardIds = [recallIds[0]], settings: Partial<DeckSettings> = {}) {
  const deck = await createDeck('Study', db);
  await savePreferences({ ...defaultPreferences(), timeZone: 'UTC', dayStartsAtHour: 5 }, db);
  await addCardsToDeck(deck.id, fixturePack, cardIds, db);
  await saveDeckSettings(deck.id, { ...deck.settings, ...settings }, db);
  return (await db.decks.get(deck.id))!;
}
async function reveal(session: ReviewSession, selectedOptionId: string | null = null, guessed = false) {
  return revealReview(session.turnId, selectedOptionId, guessed, db);
}
async function answer(session: ReviewSession, rating: 'again' | 'right' = 'right', at = now) {
  if (!session.revealed) await reveal(session);
  return submitReview({ turnId: session.turnId, rating, durationMs: 4500 }, at, db);
}
function mature(copyId: string, lapses = 0): SchedulerState {
  return {
    ...initialState(copyId), state: 'review', dueAt: now - day,
    stability: 3, difficulty: 5, repetitions: 20, lapses,
    elapsedDays: 3, scheduledDays: 2, lastReviewAt: now - 3 * day,
  };
}
async function dump() {
  return Promise.all(db.tables.map(table => table.toArray()));
}

describe('atomic review persistence', () => {
  it('starts without seeding schedules and resumes a revealed answer across reopen', async () => {
    const deck = await deckWith();
    const session = await startReview(deck.id, now, db);
    expect(session.copyId).not.toBeNull();
    expect(await db.schedulerStates.count()).toBe(0);
    expect(await db.reviewLogs.count()).toBe(0);
    const revealed = await reveal(session);
    db.close(); await db.open();
    expect((await loadWorkspace(db)).session).toEqual(revealed);
    expect(await startReview(deck.id, now + minute, db)).toEqual(revealed);
  });

  it('commits state, audit context, quota and the next turn together', async () => {
    const deck = await deckWith();
    const originalCopy = (await db.copies.toArray())[0];
    const session = await startReview(deck.id, now, db);
    const revealed = await reveal(session);
    const next = await submitReview({ turnId: session.turnId, rating: 'right', durationMs: 4200 }, now, db);
    const workspace = await loadWorkspace(db);
    expect(next).toMatchObject({ copyId: null, revealed: false, selectedOptionId: null, guessed: false });
    expect(next.turnId).not.toBe(session.turnId);
    expect(workspace.schedulerStates[0]).toMatchObject({ copyId: originalCopy.id, state: 'learning', dueAt: now + 10 * minute, repetitions: 1 });
    expect(workspace.reviewLogs[0]).toMatchObject({
      sequence: 1, undoable: true, undone: false, rating: 'right', durationMs: 4200,
      studyDay: '2026-10-20', timeZone: 'UTC', dayStartsAtHour: 5,
      before: initialState(originalCopy.id), settings: deck.settings,
      sessionBefore: revealed, sessionAfter: next, copyBefore: originalCopy,
    });
    expect(getDeckQueue(workspace, deck.id, now)).toMatchObject({ newUsed: 1, reviewsUsed: 0, newRemaining: 19 });
    expect(await db.testAttempts.count()).toBe(0);
  });

  it('rejects an unrevealed rating and duplicate or stale submissions without side effects', async () => {
    const deck = await deckWith();
    const session = await startReview(deck.id, now, db);
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow(/Reveal/);
    await answer(session);
    const saved = await dump();
    await expect(submitReview({ turnId: session.turnId, rating: 'again', durationMs: 1 }, now, db)).rejects.toThrow(/already changed/);
    await expect(revealReview(session.turnId, null, false, db)).rejects.toThrow(/already changed/);
    expect(await dump()).toEqual(saved);
  });

  it('serializes two simultaneous answers so only one commits', async () => {
    const deck = await deckWith();
    const session = await startReview(deck.id, now, db); await reveal(session);
    const results = await Promise.allSettled([
      submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db),
      submitReview({ turnId: session.turnId, rating: 'again', durationMs: 1 }, now, db),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(await db.reviewLogs.count()).toBe(1);
    expect((await db.schedulerStates.toArray())[0].repetitions).toBe(1);
  });

  it.each(['log', 'session'] as const)('rolls back every review effect after a %s write fails', async failure => {
    const deck = await deckWith();
    const session = await startReview(deck.id, now, db); await reveal(session);
    const before = await dump();
    const failureHook = () => { throw new Error('Simulated review write failure'); };
    if (failure === 'log') db.reviewLogs.hook('creating', failureHook);
    else db.reviewSessions.hook('updating', failureHook);
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 100 }, now, db)).rejects.toThrow(/Simulated/);
    expect(await dump()).toEqual(before);
    if (failure === 'log') db.reviewLogs.hook('creating').unsubscribe(failureHook);
    else db.reviewSessions.hook('updating').unsubscribe(failureHook);
    await submitReview({ turnId: session.turnId, rating: 'right', durationMs: 100 }, now, db);
    expect(await db.reviewLogs.count()).toBe(1);
  });

  it('keeps review copies and quotas independent across two decks containing the same card', async () => {
    const first = await deckWith(undefined, { newCardsPerDay: 1 });
    const second = await deckWith(undefined, { newCardsPerDay: 2 });
    const firstSession = await startReview(first.id, now, db); await answer(firstSession);
    const workspace = await loadWorkspace(db);
    expect(workspace.schedulerStates).toHaveLength(1);
    expect(getDeckQueue(workspace, first.id, now)).toMatchObject({ newUsed: 1, newRemaining: 0 });
    expect(getDeckQueue(workspace, second.id, now)).toMatchObject({ newUsed: 0, newRemaining: 2 });
    const otherCopy = workspace.copies.find(copy => copy.deckId === second.id)!;
    expect(workspace.schedulerStates.find(state => state.copyId === otherCopy.id)).toBeUndefined();
    expect(otherCopy).toMatchObject({ tags: [], suspended: false });
  });

  it('enforces the new-card cap, allows learning repeats, and renews the allowance at 5am', async () => {
    const deck = await deckWith(recallIds.slice(0, 2), { newCardsPerDay: 1, maximumReviewsPerDay: 0 });
    const session = await startReview(deck.id, now, db);
    const waiting = await answer(session, 'again');
    expect(waiting.copyId).toBeNull();
    expect(getDeckQueue(await loadWorkspace(db), deck.id, now).newIds).toEqual([]);
    const refreshed = await refreshReview(waiting.turnId, now + minute, db);
    expect(refreshed.copyId).toBe(session.copyId);
    await answer(refreshed, 'again', now + minute);
    const beforeBoundary = Date.parse('2026-10-21T04:59:59Z');
    const afterBoundary = Date.parse('2026-10-21T05:00:00Z');
    expect(getDeckQueue(await loadWorkspace(db), deck.id, beforeBoundary).newIds).toHaveLength(0);
    expect(getDeckQueue(await loadWorkspace(db), deck.id, afterBoundary).newIds).toHaveLength(1);
    expect(getDeckQueue(await loadWorkspace(db), deck.id, afterBoundary).newUsed).toBe(0);
  });

  it('caps review-stage answers without blocking relearning or discarding overdue cards', async () => {
    const deck = await deckWith(recallIds.slice(0, 2), { newCardsPerDay: 0, maximumReviewsPerDay: 1 });
    const copies = await db.copies.toArray();
    await db.schedulerStates.bulkPut(copies.map(copy => mature(copy.id)));
    const session = await startReview(deck.id, now, db);
    const waiting = await answer(session, 'again');
    expect(waiting.copyId).toBeNull();
    const queue = getDeckQueue(await loadWorkspace(db), deck.id, now);
    expect(queue).toMatchObject({ reviewsUsed: 1, reviewRemaining: 0, reviewIds: [] });
    const untouched = copies.find(copy => copy.id !== session.copyId)!;
    expect(await db.schedulerStates.get(untouched.id)).toEqual(mature(untouched.id));
    const refreshed = await refreshReview(waiting.turnId, now + 10 * minute, db);
    expect(refreshed.copyId).toBe(session.copyId);
    await answer(refreshed, 'right', now + 10 * minute);
    expect(getDeckQueue(await loadWorkspace(db), deck.id, now + 10 * minute).reviewsUsed).toBe(1);
  });

  it('rejects an ineligible card even if a stale stored turn exists', async () => {
    const deck = await deckWith();
    const session = await startReview(deck.id, now, db); await reveal(session);
    await db.decks.put({ ...deck, settings: { ...deck.settings, newCardsPerDay: 0 } });
    const before = await dump();
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow(/daily limits/);
    expect(await dump()).toEqual(before);
  });

  it('restores new state, quota and the revealed turn with a new command token on undo', async () => {
    const deck = await deckWith(undefined, { newCardsPerDay: 1 });
    const session = await startReview(deck.id, now, db);
    const revealed = await reveal(session);
    await submitReview({ turnId: session.turnId, rating: 'right', durationMs: 500 }, now, db);
    db.close(); await db.open();
    const restored = await undoLastReview(now + minute, db);
    expect(restored).toEqual({ ...revealed, turnId: restored.turnId, shownAt: now + minute });
    expect(restored.turnId).not.toBe(session.turnId);
    const workspace = await loadWorkspace(db);
    expect(workspace.schedulerStates).toEqual([initialState(session.copyId!)]);
    expect(workspace.reviewLogs[0]).toMatchObject({ undone: true, undoable: false, sequence: 1 });
    expect(getDeckQueue(workspace, deck.id, now + minute)).toMatchObject({ newUsed: 0, newRemaining: 1 });
    await expect(undoLastReview(now + minute, db)).rejects.toThrow(/no review available/);
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now + minute, db)).rejects.toThrow(/already changed/);
    await submitReview({ turnId: restored.turnId, rating: 'again', durationMs: 1200 }, now + minute, db);
    expect((await db.reviewLogs.toArray()).map(log => log.sequence).sort()).toEqual([1, 2]);
    expect((await db.reviewLogs.toArray()).filter(log => log.undoable)).toHaveLength(1);
  });

  it('does not offer a second older undo after undoing the most recent review', async () => {
    const deck = await deckWith(recallIds.slice(0, 2));
    const first = await startReview(deck.id, now, db);
    const second = await answer(first);
    await answer(second);
    await undoLastReview(now, db);
    expect((await db.reviewLogs.toArray()).filter(log => log.undoable)).toEqual([]);
    await expect(undoLastReview(now, db)).rejects.toThrow(/no review available/);
  });

  it('rolls back an undo failure while retaining its retry opportunity', async () => {
    const deck = await deckWith();
    await answer(await startReview(deck.id, now, db));
    const before = await dump();
    const fail = () => { throw new Error('Simulated undo write failure'); };
    db.reviewSessions.hook('updating', fail);
    await expect(undoLastReview(now, db)).rejects.toThrow(/Simulated/);
    expect(await dump()).toEqual(before);
    db.reviewSessions.hook('updating').unsubscribe(fail);
    await undoLastReview(now, db);
    expect((await db.reviewLogs.toArray())[0].undone).toBe(true);
  });

  it('suspends a leech at ten review lapses and undo restores its tags, state and allowance', async () => {
    const deck = await deckWith(undefined, { maximumReviewsPerDay: 1 });
    const copy = (await db.copies.toArray())[0];
    await db.copies.update(copy.id, { tags: ['personal'], personalNote: 'Keep me' });
    const before = mature(copy.id, 9); await db.schedulerStates.put(before);
    const session = await startReview(deck.id, now, db); await answer(session, 'again');
    expect(await db.copies.get(copy.id)).toMatchObject({ suspended: true, tags: ['personal', 'leech'], personalNote: 'Keep me' });
    expect(await db.schedulerStates.get(copy.id)).toMatchObject({ state: 'relearning', lapses: 10 });
    expect(getDeckQueue(await loadWorkspace(db), deck.id, now)).toMatchObject({ suspendedCount: 1, reviewsUsed: 1 });
    await undoLastReview(now, db);
    expect(await db.copies.get(copy.id)).toMatchObject({ suspended: false, tags: ['personal'], personalNote: 'Keep me' });
    expect(await db.schedulerStates.get(copy.id)).toEqual(before);
    expect(getDeckQueue(await loadWorkspace(db), deck.id, now)).toMatchObject({ suspendedCount: 0, reviewsUsed: 0 });
  });

  it('supports tag-only leeches and does not count repeated relearning errors as lapses', async () => {
    const deck = await deckWith(undefined, { leechThreshold: 1, leechAction: 'tag' });
    const copy = (await db.copies.toArray())[0]; await db.schedulerStates.put(mature(copy.id));
    let session = await startReview(deck.id, now, db);
    session = await answer(session, 'again');
    expect(await db.copies.get(copy.id)).toMatchObject({ suspended: false, tags: ['leech'] });
    session = await refreshReview(session.turnId, now + 10 * minute, db);
    await answer(session, 'again', now + 10 * minute);
    expect(await db.schedulerStates.get(copy.id)).toMatchObject({ state: 'relearning', lapses: 1 });
    expect((await db.copies.get(copy.id))?.tags).toEqual(['leech']);
  });

  it('does not mark repeated initial learning errors as leeches', async () => {
    const deck = await deckWith(undefined, { leechThreshold: 1 });
    let session = await startReview(deck.id, now, db);
    for (let i = 0; i < 3; i++) {
      session = await answer(session, 'again', now + i * minute);
      if (i < 2) session = await refreshReview(session.turnId, now + (i + 1) * minute, db);
    }
    expect((await db.schedulerStates.toArray())[0]).toMatchObject({ lapses: 0, repetitions: 3 });
    expect((await db.copies.toArray())[0]).toMatchObject({ tags: [], suspended: false });
  });

  it('preserves history on unsuspension and suspends again at the next qualifying lapse', async () => {
    const deck = await deckWith(undefined, { leechThreshold: 1 });
    const copy = (await db.copies.toArray())[0]; await db.schedulerStates.put(mature(copy.id));
    let session = await startReview(deck.id, now, db);
    session = await answer(session, 'again');
    const lapsed = (await db.schedulerStates.get(copy.id))!;
    await setCopySuspended(copy.id, false, now, db);
    expect(await db.schedulerStates.get(copy.id)).toEqual(lapsed);
    expect(await db.copies.get(copy.id)).toMatchObject({ suspended: false, tags: ['leech'] });
    await expect(undoLastReview(now, db)).rejects.toThrow(/no review available/);
    for (let step = 0; step < 3; step++) {
      const state = (await db.schedulerStates.get(copy.id))!;
      if (state.state === 'review') break;
      session = (await loadWorkspace(db)).session!;
      session = await refreshReview(session.turnId, state.dueAt!, db);
      await answer(session, 'right', state.dueAt!);
    }
    const graduated = (await db.schedulerStates.get(copy.id))!;
    expect(graduated.state).toBe('review');
    session = (await loadWorkspace(db)).session!;
    session = await refreshReview(session.turnId, graduated.dueAt!, db);
    await answer(session, 'again', graduated.dueAt!);
    expect(await db.schedulerStates.get(copy.id)).toMatchObject({ lapses: 2 });
    expect(await db.copies.get(copy.id)).toMatchObject({ suspended: true, tags: ['leech'] });
  });

  it('suspends the current card atomically and selects the next without writing a review', async () => {
    const deck = await deckWith(recallIds.slice(0, 2));
    const session = await startReview(deck.id, now, db); await reveal(session);
    await setCopySuspended(session.copyId!, true, now, db);
    const workspace = await loadWorkspace(db);
    expect(workspace.session?.copyId).not.toBe(session.copyId);
    expect(workspace.session?.revealed).toBe(false);
    expect(workspace.reviewLogs).toEqual([]);
    expect(workspace.schedulerStates).toEqual([]);
    const before = await dump();
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow(/already changed/);
    expect(await dump()).toEqual(before);
  });

  it('freezes MCQ selections and requires Again for a wrong answer', async () => {
    const deck = await deckWith([mcq.id]);
    const session = await startReview(deck.id, now, db);
    await expect(reveal(session)).rejects.toThrow(/Select an answer/);
    await expect(reveal(session, 'missing-option')).rejects.toThrow(/Select an answer/);
    const wrong = mcq.options!.find(option => option.id !== mcq.correctOptionId)!.id;
    await reveal(session, wrong);
    await expect(reveal(session, mcq.correctOptionId!)).rejects.toThrow(/already revealed/);
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow(/incorrect/);
    expect(await db.reviewLogs.count()).toBe(0);
    await submitReview({ turnId: session.turnId, rating: 'again', durationMs: 1 }, now, db);
    expect((await db.reviewLogs.toArray())[0]).toMatchObject({ rating: 'again', sessionBefore: { selectedOptionId: wrong, guessed: false } });
  });

  it('allows Again after a correct guessed MCQ and retains the guess in its log', async () => {
    const deck = await deckWith([mcq.id]);
    const session = await startReview(deck.id, now, db);
    await reveal(session, mcq.correctOptionId!, true);
    await submitReview({ turnId: session.turnId, rating: 'again', durationMs: 1 }, now, db);
    expect((await db.reviewLogs.toArray())[0]).toMatchObject({ rating: 'again', sessionBefore: { selectedOptionId: mcq.correctOptionId, guessed: true } });
  });

  it('settings update only the chosen deck, preserve schedules, and clear its current turn and undo', async () => {
    const first = await deckWith(); const second = await deckWith();
    await answer(await startReview(first.id, now, db));
    const schedule = await db.schedulerStates.toArray();
    const secondBefore = await db.decks.get(second.id);
    await saveDeckSettings(first.id, { ...first.settings, desiredRetention: 0.85, newCardsPerDay: 3 }, db);
    expect(await db.schedulerStates.toArray()).toEqual(schedule);
    expect(await db.decks.get(second.id)).toEqual(secondBefore);
    expect((await db.decks.get(first.id))?.settings).toMatchObject({ desiredRetention: 0.85, newCardsPerDay: 3 });
    expect(await db.reviewSessions.count()).toBe(0);
    await expect(undoLastReview(now, db)).rejects.toThrow(/no review available/);
    const saved = await dump();
    await expect(saveDeckSettings(first.id, { ...first.settings, learningStepsMinutes: [10, 1] }, db)).rejects.toThrow();
    expect(await dump()).toEqual(saved);
  });

  it('does not interrupt another deck when changing settings in a separate deck', async () => {
    const first = await deckWith(); const second = await deckWith();
    const session = await startReview(first.id, now, db); await reveal(session);
    const beforeSession = (await loadWorkspace(db)).session;
    await saveDeckSettings(second.id, { ...second.settings, newCardsPerDay: 5 }, db);
    expect((await loadWorkspace(db)).session).toEqual(beforeSession);
  });

  it('switching decks expires undo and rejects the previous turn token', async () => {
    const first = await deckWith(); const second = await deckWith();
    const session = await startReview(first.id, now, db); await answer(session);
    await startReview(second.id, now, db);
    await expect(undoLastReview(now, db)).rejects.toThrow(/no review available/);
    await expect(revealReview(session.turnId, null, false, db)).rejects.toThrow(/already changed/);
  });

  it('never allows independent test results to consume review quotas or change scheduling', async () => {
    const deck = await deckWith([mcq.id]);
    const started = createTestAttempt(testFixturePack, { mode: 'practice', count: 50, durationMinutes: 120, fixturePreview: true }, [], now);
    const question = started.questions[0].card;
    const wrongOption = question.options.find(option => !question.correctOptionIds.includes(option.id))!.id;
    const attempt = completeTestAttempt(answerTestAttempt(started, question.id, [wrongOption], now), now);
    await db.testAttempts.add(attempt);
    const session = await startReview(deck.id, now, db);
    const workspace = await loadWorkspace(db);
    expect(session.copyId).not.toBeNull();
    expect(workspace.schedulerStates).toEqual([]);
    expect(workspace.reviewLogs).toEqual([]);
    expect(workspace.copies[0]).toMatchObject({ tags: [], suspended: false });
    expect(getDeckQueue(workspace, deck.id, now)).toMatchObject({ newUsed: 0, reviewsUsed: 0 });
    expect(await db.testAttempts.get(attempt.id)).toEqual(attempt);
  });

  it('rejects missing published content, malformed input and a backwards clock without destructive repairs', async () => {
    const deck = await deckWith();
    const session = await startReview(deck.id, now, db); await reveal(session);
    const before = await dump();
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: -1 }, now, db)).rejects.toThrow();
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now - 1, db)).rejects.toThrow(/clock/);
    expect(await dump()).toEqual(before);
    const copy = (await db.copies.toArray())[0];
    await db.copies.update(copy.id, { cardId: 'missing-published-card' });
    const unavailable = await dump();
    await expect(startReview(deck.id, now, db)).rejects.toThrow(/unavailable/);
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow(/unavailable/);
    expect(await dump()).toEqual(unavailable);
  });

  it('rejects inconsistent stored undo history rather than silently offering the wrong undo', async () => {
    const deck = await deckWith(recallIds.slice(0, 2));
    const first = await startReview(deck.id, now, db);
    const second = await answer(first); await answer(second);
    const logs = await db.reviewLogs.toArray();
    await db.reviewLogs.put({ ...logs.find(log => log.sequence === 1)!, undoable: true });
    await expect(loadWorkspace(db)).rejects.toThrow(/undo history/);
    expect(await db.reviewLogs.count()).toBe(2);
  });
});
