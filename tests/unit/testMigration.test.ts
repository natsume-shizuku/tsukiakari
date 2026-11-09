import { sel } from '../support/selection';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { testFixturePack } from '../../src/content/testFixtures';
import { engineeringQuestionBank } from '../../src/content/engineeringQuestionBank';
import { defaultPreferences, newDeckSettings } from '../../src/domain';
import { legacyTestAttemptSchema } from '../../src/legacyTestValidation';
import { migrateLegacyTestAttempt } from '../../src/testMigration';
import { createDatabase, loadWorkspace } from '../../src/storage';
import { createFullBackup, parseBackup } from '../../src/portability';
import { importBackup } from '../../src/portabilityStorage';
import { abandonTestAttempt, startTest } from '../../src/testStorage';

const now = 1_800_000_000_000;
const databases: Dexie[] = [];
afterEach(async () => { for (const db of databases.splice(0)) { db.close(); await Dexie.delete(db.name); } });
function newDatabase() {
  const db = createDatabase('migration-' + crypto.randomUUID()); databases.push(db); return db;
}
function legacyAttempt(completed = true) {
  const questions = testFixturePack.cards.slice(0, 50).map(card => ({ packId: testFixturePack.id, card, sources: testFixturePack.sources }));
  return legacyTestAttemptSchema.parse({
    id: 'old-attempt', packId: testFixturePack.id, packTitle: 'Original title',
    fixture: true, mode: 'practice', startedAt: now, deadlineAt: null,
    completedAt: completed ? now + 1000 : null,
    questions, responses: questions.map(({ card }, index) => ({
      cardId: card.id, selectedOptionId: index === 0 ? card.correctOptionId! : index === 1
        ? card.options!.find(option => option.id !== card.correctOptionId)!.id : null,
      revealed: index === 0,
    })),
    result: completed ? { correct: 1, wrong: 1, skipped: 48 } : null,
  });
}
function legacyBackup() {
  return { format: 'tsukiakari', version: 1, exportedAt: now + 2000, kind: 'full',
    workspace: {
      decks: [{ id: 'old-deck', name: 'Keep me', createdAt: now, settings: newDeckSettings() }],
      copies: [{ id: 'old-copy', deckId: 'old-deck', packId: 'unavailable-pack', cardId: 'unavailable-card',
        contentRevision: 3, createdAt: now, personalNote: 'Private annotation', tags: ['mine'], suspended: false }],
      preferences: { ...defaultPreferences(), timeZone: 'UTC' }, schedulerStates: [], reviewLogs: [], session: null,
      testAttempts: [legacyAttempt()],
    },
  };
}
const oldStores = {
  decks: '&id, createdAt', copies: '&id, &[deckId+packId+cardId], deckId, packId',
  preferences: '&id', schedulerStates: '&copyId, dueAt, state',
  reviewLogs: '&id, copyId, deckId, at, studyDay', reviewSessions: '&id',
  testAttempts: '&id, packId, startedAt, completedAt',
};
describe('compatible test migration', () => {
  it('preserves v1 answer snapshots, scores, identities and annotations', async () => {
    const db = newDatabase(); const old = legacyBackup(); const parsed = parseBackup(old);
    expect(parsed.version).toBe(3);
    if (parsed.kind !== 'full') throw new Error('Expected full');
    expect(parsed.workspace.copies).toEqual(old.workspace.copies);
    const saved = parsed.workspace.testAttempts[0];
    expect(saved.result).toEqual(old.workspace.testAttempts[0].result);
    expect(sel(saved.questions[0].card).correctOptionIds).toEqual([old.workspace.testAttempts[0].questions[0].card.correctOptionId]);
    expect(saved.questions[0].card.status).toBe('draft');
    expect(saved.questions[0].domainTitle).toBe('Unclassified (legacy)');
    expect(parsed.workspace.testExposures).toHaveLength(50);
    await importBackup(parsed, db);
    expect(createFullBackup(await loadWorkspace(db), now + 3000).workspace).toEqual(parsed.workspace);
  });
  it('rejects malformed v1 scores and smuggled new fields before writes', async () => {
    const db = newDatabase(); const before = await loadWorkspace(db);
    const corrupt = legacyBackup(); corrupt.workspace.testAttempts[0].result!.correct = 50;
    expect(() => parseBackup(corrupt)).toThrow(/Results/);
    expect(() => parseBackup({ ...legacyBackup(), workspace: { ...legacyBackup().workspace, testExposures: [] } })).toThrow();
    expect(() => migrateLegacyTestAttempt({ ...legacyAttempt(), bankId: 'spoof' })).toThrow();
    expect(await loadWorkspace(db)).toEqual(before);
  });
  it('migrates v1 settings and selections without changing canonical references', () => {
    const deck = { format:'tsukiakari',version:1,exportedAt:now,kind:'deck',
      deck:{name:'Selection',settings:newDeckSettings(),cards:[{packId:'original',cardId:'card',contentRevision:2}]} };
    expect(parseBackup(deck)).toEqual({...deck,version:3});
    const settings = { format:'tsukiakari',version:1,exportedAt:now,kind:'settings',preferences:legacyBackup().workspace.preferences,decks:[] };
    expect(parseBackup(settings)).toEqual({...settings,version:3});
  });
  it('upgrades a v1 database with an unfinished test atomically', async () => {
    const name = 'old-' + crypto.randomUUID();
    const old = new Dexie(name); old.version(1).stores(oldStores);
    await old.table('testAttempts').put(legacyAttempt(false)); old.close();
    const db = createDatabase(name); databases.push(db);
    const workspace = await loadWorkspace(db);
    expect(db.verno).toBe(2);
    expect(workspace.testAttempts[0].completedAt).toBeNull();
    expect(workspace.testAttempts[0].responses[0].selectedOptionIds).toEqual([legacyAttempt().questions[0].card.correctOptionId]);
    expect(await db.testExposures.count()).toBe(50);
  });
  it('leaves a corrupt v1 database intact after a failed upgrade', async () => {
    const name = 'corrupt-' + crypto.randomUUID();
    const old = new Dexie(name); old.version(1).stores(oldStores);
    const corrupt = {...legacyAttempt(),responses:[]};
    await old.table('testAttempts').put(corrupt); old.close();
    const next = createDatabase(name); await expect(next.open()).rejects.toThrow(); next.close();
    const reopened = new Dexie(name); reopened.version(1).stores(oldStores); databases.push(reopened);
    expect(await reopened.table('testAttempts').get(corrupt.id)).toEqual(corrupt);
    expect(reopened.verno).toBe(1);
  });
  it('leaves v1 records and schema unchanged when multiple unfinished tests prevent upgrade', async () => {
    const name = 'multiple-active-' + crypto.randomUUID();
    const old = new Dexie(name); old.version(1).stores(oldStores);
    const attempts = [legacyAttempt(false), { ...legacyAttempt(false), id: 'second-unfinished' }];
    const deck = legacyBackup().workspace.decks[0];
    await old.table('testAttempts').bulkPut(attempts);
    await old.table('decks').put(deck);
    old.close();
    const next = createDatabase(name);
    await expect(next.open()).rejects.toThrow(/multiple unfinished attempts/);
    next.close();
    const reopened = new Dexie(name); reopened.version(1).stores(oldStores); databases.push(reopened);
    expect(await reopened.table('testAttempts').toArray()).toEqual(attempts);
    expect(await reopened.table('decks').toArray()).toEqual([deck]);
    expect(reopened.verno).toBe(1);
    expect(reopened.tables.map(table => table.name)).not.toContain('testExposures');
    expect(reopened.table('testAttempts').schema.indexes.map(index => index.name)).toContain('packId');
    expect(reopened.table('testAttempts').schema.indexes.map(index => index.name)).not.toContain('bankId');
  });
  it('retains abandoned exposure through transfer and avoids those questions', async () => {
    const db = newDatabase();
    const options = {mode:'practice' as const,count:50,durationMinutes:120,fixturePreview:true};
    const first = await startTest(engineeringQuestionBank,options,db,now);
    await abandonTestAttempt(first.id,db);
    const backup = createFullBackup(await loadWorkspace(db),now+1);
    expect(backup.workspace.testAttempts).toHaveLength(0);
    expect(backup.workspace.testExposures).toHaveLength(50);
    const second = newDatabase(); await importBackup(backup,second);
    const next = await startTest(engineeringQuestionBank,options,second,now+2);
    const seen = new Set(first.questions.map(q=>q.card.id));
    expect(next.questions.every(q=>!seen.has(q.card.id))).toBe(true);
  });
  it('rolls back the entire import if exposure writes fail', async () => {
    const db = newDatabase(); const before = await loadWorkspace(db);
    db.testExposures.hook('creating',()=>{throw new Error('Exposure quota failure');});
    await expect(importBackup(parseBackup(legacyBackup()),db)).rejects.toThrow(/quota/);
    expect(await loadWorkspace(db)).toEqual(before);
  });
  it('rolls back a start if recording exposure fails', async () => {
    const db = newDatabase();
    db.testExposures.hook('creating',()=>{throw new Error('Exposure write failed');});
    await expect(startTest(engineeringQuestionBank,{mode:'practice',count:50,durationMinutes:120,fixturePreview:true},db,now)).rejects.toThrow(/Exposure/);
    expect(await db.testAttempts.count()).toBe(0);
    expect(await db.testExposures.count()).toBe(0);
  });
});
