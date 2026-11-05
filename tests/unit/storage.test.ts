import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixturePack } from '../../src/content/fixtures';
import { defaultPreferences, detectTimeZone, timeZoneLabel, type LearningCopy, type SchedulerState } from '../../src/domain';
import { addCardsToDeck, createDatabase, createDeck, loadWorkspace, savePreferences, type TsukiakariDatabase } from '../../src/storage';
import { getStudyDay, studyDayStart } from '../../src/studyDay';

let db: TsukiakariDatabase;
beforeEach(() => { db = createDatabase(`tsukiakari-unit-${crypto.randomUUID()}`); });
afterEach(async () => { vi.restoreAllMocks(); await db.delete(); });
const firstId = fixturePack.cards[0].id;
const secondId = fixturePack.cards[1].id;
function stateFor(copyId: string): SchedulerState {
  return { copyId, algorithm: 'test-fixture', libraryVersion: 'fixture-1', modelVersion: 'fixture-1', parametersVersion: 'standard-fixture', state: 'new', dueAt: null, stability: 0, difficulty: 0, repetitions: 0, lapses: 0, learningStep: 0, elapsedDays: 0, scheduledDays: 0, lastReviewAt: null };
}

describe('normalized local storage', () => {
  it('returns empty learner data without seeding any tables', async () => {
    const snapshot = await loadWorkspace(db);
    expect(snapshot.decks).toEqual([]);
    expect(snapshot.copies).toEqual([]);
    expect(snapshot.preferences).toEqual(defaultPreferences());
    expect(await Promise.all(db.tables.map(table => table.count()))).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });
  it('persists decks, membership and preferences across database reopen', async () => {
    const deck = await createDeck('  Night study  ', db);
    await addCardsToDeck(deck.id, fixturePack, [firstId], db);
    const preferences = { ...defaultPreferences(), theme: 'dark' as const, timeZone: 'America/Denver', dayStartsAtHour: 5 };
    await savePreferences(preferences, db);
    db.close(); await db.open();
    const snapshot = await loadWorkspace(db);
    expect(snapshot.decks[0]).toEqual({ ...deck, name: 'Night study' });
    expect(snapshot.copies[0]).toMatchObject({ deckId: deck.id, cardId: firstId, packId: fixturePack.id, contentRevision: 1, personalNote: '', tags: [], suspended: false });
    expect(snapshot.preferences).toEqual(preferences);
    expect(await db.schedulerStates.count()).toBe(0);
    expect(await db.reviewLogs.count()).toBe(0);
  });
  it('creates independent learning copies and settings for each deck', async () => {
    const first = await createDeck('First', db); const second = await createDeck('Second', db);
    await addCardsToDeck(first.id, fixturePack, [firstId], db);
    await addCardsToDeck(second.id, fixturePack, [firstId], db);
    const firstCopy = (await db.copies.where('deckId').equals(first.id).first())!;
    const secondCopy = (await db.copies.where('deckId').equals(second.id).first())!;
    expect(firstCopy.id).not.toBe(secondCopy.id);
    await db.copies.update(firstCopy.id, { personalNote: 'Only in First', tags: ['mine'], suspended: true });
    await db.schedulerStates.add(stateFor(firstCopy.id));
    first.settings.learningStepsMinutes.push(300);
    const snapshot = await loadWorkspace(db);
    expect(snapshot.copies.find(copy => copy.id === secondCopy.id)).toEqual(secondCopy);
    expect(await db.schedulerStates.get(secondCopy.id)).toBeUndefined();
    expect(snapshot.decks.find(deck => deck.id === second.id)?.settings.learningStepsMinutes).toEqual([1, 10, 60]);
    expect(snapshot.decks.find(deck => deck.id === first.id)?.settings.learningStepsMinutes).toEqual([1, 10, 60]);
  });
  it('is idempotent when existing memberships are requested again', async () => {
    const deck = await createDeck('Deck', db);
    await addCardsToDeck(deck.id, fixturePack, [firstId], db);
    const original = (await db.copies.toArray())[0];
    await db.copies.update(original.id, { personalNote: 'Keep this', tags: ['keep'] });
    await addCardsToDeck(deck.id, fixturePack, [firstId, secondId], db);
    expect(await db.copies.count()).toBe(2);
    expect(await db.copies.get(original.id)).toMatchObject({ personalNote: 'Keep this', tags: ['keep'] });
  });
  it('rejects duplicate requested IDs and missing IDs without partial additions', async () => {
    const deck = await createDeck('Deck', db);
    await expect(addCardsToDeck(deck.id, fixturePack, [firstId, firstId], db)).rejects.toThrow(/unique/);
    await expect(addCardsToDeck(deck.id, fixturePack, [firstId, 'missing'], db)).rejects.toThrow(/not in this pack/);
    await expect(addCardsToDeck(deck.id, fixturePack, [], db)).rejects.toThrow();
    expect(await db.copies.count()).toBe(0);
  });
  it('rejects a missing deck or malformed request before persisting cards', async () => {
    await expect(addCardsToDeck('missing-deck', fixturePack, [firstId], db)).rejects.toThrow(/no longer exists/);
    const deck = await createDeck('Deck', db);
    const invalidPack = structuredClone(fixturePack); invalidPack.cards[0].sourceIds = ['missing'];
    await expect(addCardsToDeck(deck.id, invalidPack, [firstId], db)).rejects.toThrow(/unregistered/);
    await expect(addCardsToDeck('  ', fixturePack, [firstId], db)).rejects.toThrow();
    await expect(createDeck('   ', db)).rejects.toThrow(/blank/);
    expect(await db.copies.count()).toBe(0);
    expect(await db.decks.count()).toBe(1);
  });
  it('rolls back every addition when a later write fails', async () => {
    const deck = await createDeck('Deck', db);
    await db.preferences.clear();
    db.copies.hook('creating', (_key, copy) => { if (copy.cardId === secondId) throw new Error('Simulated write failure'); });
    await expect(addCardsToDeck(deck.id, fixturePack, [firstId, secondId], db)).rejects.toThrow(/Simulated write failure/);
    expect(await db.preferences.count()).toBe(0);
    expect(await db.copies.count()).toBe(0);
    expect(await db.decks.count()).toBe(1);
  });
  it('enforces membership uniqueness in the database itself', async () => {
    const deck = await createDeck('Deck', db);
    await addCardsToDeck(deck.id, fixturePack, [firstId], db);
    const copy = (await db.copies.toArray())[0];
    await expect(db.copies.add({ ...copy, id: crypto.randomUUID() })).rejects.toThrow();
    expect(await db.copies.count()).toBe(1);
  });
  it('rejects invalid preferences and retains the saved preferences', async () => {
    const preferences = { ...defaultPreferences(), theme: 'light' as const };
    await savePreferences(preferences, db);
    await expect(savePreferences({ ...preferences, dayStartsAtHour: -1 }, db)).rejects.toThrow();
    expect((await loadWorkspace(db)).preferences).toEqual(preferences);
  });
  it('does not reset malformed saved preferences or substitute defaults', async () => {
    const malformed = { ...defaultPreferences(), theme: 'unrecognized' };
    await db.table('preferences').put(malformed);
    await expect(loadWorkspace(db)).rejects.toThrow();
    expect(await db.table('preferences').toArray()).toEqual([malformed]);
  });
  it('reports malformed deck data without replacing any learner records', async () => {
    const deck = await createDeck('Deck', db);
    await addCardsToDeck(deck.id, fixturePack, [firstId], db);
    await db.table('decks').put({ ...deck, settings: { ...deck.settings, newCardsPerDay: -10 } });
    await expect(loadWorkspace(db)).rejects.toThrow();
    expect(await db.decks.count()).toBe(1);
    expect(await db.copies.count()).toBe(1);
    expect((await db.decks.get(deck.id))?.settings.newCardsPerDay).toBe(-10);
  });
  it('reports orphaned learning copies without deleting them', async () => {
    const copy: LearningCopy = { id: 'orphan', deckId: 'missing', packId: fixturePack.id, cardId: firstId, contentRevision: 1, createdAt: Date.now(), personalNote: '', tags: [], suspended: false };
    await db.copies.add(copy);
    await expect(loadWorkspace(db)).rejects.toThrow(/missing deck/);
    expect(await db.copies.get(copy.id)).toEqual(copy);
  });
  it('checks reserved tables for malformed data rather than hiding it', async () => {
    await db.schedulerStates.add(stateFor('missing-copy'));
    await expect(loadWorkspace(db)).rejects.toThrow(/missing card/);
    expect(await db.schedulerStates.count()).toBe(1);
  });
  it('saves the initial timezone on first mutation and retains it when the device zone changes', async () => {
    const originalOptions = Intl.DateTimeFormat().resolvedOptions();
    const resolvedOptions = vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions');
    resolvedOptions.mockReturnValue({ ...originalOptions, timeZone: 'America/Denver' });
    await createDeck('First', db);
    expect((await db.preferences.get('preferences'))?.timeZone).toBe('America/Denver');
    resolvedOptions.mockReturnValue({ ...originalOptions, timeZone: 'Asia/Tokyo' });
    await createDeck('Second', db);
    expect((await loadWorkspace(db)).preferences.timeZone).toBe('America/Denver');
  });
  describe('when the browser cannot name the device time zone', () => {
    const reportTimeZone = (timeZone: string | undefined, offsetMinutes: number) => {
      const options = Intl.DateTimeFormat().resolvedOptions();
      vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ ...options, timeZone: timeZone as string });
      vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offsetMinutes);
    };
    afterEach(() => { vi.restoreAllMocks(); });
    it('still creates a deck, saving the reported offset as a valid zone', async () => {
      reportTimeZone(undefined, 420);
      await createDeck('Unnamed zone', db);
      const { decks, preferences } = await loadWorkspace(db);
      expect(decks).toHaveLength(1);
      expect(preferences.timeZone).toBe('Etc/GMT+7');
      expect(getStudyDay(Date.parse('2026-11-05T11:59:00Z'), preferences)).toBe('2026-11-04');
      expect(getStudyDay(Date.parse('2026-11-05T12:00:00Z'), preferences)).toBe('2026-11-05');
      expect(studyDayStart('2026-11-05', preferences)).toBe(Date.parse('2026-11-05T12:00:00Z'));
    });
    it.each([
      [undefined, 420, 'Etc/GMT+7'], [undefined, -540, 'Etc/GMT-9'], [undefined, -840, 'Etc/GMT-14'], [undefined, 0, 'UTC'],
      [undefined, -330, '+05:30'], [undefined, 210, '-03:30'], ['Etc/Unknown', 360, 'Etc/GMT+6'], ['', 360, 'Etc/GMT+6'], ['America/Denver', 360, 'America/Denver'],
    ])('detects %s at offset %i as %s', (name, offset, expected) => {
      reportTimeZone(name, offset);
      expect(detectTimeZone()).toBe(expected);
    });
    it('labels fixed zones with the usual UTC sign', () => {
      expect(timeZoneLabel('Etc/GMT+7')).toBe('UTC-07:00');
      expect(timeZoneLabel('Etc/GMT-9')).toBe('UTC+09:00');
      expect(timeZoneLabel('America/Denver')).toBe('America/Denver');
    });
  });
  it('saves missing preferences atomically when cards are added to an existing deck', async () => {
    const deck = await createDeck('Deck', db);
    await db.preferences.clear();
    await addCardsToDeck(deck.id, fixturePack, [firstId], db);
    expect(await db.preferences.get('preferences')).toEqual(defaultPreferences());
    expect(await db.copies.count()).toBe(1);
  });
  it('rejects learner mutations when existing preferences are malformed without repairing them', async () => {
    const deck = await createDeck('Existing', db);
    const malformed = { ...defaultPreferences(), timeZone: 'Unknown/Region' };
    await db.table('preferences').put(malformed);
    await expect(createDeck('Must not be saved', db)).rejects.toThrow(/Timezone/);
    await expect(addCardsToDeck(deck.id, fixturePack, [firstId], db)).rejects.toThrow(/Timezone/);
    expect(await db.decks.count()).toBe(1);
    expect(await db.copies.count()).toBe(0);
    expect(await db.table('preferences').toArray()).toEqual([malformed]);
  });
  it('provides a consistent immutable snapshot to callers', async () => {
    await createDeck('Original', db);
    const snapshot = await loadWorkspace(db); snapshot.decks[0].name = 'Local mutation';
    expect((await loadWorkspace(db)).decks[0].name).toBe('Original');
  });
});


