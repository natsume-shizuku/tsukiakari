import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { StudyCuration } from '../../src/domain';
import { createCurationRegistry } from '../../src/content/curations';
import { canonicalCards, canonicalNotes, cardCurations, noteCurations, matchesCurationCard, resolveCurationCards, resolveCurationNotes, studyCurations, studyPacks } from '../../src/content/catalog';
import { fixturePack } from '../../src/content/fixtures';
import { addSelectionToDeck, removeCardsFromDeck, saveCopyAnnotations } from '../../src/collectionStorage';
import { createDatabase, createDeck, loadWorkspace, type TsukiakariDatabase } from '../../src/storage';
import { createDeckBackup } from '../../src/portability';
import { revealReview, startReview, submitReview } from '../../src/reviewStorage';

const sharedId = 'developer-shared-foundations';
const shared = () => structuredClone(studyCurations.find(item => item.id === sharedId)!);
const registry = (curation: StudyCuration) => createCurationRegistry(studyPacks, [curation], ['developer-test-fixture']);
const refs = (id: string) => resolveCurationCards(id).map(({ pack, card }) => ({ packId: pack.id, cardId: card.id }));

describe('canonical study curations', () => {
  it('shares canonical identities and notes without expanding the catalog', () => {
    expect(studyCurations.filter(item => item.fixture)).toHaveLength(3);
    expect(canonicalCards.filter(item => item.pack.fixture)).toHaveLength(124);
    expect(canonicalNotes.filter(item => item.pack.fixture)).toHaveLength(42);
    expect(resolveCurationCards(sharedId)).toHaveLength(6);
    expect(resolveCurationNotes(sharedId)).toHaveLength(3);
    const card = { packId: fixturePack.id, cardId: fixturePack.cards[0].id };
    expect(cardCurations(card).map(item => item.id)).toEqual([fixturePack.id, sharedId]);
    expect(noteCurations({ packId: fixturePack.id, noteId: fixturePack.notes[0].id }).map(item => item.id)).toEqual([fixturePack.id, sharedId]);
    expect(matchesCurationCard(card, sharedId, 'shared-foundations')).toBe(true);
    expect(matchesCurationCard(card, sharedId, 'shared-addition')).toBe(false);
    expect(studyCurations.filter(item => item.questionBankIds.includes('developer-test-fixture')).map(item => item.id)).toEqual([fixturePack.id, sharedId]);
  });
  it('rejects duplicate members, dangling references and omitted supporting notes', () => {
    const duplicate = shared(); duplicate.cards.push(duplicate.cards[0]);
    expect(() => registry(duplicate)).toThrow(/only once/);
    const missing = shared(); missing.cards[0].cardId = 'absent';
    expect(() => registry(missing)).toThrow(/unavailable canonical card/);
    const missingNote = shared(); missingNote.notes[0].noteId = 'absent';
    expect(() => registry(missingNote)).toThrow();
    const noteOmitted = shared(); noteOmitted.notes.splice(0, 1);
    expect(() => registry(noteOmitted)).toThrow(/reference notes/);
  });
  it('rejects invalid topics, duplicate curation IDs and unregistered bank links', () => {
    const invalidTopic = shared(); invalidTopic.cards[0].topicId = 'absent';
    expect(() => registry(invalidTopic)).toThrow(/topic/);
    const missingBank = shared(); missingBank.questionBankIds = ['absent'];
    expect(() => registry(missingBank)).toThrow(/unavailable question bank/);
    expect(() => createCurationRegistry(studyPacks, [shared(), shared()], ['developer-test-fixture'])).toThrow(/Curation IDs/);
    expect(() => resolveCurationCards('absent')).toThrow(/unavailable/);
  });
  it('prevents fixture material from being promoted into a real curation', () => {
    const real = shared(); real.fixture = false;
    expect(() => registry(real)).toThrow(/fixture cards/);
  });
});

let db: TsukiakariDatabase;
beforeEach(() => { db = createDatabase('curation-' + crypto.randomUUID()); });
afterEach(async () => { await db.delete(); });

describe('curation deck membership', () => {
  it('adds only new canonical cards and exports canonical ownership', async () => {
    const deck = await createDeck('Shared learning', db);
    await addSelectionToDeck(deck.id, refs(fixturePack.id), db);
    const first = await loadWorkspace(db);
    await addSelectionToDeck(deck.id, refs(sharedId), db);
    const result = await loadWorkspace(db);
    expect(result.copies).toHaveLength(6);
    for (const original of first.copies) expect(result.copies.find(copy => copy.id === original.id)).toEqual(original);
    expect(result.copies.some(copy => copy.packId === sharedId)).toBe(false);
    const exported = createDeckBackup(result, deck.id);
    expect(exported.deck.cards).toHaveLength(6);
    expect(exported.deck.cards.every(card => studyPacks.some(pack => pack.id === card.packId))).toBe(true);
    await addSelectionToDeck(deck.id, refs(sharedId), db);
    expect((await loadWorkspace(db)).copies).toEqual(result.copies);
  });
  it('restores a learned copy through another curation and leaves another deck untouched', async () => {
    const firstDeck = await createDeck('First', db);
    const secondDeck = await createDeck('Second', db);
    const ref = refs(fixturePack.id)[0];
    await addSelectionToDeck(firstDeck.id, [ref], db);
    await addSelectionToDeck(secondDeck.id, [ref], db);
    const now = Date.now();
    const session = await startReview(firstDeck.id, now, db);
    await revealReview(session.turnId, null, false, db);
    await submitReview({ turnId: session.turnId, rating: 'again', durationMs: 1000 }, now + 1000, db);
    await saveCopyAnnotations(session.copyId!, { personalNote: 'My own explanation', tags: ['important'] }, db);
    const before = await loadWorkspace(db);
    await removeCardsFromDeck(firstDeck.id, [session.copyId!], db);
    const sharedRef = refs(sharedId).find(item => item.packId === ref.packId && item.cardId === ref.cardId)!;
    await addSelectionToDeck(firstDeck.id, [sharedRef], db);
    const after = await loadWorkspace(db);
    expect(after.copies.find(copy => copy.id === session.copyId)).toEqual({ ...before.copies.find(copy => copy.id === session.copyId), removed: false });
    expect(after.copies.filter(copy => copy.deckId === secondDeck.id)).toEqual(before.copies.filter(copy => copy.deckId === secondDeck.id));
    expect(after.schedulerStates).toEqual(before.schedulerStates);
    expect(after.reviewLogs).toEqual(before.reviewLogs);
  });
});
