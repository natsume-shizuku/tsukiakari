import Dexie, { type Table } from 'dexie';
import { z } from 'zod';
import { migrateLegacyTestAttempt, collectTestExposures } from './testMigration';
import {
  defaultPreferences, newDeckSettings,
  type Deck, type LearningCopy, type Preferences, type ReviewLog,
  type ReviewSession, type SchedulerState, type StudyPack, type TestAttempt, type TestExposure, type WorkspaceSnapshot,
} from './domain';
import {
  deckSchema, idSchema, learningCopySchema, preferencesSchema, reviewLogSchema,
  reviewSessionSchema, schedulerStateSchema, testAttemptSchema, testExposureSchema, validatePack,
} from './validation';

/** Mutating APIs are called by the app's Web Lock owner; other tabs may only load. */
export class TsukiakariDatabase extends Dexie {
  decks!: Table<Deck, string>;
  copies!: Table<LearningCopy, string>;
  preferences!: Table<Preferences, string>;
  schedulerStates!: Table<SchedulerState, string>;
  reviewLogs!: Table<ReviewLog, string>;
  reviewSessions!: Table<ReviewSession, string>;
  testAttempts!: Table<TestAttempt, string>;
  testExposures!: Table<TestExposure, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      decks: '&id, createdAt',
      copies: '&id, &[deckId+packId+cardId], deckId, packId',
      preferences: '&id',
      schedulerStates: '&copyId, dueAt, state',
      reviewLogs: '&id, copyId, deckId, at, studyDay',
      reviewSessions: '&id',
      testAttempts: '&id, packId, startedAt, completedAt',
    });
    this.version(2).stores({
      testAttempts: '&id, bankId, startedAt, completedAt',
      testExposures: '&id, bankId, questionId, lastSeenAt',
    }).upgrade(async transaction => {
      const old = await transaction.table('testAttempts').toArray();
      const attempts = old.map(value => migrateLegacyTestAttempt(value));
      if (attempts.filter(attempt => attempt.completedAt === null).length > 1) throw new Error('Stored tests contain multiple unfinished attempts. Your data has not been changed.');
      if (attempts.length) await transaction.table('testAttempts').bulkPut(attempts);
      const exposures = collectTestExposures(attempts);
      if (exposures.length) await transaction.table('testExposures').bulkPut(exposures);
    });
  }
}
export function createDatabase(name = 'tsukiakari'): TsukiakariDatabase { return new TsukiakariDatabase(name); }
export const database = createDatabase();

/** A consistent read, including reserved future tables, never seeds or repairs data. */
export async function loadWorkspace(db = database): Promise<WorkspaceSnapshot> {
  return db.transaction('r', db.tables, async () => {
    const [rawDecks, rawCopies, rawPreferences, rawStates, rawLogs, rawSessions, rawAttempts, rawExposures] = await Promise.all([
      db.decks.toArray(), db.copies.toArray(), db.preferences.toArray(), db.schedulerStates.toArray(),
      db.reviewLogs.toArray(), db.reviewSessions.toArray(), db.testAttempts.toArray(), db.testExposures.toArray(),
    ]);
    const decks = z.array(deckSchema).parse(rawDecks);
    const copies = z.array(learningCopySchema).parse(rawCopies);
    const preferences = z.array(preferencesSchema).max(1).parse(rawPreferences);
    const states = z.array(schedulerStateSchema).parse(rawStates);
    const logs = z.array(reviewLogSchema).parse(rawLogs);
    const sessions = z.array(reviewSessionSchema).max(1).parse(rawSessions);
    const testAttempts = z.array(testAttemptSchema).parse(rawAttempts);
    const testExposures = collectTestExposures(testAttempts, z.array(testExposureSchema).parse(rawExposures));
    if (testAttempts.filter(attempt => attempt.completedAt === null).length > 1) throw new Error('Stored tests contain multiple unfinished attempts. Your data has not been changed.');
    const deckIds = new Set(decks.map(deck => deck.id));
    const copiesById = new Map(copies.map(copy => [copy.id, copy]));
    if (copies.some(copy => !deckIds.has(copy.deckId))) throw new Error('Stored card refers to a missing deck. Your data has not been changed.');
    if (states.some(state => !copiesById.has(state.copyId))) throw new Error('Stored schedule refers to a missing card. Your data has not been changed.');
    if (logs.some(log => copiesById.get(log.copyId)?.deckId !== log.deckId)) throw new Error('Stored review refers to a missing or different deck card. Your data has not been changed.');
    if (sessions.some(session => !deckIds.has(session.deckId) || (session.copyId !== null && copiesById.get(session.copyId)?.deckId !== session.deckId))) throw new Error('Stored session refers to a missing or different deck card. Your data has not been changed.');
    const sequences = logs.map(log => log.sequence);
    if (new Set(sequences).size !== sequences.length) throw new Error('Stored review sequences conflict. Your data has not been changed.');
    const undoable = logs.filter(log => log.undoable);
    const latestSequence = logs.reduce((latest, log) => Math.max(latest, log.sequence), 0);
    if (undoable.length > 1 || undoable.some(log => log.undone || log.sequence !== latestSequence)) throw new Error('Stored undo history is inconsistent. Your data has not been changed.');
    return { decks, copies, preferences: preferences[0] ?? defaultPreferences(), schedulerStates: states, reviewLogs: logs, session: sessions[0] ?? null, testAttempts, testExposures };
  });
}

