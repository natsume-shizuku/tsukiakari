import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCardsToDeck, createDatabase, createDeck, loadWorkspace, savePreferences, type TsukiakariDatabase } from '../../src/storage';
import { fixturePack } from '../../src/content/fixtures';
import { engineeringQuestionBank as testFixturePack } from '../../src/content/engineeringQuestionBank';
import { defaultPreferences } from '../../src/domain';
import { createDeckBackup, createFullBackup, createSettingsBackup, parseBackup } from '../../src/portability';
import { importBackup } from '../../src/portabilityStorage';
import { skipUnavailableReview, revealReview, startReview, submitReview } from '../../src/reviewStorage';
import { startTest } from '../../src/testStorage';
import { removeCardsFromDeck } from '../../src/collectionStorage';
import { getDeckQueue } from '../../src/scheduling';
let db: TsukiakariDatabase;
const now = Date.parse('2026-10-27T12:00:00Z');
beforeEach(() => { db = createDatabase('transfer-' + crypto.randomUUID()); });
afterEach(async () => { await db.delete(); });
async function seed() {
  await savePreferences({ ...defaultPreferences(), timeZone:'UTC' }, db);
  const deck = await createDeck('Personal deck', db);
  await addCardsToDeck(deck.id, fixturePack, [fixturePack.cards[0].id, fixturePack.cards[1].id], db);
  const copy = (await db.copies.toArray())[0];
  await db.copies.update(copy.id, { personalNote:'Private annotation', tags:['personal'] });
  const session = await startReview(deck.id, now, db);
  await revealReview(session.turnId, null, false, db);
  await submitReview({ turnId:session.turnId, rating:'again', durationMs:4500 }, now + 1000, db);
  await startTest(testFixturePack, {mode:'exam', count:50, durationMinutes:120,fixturePreview:true}, db, now);
  return { deck, workspace:await loadWorkspace(db) };
}
describe('JSON portability', () => {
  it('round-trips every saved record, including undo, active sessions, test snapshots and personal data', async () => {
    const { workspace } = await seed();
    const backup = parseBackup(JSON.parse(JSON.stringify(createFullBackup(workspace, now))));
    await createDeck('Extra local deck', db);
    await importBackup(backup, db);
    expect(await loadWorkspace(db)).toEqual(workspace);
  });
  it('supports an empty collection and does not seed content', async () => {
    const w = await loadWorkspace(db);
    await createDeck('Remove on restore', db);
    await importBackup(createFullBackup(w, now), db);
    expect(await loadWorkspace(db)).toEqual(w);
  });
  it('rejects wrong formats, future versions and unknown properties', async () => {
    const b = createFullBackup(await loadWorkspace(db), now);
    for (const change of [{format:'other'}, {version:3}, {unexpected:true}]) expect(() => parseBackup({...b,...change})).toThrow();
    expect(() => parseBackup({ ...b, workspace:{...b.workspace, secrets:[]} })).toThrow();
  });
  it('rejects duplicate identities, memberships and dangling schedules without mutation', async () => {
    const { workspace } = await seed();
    const original = createFullBackup(workspace, now);
    const broken = [
      {...workspace, decks:[...workspace.decks, workspace.decks[0]]},
      {...workspace, copies:[...workspace.copies, {...workspace.copies[0], id:'duplicate-membership'}]},
      {...workspace, schedulerStates:[...workspace.schedulerStates, {...workspace.schedulerStates[0], copyId:'missing'}]},
      {...workspace, reviewLogs:[...workspace.reviewLogs, {...workspace.reviewLogs[0], id:'different-id'}]},
    ];
    for (const w of broken) await expect(importBackup({...original, workspace:w}, db)).rejects.toThrow();
    expect(await loadWorkspace(db)).toEqual(workspace);
  });
  it('rejects mismatched study-day, undo and test-result data', async () => {
    const { workspace } = await seed();
    const b = createFullBackup(workspace, now);
    const badDay = structuredClone(b); badDay.workspace.reviewLogs[0].studyDay = '2026-02-30';
    const badUndo = structuredClone(b); badUndo.workspace.schedulerStates[0].stability += 1;
    const badTest = structuredClone(b); badTest.workspace.testAttempts[0].result = {correct:50,wrong:0,skipped:0};
    for (const item of [badDay,badUndo,badTest]) expect(() => parseBackup(item)).toThrow();
  });
  it('rolls back the entire replacement when a write fails after table clears', async () => {
    const { workspace } = await seed();
    const backup = createFullBackup(workspace, now);
    await createDeck('Must survive failure', db);
    const before = await loadWorkspace(db);
    const fail = () => { throw new Error('Simulated restore write failure'); };
    db.copies.hook('creating', fail);
    await expect(importBackup(backup, db)).rejects.toThrow(/restore write/);
    expect(await loadWorkspace(db)).toEqual(before);
    db.copies.hook('creating').unsubscribe(fail);
    await importBackup(backup, db);
    expect(await loadWorkspace(db)).toEqual(workspace);
  });
  it('exports deck membership without private notes, logs, progress or learner identities', async () => {
    const { deck, workspace } = await seed();
    await removeCardsFromDeck(deck.id, [workspace.copies[1].id], db);
    const b = createDeckBackup(await loadWorkspace(db), deck.id, now);
    expect(b.deck.cards).toHaveLength(1);
    const json = JSON.stringify(b);
    for (const privateValue of ['Private annotation','personalNote','reviewLogs','schedulerStates',deck.id,workspace.copies[0].id]) expect(json).not.toContain(privateValue);
    const before = await loadWorkspace(db);
    await importBackup(b, db); await importBackup(b, db);
    const after = await loadWorkspace(db);
    expect(after.decks).toHaveLength(3);
    const fresh = after.copies.filter(copy => copy.deckId !== deck.id);
    expect(fresh).toHaveLength(2);
    expect(new Set(fresh.map(copy => copy.id)).size).toBe(2);
    expect(fresh.every(copy => !copy.personalNote && !copy.tags.length && !copy.suspended)).toBe(true);
    expect(after.schedulerStates).toEqual(before.schedulerStates);
    expect(after.reviewLogs).toEqual(before.reviewLogs);
    expect(after.testAttempts).toEqual(before.testAttempts);
  });
  it('retains missing content references but never includes them in the study queue', async () => {
    const { deck, workspace } = await seed();
    const b = createDeckBackup(workspace, deck.id, now);
    b.deck.cards = [{packId:'not-installed',cardId:'missing',contentRevision:1}];
    await importBackup(b, db);
    const w = await loadWorkspace(db); const fresh = w.decks.find(item => item.id !== deck.id)!;
    expect(w.copies.find(copy => copy.deckId === fresh.id)?.packId).toBe('not-installed');
    expect(getDeckQueue(w, fresh.id, now).orderedIds).toEqual([]);
  });
  it('settings imports preserve progress and test data, ignore unknown deck IDs and invalidate changed-deck undo/session', async () => {
    const { deck, workspace } = await seed();
    const b = createSettingsBackup(workspace, now);
    b.decks[0].settings.newCardsPerDay = 7;
    b.decks.push({id:'unknown',name:'Other device deck',settings:structuredClone(deck.settings)});
    b.preferences.theme = 'dark';
    await importBackup(b, db);
    const w = await loadWorkspace(db);
    expect(w.decks).toHaveLength(1); expect(w.decks[0].settings.newCardsPerDay).toBe(7);
    expect(w.preferences.theme).toBe('dark'); expect(w.session).toBeNull();
    expect(w.reviewLogs.every(log => !log.undoable)).toBe(true);
    expect(w.schedulerStates).toEqual(workspace.schedulerStates); expect(w.copies).toEqual(workspace.copies);
    expect(w.testAttempts).toEqual(workspace.testAttempts);
  });
  it('unchanged settings preserve undo and the active review', async () => {
    const { workspace } = await seed();
    await importBackup(createSettingsBackup(workspace, now), db);
    expect(await loadWorkspace(db)).toEqual(workspace);
  });
  it('day-policy changes retain historical dates and schedules while ending the old queue', async () => {
    const { workspace } = await seed(); const b = createSettingsBackup(workspace, now);
    b.preferences.dayStartsAtHour = 4;
    await importBackup(b, db); const w = await loadWorkspace(db);
    expect(w.session).toBeNull(); expect(w.reviewLogs[0].studyDay).toBe(workspace.reviewLogs[0].studyDay);
    expect(w.schedulerStates).toEqual(workspace.schedulerStates);
  });
  it('does not silently reset corrupt existing data during import', async () => {
    const b = createFullBackup(await loadWorkspace(db), now);
    await db.copies.put({id:'orphan',deckId:'missing',packId:'p',cardId:'c',contentRevision:1,createdAt:now,personalNote:'',tags:[],suspended:false});
    await expect(importBackup(b, db)).rejects.toThrow(/missing deck/);
    expect(await db.copies.count()).toBe(1);
  });
  it('studies available members in a mixed imported deck and explicitly recovers an unavailable active card', async () => {
    const {deck,workspace} = await seed(); const b = createDeckBackup(workspace,deck.id,now);
    b.deck.cards.push({packId:'not-installed',cardId:'missing',contentRevision:1});
    await importBackup(b,db); const w=await loadWorkspace(db); const fresh=w.decks.find(item=>item.id!==deck.id)!;
    const session=await startReview(fresh.id,now+5000,db);
    expect(session.copyId).not.toBeNull();
    const missing=w.copies.find(copy=>copy.packId==='not-installed')!;
    await db.reviewSessions.put({...session,copyId:missing.id});
    const before=await db.copies.get(missing.id);
    const recovered=await skipUnavailableReview(session.turnId,now+6000,db);
    expect(recovered.copyId).not.toBe(missing.id); expect(recovered.copyId).not.toBeNull();
    expect(await db.copies.get(missing.id)).toEqual(before);
    await expect(skipUnavailableReview(recovered.turnId,now+7000,db)).rejects.toThrow(/Only unavailable/);
  });

});
