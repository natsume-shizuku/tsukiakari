import { engineeringQuestionBank as testFixturePack } from '../../src/content/engineeringQuestionBank';
import { createTestAttempt } from '../../src/testEngine';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { studyPacks } from '../../src/content/catalog';
import { fixturePack } from '../../src/content/fixtures';
import { deleteDeck, addSelectionToDeck, removeCardsFromDeck, renameDeck, saveCopyAnnotations, setDeckArchived } from '../../src/collectionStorage';
import { revealReview, startReview, submitReview, undoLastReview } from '../../src/reviewStorage';
import { getDeckQueue } from '../../src/scheduling';
import { addCardsToDeck, createDatabase, createDeck, loadWorkspace, type TsukiakariDatabase } from '../../src/storage';

let db: TsukiakariDatabase;
const now = Date.parse('2026-10-20T12:00:00Z');
const ids = fixturePack.cards.filter(card => card.kind === 'recall').map(card => card.id);
beforeEach(() => { db = createDatabase('collection-' + crypto.randomUUID()); });
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
async function setup(count = 1) {
  const deck = await createDeck('Original', db);
  await addCardsToDeck(deck.id, fixturePack, ids.slice(0, count), db);
  return deck;
}
async function answer(deckId: string) {
  const session = await startReview(deckId, now, db);
  await revealReview(session.turnId, null, false, db);
  await submitReview({ turnId: session.turnId, rating: 'again', durationMs: 1000 }, now, db);
  return session;
}
const dump = () => Promise.all(db.tables.map(table => table.toArray()));

describe('Phase 7G collection corrections', () => {
  it('never gives a typed leech tag system protection, and keeps a real one', async () => {
    await setup();
    const copy = (await db.copies.toArray())[0];
    await saveCopyAnnotations(copy.id, { personalNote: '', tags: ['leech', 'Leech', 'mine'] }, db);
    expect((await db.copies.get(copy.id))?.tags).toEqual(['mine']);
    await saveCopyAnnotations(copy.id, { personalNote: '', tags: [] }, db);
    expect((await db.copies.get(copy.id))?.tags).toEqual([]);
    await db.copies.update(copy.id, { tags: ['leech'] });
    await saveCopyAnnotations(copy.id, { personalNote: '', tags: ['mine'] }, db);
    expect((await db.copies.get(copy.id))?.tags).toEqual(['mine', 'leech']);
  });
  it('re-adding a removed card keeps its suspension', async () => {
    const deck = await setup();
    const copy = (await db.copies.toArray())[0];
    await db.copies.update(copy.id, { suspended: true });
    await removeCardsFromDeck(deck.id, [copy.id], db);
    await addCardsToDeck(deck.id, fixturePack, [copy.cardId], db);
    expect(await db.copies.get(copy.id)).toMatchObject({ suspended: true });
    expect((await db.copies.get(copy.id))?.removed).toBeFalsy();
  });
});