async function ensureSavedPreferences(db: TsukiakariDatabase): Promise<void> {
  const existing = z.array(preferencesSchema).max(1).parse(await db.preferences.toArray());
  if (existing.length === 0) await db.preferences.add(preferencesSchema.parse(defaultPreferences()));
}

export async function createDeck(name: string, db = database): Promise<Deck> {
  const deck: Deck = deckSchema.parse({ id: crypto.randomUUID(), name: name.trim(), createdAt: Date.now(), settings: newDeckSettings() });
  await db.transaction('rw', [db.decks, db.preferences], async () => {
    await ensureSavedPreferences(db);
    await db.decks.add(deck);
  });
  return structuredClone(deck);
}

/** A repeated add is idempotent; an invalid request cannot partially add cards. */
export async function addCardsToDeck(deckId: string, inputPack: StudyPack, cardIds: string[], db = database): Promise<void> {
  idSchema.parse(deckId);
  const pack = validatePack(inputPack);
  const requested = z.array(idSchema).min(1).refine(ids => new Set(ids).size === ids.length, 'Requested card IDs must be unique.').parse(cardIds);
  const cardsById = new Map(pack.cards.map(card => [card.id, card]));
  if (requested.some(id => !cardsById.has(id))) throw new Error('One or more selected cards are not in this pack. No cards were added.');
  await db.transaction('rw', db.tables, async () => {
    await loadWorkspace(db);
    const foundDeck = await db.decks.get(deckId);
    if (!foundDeck) throw new Error('The selected deck no longer exists. No cards were added.');
    deckSchema.parse(foundDeck);
    if (foundDeck.archived) throw new Error('Restore this archived deck before adding cards.');
    await ensureSavedPreferences(db);
    const additions: LearningCopy[] = [];
    for (const cardId of requested) {
      const existing = await db.copies.where('[deckId+packId+cardId]').equals([deckId, pack.id, cardId]).first();
      if (existing) {
        learningCopySchema.parse(existing);
        if (existing.removed) await db.copies.put(learningCopySchema.parse({ ...existing, removed: false }));
        continue;
      }
      const card = cardsById.get(cardId)!;
      additions.push(learningCopySchema.parse({
        id: crypto.randomUUID(), deckId, packId: pack.id, cardId, contentRevision: card.revision,
        createdAt: Date.now(), personalNote: '', tags: [], suspended: false,
      }));
    }
    if (additions.length > 0) await db.copies.bulkAdd(additions);
  });
}

export async function savePreferences(preferences: Preferences, db = database): Promise<void> {
  const validated = preferencesSchema.parse(preferences);
  await db.transaction('rw', db.preferences, async () => { await db.preferences.put(validated); });
}

