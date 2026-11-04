import { engineeringQuestionBank as testFixturePack } from '../../src/content/engineeringQuestionBank';
import { createTestAttempt, completeTestAttempt } from '../../src/testEngine';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixturePack } from '../../src/content/fixtures';
import { getMistakes } from '../../src/library';
import { refreshReview, revealReview, startReview, submitReview, undoLastReview } from '../../src/reviewStorage';
import { createDatabase, createDeck, addCardsToDeck, loadWorkspace, type TsukiakariDatabase } from '../../src/storage';

let db: TsukiakariDatabase;
const now = Date.parse('2026-10-20T12:00:00Z');
beforeEach(() => { db = createDatabase('library-' + crypto.randomUUID()); });
afterEach(async () => { await db.delete(); });
async function deck() {
  const created = await createDeck('Deck', db);
  await addCardsToDeck(created.id, fixturePack, [fixturePack.cards[0].id], db);
  return created;
}
async function answer(deckId: string, rating: 'again' | 'right', at = now) {
  let session = await startReview(deckId, at, db);
  if (!session.copyId) session = await refreshReview(session.turnId, at, db);
  if (!session.revealed) await revealReview(session.turnId, null, false, db);
  await submitReview({ turnId: session.turnId, rating, durationMs: 1000 }, at, db);
  return session.copyId!;
}
describe('Mistakes from flashcard history', () => {
  it('counts Again attempts independently from lapses, retains resolved history, and ignores undone answers', async () => {
    const created = await deck();
    const copyId = await answer(created.id, 'again');
    await answer(created.id, 'again', now + 60_000);
    await answer(created.id, 'right', now + 120_000);
    let workspace = await loadWorkspace(db);
    const original = structuredClone(workspace);
    expect(getMistakes(workspace)).toEqual([{
      copy: workspace.copies[0], againCount: 2, lastAgainAt: now + 60_000,
      lastRating: 'right', leech: false, lapses: 0,
    }]);
    expect(workspace).toEqual(original);
    await undoLastReview(now + 120_000, db);
    workspace = await loadWorkspace(db);
    expect(getMistakes(workspace)[0]).toMatchObject({ againCount: 2, lastRating: 'again' });
    expect(workspace.schedulerStates.find(state => state.copyId === copyId)?.lapses).toBe(0);
  });
  it('isolates deck copies, sorts latest errors, and hides removed or archived copies', async () => {
    const first = await deck(); const second = await deck();
    const firstId = await answer(first.id, 'again');
    const secondId = await answer(second.id, 'again', now + 1);
    let workspace = await loadWorkspace(db);
    expect(getMistakes(workspace).map(item => item.copy.id)).toEqual([secondId, firstId]);
    await db.copies.update(secondId, { suspended: true, tags: ['leech'] });
    workspace = await loadWorkspace(db);
    expect(getMistakes(workspace)[0]).toMatchObject({ leech: true, copy: { suspended: true } });
    await db.copies.update(secondId, { removed: true });
    await db.decks.update(first.id, { archived: true });
    expect(getMistakes(await loadWorkspace(db))).toEqual([]);
  });
  it('does not include a fully undone mistake or an independent failed practice test', async () => {
    const created = await deck();
    await answer(created.id, 'again');
    await undoLastReview(now, db);
    const attempt = completeTestAttempt(createTestAttempt(testFixturePack, { mode: 'practice', count: 50, durationMinutes: 120, fixturePreview: true }, [], now), now);
    await db.testAttempts.add(attempt);
    expect(getMistakes(await loadWorkspace(db))).toEqual([]);
    expect(await db.testAttempts.get(attempt.id)).toEqual(attempt);
  });
});