describe('Phase 3 collection transactions', () => {
  it('accepts old records without flags and renames without changing a revealed review', async () => {
    const deck = await setup();
    const session = await startReview(deck.id, now, db);
    const revealed = await revealReview(session.turnId, null, false, db);
    await renameDeck(deck.id, '  Midnight  ', db);
    expect((await loadWorkspace(db)).decks[0]).toEqual({ ...deck, name: 'Midnight' });
    expect((await loadWorkspace(db)).session).toEqual(revealed);
    await expect(renameDeck(deck.id, ' ', db)).rejects.toThrow();
    expect((await db.decks.get(deck.id))?.name).toBe('Midnight');
  });
  it('archives without deleting records and restores the same quota and schedule', async () => {
    const deck = await setup();
    await answer(deck.id);
    const before = await loadWorkspace(db);
    await setDeckArchived(deck.id, true, db);
    const archived = await loadWorkspace(db);
    expect(archived.copies).toEqual(before.copies);
    expect(archived.schedulerStates).toEqual(before.schedulerStates);
    expect(archived.session).toBeNull();
    expect(getDeckQueue(archived, deck.id, now + 60_000)).toMatchObject({ orderedIds: [], newRemaining: 0, reviewRemaining: 0, newUsed: 1 });
    await expect(startReview(deck.id, now, db)).rejects.toThrow(/archived/);
    await expect(addCardsToDeck(deck.id, fixturePack, [ids[1]], db)).rejects.toThrow(/archived/);
    await expect(undoLastReview(now, db)).rejects.toThrow(/no review/);
    await setDeckArchived(deck.id, false, db);
    const restored = await loadWorkspace(db);
    expect(getDeckQueue(restored, deck.id, now + 60_000)).toMatchObject({ learningIds: [before.copies[0].id], newUsed: 1 });
  });
  it('does not interrupt another deck session or undo when archiving a different deck', async () => {
    const first = await setup(); const second = await setup();
    await answer(first.id);
    const before = await loadWorkspace(db);
    await setDeckArchived(second.id, true, db);
    expect((await loadWorkspace(db)).session).toEqual(before.session);
    expect(await db.reviewLogs.toArray()).toEqual(before.reviewLogs);
    await undoLastReview(now, db);
  });
  it('soft-removes and re-adds the same copy with all progress and notes retained', async () => {
    const deck = await setup();
    const session = await answer(deck.id);
    await saveCopyAnnotations(session.copyId!, { personalNote: 'Keep me', tags: ['Keep'] }, db);
    const before = await loadWorkspace(db);
    await removeCardsFromDeck(deck.id, [session.copyId!], db);
    expect(getDeckQueue(await loadWorkspace(db), deck.id, now + 60_000).orderedIds).toEqual([]);
    await addSelectionToDeck(deck.id, [{ packId: fixturePack.id, cardId: ids[0] }], db);
    const restored = await loadWorkspace(db);
    expect(restored.copies).toEqual([{ ...before.copies[0], removed: false }]);
    expect(restored.schedulerStates).toEqual(before.schedulerStates);
    expect(restored.reviewLogs).toEqual(before.reviewLogs);
    expect(getDeckQueue(restored, deck.id, now + 60_000)).toMatchObject({ newUsed: 1, learningIds: [session.copyId] });
  });
  it('removing the current card expires the turn; a stale answer cannot save', async () => {
    const deck = await setup();
    const session = await startReview(deck.id, now, db);
    await revealReview(session.turnId, null, false, db);
    await removeCardsFromDeck(deck.id, [session.copyId!], db);
    expect((await loadWorkspace(db)).session).toBeNull();
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow(/already changed/);
    expect(await db.reviewLogs.count()).toBe(0);
  });
  it('rejects wrong-deck and missing removal IDs without partial changes', async () => {
    const deck = await setup(); const other = await setup();
    const copies = await db.copies.toArray();
    const own = copies.find(copy => copy.deckId === deck.id)!;
    const foreign = copies.find(copy => copy.deckId === other.id)!;
    const before = await dump();
    await expect(removeCardsFromDeck(deck.id, [own.id, foreign.id], db)).rejects.toThrow(/belong/);
    await expect(removeCardsFromDeck(deck.id, [own.id, 'missing'], db)).rejects.toThrow(/belong/);
    await expect(removeCardsFromDeck(deck.id, [own.id, own.id], db)).rejects.toThrow(/unique/);
    expect(await dump()).toEqual(before);
  });
  it('normalizes annotations, protects leech, and retains the active revealed answer', async () => {
    const deck = await setup();
    const copy = (await db.copies.toArray())[0];
    await db.copies.update(copy.id, { tags: ['leech'] });
    const session = await startReview(deck.id, now, db);
    const revealed = await revealReview(session.turnId, null, false, db);
    await saveCopyAnnotations(copy.id, { personalNote: '  Remember this  ', tags: [' Work ', 'work', '', 'LEECH'] }, db);
    expect(await db.copies.get(copy.id)).toMatchObject({ personalNote: 'Remember this', tags: ['Work', 'leech'] });
    expect((await loadWorkspace(db)).session).toEqual(revealed);
    expect(await db.reviewLogs.count()).toBe(0);
    expect(await db.schedulerStates.count()).toBe(0);
  });
  it('expires only matching-copy undo without changing the current turn', async () => {
    const deck = await setup(2);
    const answered = await answer(deck.id);
    const before = await loadWorkspace(db);
    const other = before.copies.find(copy => copy.id !== answered.copyId)!;
    await saveCopyAnnotations(other.id, { personalNote: 'Other', tags: [] }, db);
    expect((await db.reviewLogs.toArray())[0].undoable).toBe(true);
    await saveCopyAnnotations(answered.copyId!, { personalNote: 'Reviewed', tags: ['saved'] }, db);
    expect((await db.reviewLogs.toArray())[0].undoable).toBe(false);
    expect((await loadWorkspace(db)).session).toEqual(before.session);
    await expect(undoLastReview(now, db)).rejects.toThrow(/no review/);
    expect((await db.copies.get(answered.copyId!))?.personalNote).toBe('Reviewed');
  });
  it('rejects oversized annotation input and rolls back a later undo-log failure', async () => {
    const deck = await setup(); const answered = await answer(deck.id);
    const before = await dump();
    for (const input of [
      { personalNote: 'x'.repeat(20_001), tags: [] },
      { personalNote: '', tags: ['x'.repeat(61)] },
      { personalNote: '', tags: Array.from({ length: 31 }, (_, i) => String(i)) },
    ]) await expect(saveCopyAnnotations(answered.copyId!, input, db)).rejects.toThrow();
    vi.spyOn(db.reviewLogs, 'bulkPut').mockRejectedValueOnce(new Error('blocked log write'));
    await expect(saveCopyAnnotations(answered.copyId!, { personalNote: 'Must roll back', tags: [] }, db)).rejects.toThrow(/blocked/);
    expect(await dump()).toEqual(before);
  });
  it('adds selections across packs atomically and rolls back restore when a later pack fails', async () => {
    const deck = await setup();
    const copy = (await db.copies.toArray())[0];
    await removeCardsFromDeck(deck.id, [copy.id], db);
    const secondPack = { ...structuredClone(fixturePack), id: 'second-fixture' };
    studyPacks.push(secondPack);
    try {
      const selections = [
        { packId: fixturePack.id, cardId: ids[0] },
        { packId: secondPack.id, cardId: ids[1] },
      ];
      const before = await dump();
      const fail = (_key: unknown, item: { packId: string }) => { if (item.packId === secondPack.id) throw new Error('Second pack failed'); };
      db.copies.hook('creating', fail);
      await expect(addSelectionToDeck(deck.id, selections, db)).rejects.toThrow(/Second pack failed/);
      expect(await dump()).toEqual(before);
      db.copies.hook('creating').unsubscribe(fail);
      await addSelectionToDeck(deck.id, selections, db);
      expect(await db.copies.count()).toBe(2);
      expect(await db.copies.get(copy.id)).toMatchObject({ removed: false });
    } finally { studyPacks.pop(); }
  });
  it('rejects unknown catalog selections and corrupted storage without repairs', async () => {
    const deck = await setup();
    const before = await dump();
    await expect(addSelectionToDeck(deck.id, [
      { packId: fixturePack.id, cardId: ids[1] }, { packId: 'unknown', cardId: ids[0] },
    ], db)).rejects.toThrow(/unavailable/);
    expect(await dump()).toEqual(before);
    await db.table('decks').put({ ...deck, settings: { ...deck.settings, newCardsPerDay: -1 } });
    const corrupt = await dump();
    await expect(renameDeck(deck.id, 'Nope', db)).rejects.toThrow();
    await expect(addSelectionToDeck(deck.id, [{ packId: fixturePack.id, cardId: ids[1] }], db)).rejects.toThrow();
    expect(await dump()).toEqual(corrupt);
  });
});


