import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import publishedData from '../../src/content/published/study-pack.json';
import pilotData from '../../src/content/pilot/study-pack.json';
import operations from '../../src/content/batches/7d1-operations.json';
import users from '../../src/content/batches/7d1-users.json';
import chat from '../../src/content/batches/7d2-chat.json';
import digital from '../../src/content/batches/7d2-digital.json';
import { validatePack } from '../../src/validation';
import { resolveCurationCards, resolveCurationNotes, studyPacks } from '../../src/content/catalog';
import { questionBankManifests } from '../../src/content/questionBanks';
import { createDatabase, createDeck, loadWorkspace } from '../../src/storage';
import { addSelectionToDeck, saveCopyAnnotations } from '../../src/collectionStorage';
import { startReview, revealReview, submitReview } from '../../src/reviewStorage';

const published=validatePack(publishedData),pilot=validatePack(pilotData);
describe('approved study-content expansion',()=>{
  it('extends the canonical owner without changing any approved pilot or earlier-batch item',()=>{
    expect(published.id).toBe(pilot.id);
    expect(published.version).toBe('0.4.0');
    expect(published.cards).toHaveLength(235);
    expect(published.notes).toHaveLength(78);
    for(const card of pilot.cards) expect(published.cards.find(item=>item.id===card.id)).toEqual(card);
    for(const note of pilot.notes) expect(published.notes.find(item=>item.id===note.id)).toEqual(note);
    for(const source of pilot.sources) expect(published.sources.find(item=>item.id===source.id)).toEqual(source);
    for(const previous of [operations,users,chat,digital]) {
      for(const card of previous.cards) expect(published.cards.find(item=>item.id===card.id)).toEqual(card);
      for(const note of previous.notes) expect(published.notes.find(item=>item.id===note.id)).toEqual(note);
      for(const source of previous.sources) expect(published.sources.find(item=>item.id===source.id)).toEqual(source);
    }
    expect(studyPacks.find(pack=>pack.id===pilot.id)).toEqual(published);
    expect(questionBankManifests.find(bank=>bank.id==='ab250-original')?.questionCount).toBe(300);
  });
  it('provides all linked notes and shares rather than duplicates expanded study cards',()=>{
    expect(resolveCurationCards('d365-contact-center')).toHaveLength(157);
    expect(resolveCurationCards('ab250-preparation')).toHaveLength(235);
    expect(resolveCurationCards('ab250-advanced')).toHaveLength(78);
    for(const id of ['d365-contact-center','ab250-preparation','ab250-advanced']) {
      const notes=new Set(resolveCurationNotes(id).map(item=>item.note.id));
      const cards=resolveCurationCards(id);
      expect(cards.every(item=>item.pack.id===pilot.id)).toBe(true);
      expect(cards.every(item=>item.card.noteIds.every(note=>notes.has(note)))).toBe(true);
      expect(new Set(cards.map(item=>item.card.id)).size).toBe(cards.length);
    }
  });
  it.each([pilot.cards.find(card=>card.kind==='recall')!.id,operations.cards.find(card=>card.kind==='recall')!.id,chat.cards.find(card=>card.kind==='recall')!.id])('adding expanded content preserves learned copies of %s, annotations and another deck',async cardId=>{
    const db=createDatabase('published-'+crypto.randomUUID());
    try {
      const first=await createDeck('Existing pilot deck',db),other=await createDeck('Other deck',db);
      const ref={packId:pilot.id,cardId};
      await addSelectionToDeck(first.id,[ref],db);await addSelectionToDeck(other.id,[ref],db);
      const now=Date.now(),session=await startReview(first.id,now,db);
      await revealReview(session.turnId,null,false,db);
      await submitReview({turnId:session.turnId,rating:'again',durationMs:1200},now+1200,db);
      await saveCopyAnnotations(session.copyId!,{personalNote:'Keep my explanation',tags:['revisit']},db);
      const before=await loadWorkspace(db);
      const refs=resolveCurationCards('ab250-preparation').map(({pack,card})=>({packId:pack.id,cardId:card.id}));
      await addSelectionToDeck(first.id,refs,db);
      const after=await loadWorkspace(db);
      expect(after.copies.filter(copy=>copy.deckId===first.id)).toHaveLength(235);
      for(const copy of before.copies)expect(after.copies.find(item=>item.id===copy.id)).toEqual(copy);
      for(const state of before.schedulerStates)expect(after.schedulerStates.find(item=>item.copyId===state.copyId)).toEqual(state);
      expect(after.reviewLogs).toEqual(before.reviewLogs);
      expect(after.session).toEqual(before.session);
      expect(after.testAttempts).toEqual(before.testAttempts);
      expect(after.preferences).toEqual(before.preferences);
    } finally {await db.delete();}
  });
});