describe('permanent deck deletion', () => {
  it('deletes archived deck records, including removed copies, while preserving other data and undo', async () => {
    const target = await setup(2);
    const targetSession = await answer(target.id);
    await saveCopyAnnotations(targetSession.copyId!, { personalNote: 'Delete this note', tags: ['temporary'] }, db);
    await removeCardsFromDeck(target.id, [targetSession.copyId!], db);
    await setDeckArchived(target.id, true, db);
    const other = await setup();
    await answer(other.id);
    await db.testAttempts.add(createTestAttempt(testFixturePack, { mode: 'practice', count: 50, durationMinutes: 120, fixturePreview: true }, [], now));
    const before = await loadWorkspace(db);
    const beforeAttempts = await db.testAttempts.toArray();
    const beforeCatalog = structuredClone(studyPacks);
    await deleteDeck(target.id, target.name, db);
    const after = await loadWorkspace(db);
    const keptCopyIds = before.copies.filter(copy => copy.deckId === other.id).map(copy => copy.id);
    expect(after.decks).toEqual(before.decks.filter(deck => deck.id === other.id));
    expect(after.copies).toEqual(before.copies.filter(copy => copy.deckId === other.id));
    expect(after.schedulerStates).toEqual(before.schedulerStates.filter(state => keptCopyIds.includes(state.copyId)));
    expect(after.reviewLogs).toEqual(before.reviewLogs.filter(log => log.deckId === other.id));
    expect(after.preferences).toEqual(before.preferences);
    expect(after.session).toEqual(before.session);
    expect(await db.testAttempts.toArray()).toEqual(beforeAttempts);
    expect(studyPacks).toEqual(beforeCatalog);
    await undoLastReview(now, db);
  });
  it('closes the deleted deck session and rejects its stale review without reviving records', async () => {
    const target = await setup();
    const session = await startReview(target.id, now, db);
    await revealReview(session.turnId, null, false, db);
    await deleteDeck(target.id, target.name, db);
    expect((await loadWorkspace(db))).toMatchObject({ decks: [], copies: [], schedulerStates: [], reviewLogs: [], session: null });
    await expect(submitReview({ turnId: session.turnId, rating: 'right', durationMs: 1 }, now, db)).rejects.toThrow();
    expect(await db.reviewLogs.count()).toBe(0);
    expect(await db.preferences.count()).toBe(1);
  });
  it('requires the current exact name and rejects missing decks without changes', async () => {
    const target = await setup();
    await renameDeck(target.id, 'Renamed', db);
    const before = await dump();
    for (const name of [target.name, 'renamed', ' Renamed ', '']) {
      await expect(deleteDeck(target.id, name, db)).rejects.toThrow(/exactly/);
    }
    await expect(deleteDeck('missing', 'Renamed', db)).rejects.toThrow(/no longer exists/);
    expect(await dump()).toEqual(before);
  });
  it('rolls back all child deletions and the current session when the final deck write fails', async () => {
    const target = await setup(2);
    await answer(target.id);
    const before = await dump();
    vi.spyOn(db.decks, 'delete').mockRejectedValueOnce(new Error('blocked deck delete'));
    await expect(deleteDeck(target.id, target.name, db)).rejects.toThrow(/blocked deck delete/);
    expect(await dump()).toEqual(before);
    await expect(loadWorkspace(db)).resolves.toBeDefined();
  });
});
