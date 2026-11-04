import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {validateQuestionBank,validateQuestionBankReferences} from '../../src/questionBankValidation';
import {validatePack} from '../../src/validation';
import {createTestAttempt,eligibleTestQuestions,answerTestAttempt,completeTestAttempt,retryAttempt} from '../../src/testEngine';
import pilotData from '../../src/content/pilot/ab250-pilot-bank.json';
import packData from '../../src/content/published/study-pack.json';
const bank=validateQuestionBank(JSON.parse(readFileSync('src/content/published/ab250-bank.json','utf8')));
const pack=validatePack(packData),now=1_800_000_000_000;
const options={mode:'practice' as const,count:100,durationMinutes:120};
describe('published original AB-250 bank',()=>{
 it('retains the pilot identities and canonical study references in a separate 300-question bank',()=>{
  expect(bank.fixture).toBe(false);expect(bank.version).toBe('1.0.0');expect(bank.questions).toHaveLength(300);
  expect(bank.questions.slice(0,24)).toEqual(pilotData.questions);
  expect(bank.sources.slice(0,pilotData.sources.length)).toEqual(pilotData.sources);
  expect(()=>validateQuestionBankReferences(bank,[pack])).not.toThrow();
  expect(bank.questions.every(q=>q.status==='approved'&&q.relatedNotes.length>0)).toBe(true);
  expect(bank.questions.filter(q=>q.kind==='multiple')).toHaveLength(75);
  expect(new Set(bank.questions.map(q=>q.conceptId)).size).toBe(300);
  expect(pack.cards).toHaveLength(235);expect(pack.notes).toHaveLength(78);
 });
 it('uses the approved domain allocation for full and smaller timed exams',()=>{
  for(const count of [50,100,300]){
   const attempt=createTestAttempt(bank,{...options,mode:'exam',count},[],now,()=>0.47);
   expect(new Set(attempt.questions.map(q=>q.card.id)).size).toBe(count);
   const counts=bank.domains.map(d=>attempt.questions.filter(q=>q.card.domainId===d.id).length);
   expect(counts).toEqual(count===300?[51,96,36,36,51,30]:count===100?[17,32,12,12,17,10]:[9,16,6,6,8,5]);
   expect(attempt.fixture).toBe(false);expect(attempt.deadlineAt).toBe(now+120*60000);
  }
 });
 it('keeps the 50-question floor and exposes only sufficiently populated practice domains',()=>{
  for(const d of bank.domains){
   const count=bank.questions.filter(q=>q.domainId===d.id).length;
   if(count>=50)expect(eligibleTestQuestions(bank,false,d.id)).toHaveLength(count);
   else expect(()=>eligibleTestQuestions(bank,false,d.id)).toThrow(/at least 50/);
  }
  expect(()=>createTestAttempt(bank,{...options,count:49},[],now)).toThrow();
 });
 it.each(['practice','exam'] as const)('prefers unseen questions across repeated %s attempts using the shared bank identity',mode=>{
  const one=createTestAttempt(bank,{...options,mode},[],now,()=>0.37);
  const two=createTestAttempt(bank,{...options,mode},[one],now+1000,()=>0.37);
  const three=createTestAttempt(bank,{...options,mode},[one,two],now+2000,()=>0.37);
  expect(new Set([...one.questions,...two.questions,...three.questions].map(q=>q.card.id)).size).toBe(300);
 });
 it('scores the exact multiple-answer set, retains source snapshots and retries the recorded questions',()=>{
  const source=structuredClone(bank);
  let attempt=createTestAttempt(source,{...options,count:300},[],now,()=>0.37);
  const multiple=attempt.questions.find(q=>q.card.kind==='multiple')!;
  attempt=answerTestAttempt(attempt,multiple.card.id,[multiple.card.correctOptionIds[0]],now+1);
  const partial=completeTestAttempt(attempt,now+2);expect(partial.result).toEqual({correct:0,wrong:1,skipped:299});
  attempt=answerTestAttempt(attempt,multiple.card.id,multiple.card.correctOptionIds,now+3);
  const completed=completeTestAttempt(attempt,now+4);expect(completed.result).toEqual({correct:1,wrong:0,skipped:299});
  const before=structuredClone(completed.questions);
  source.questions.forEach(q=>{q.answer='Later catalog edit';q.explanation='Later explanation';});source.sources.forEach(s=>{s.title='Later title';});
  const retry=retryAttempt(completed,now+5);
  expect(retry.questions).toEqual(before);expect(retry.bankVersion).toBe('1.0.0');
  expect(retry.responses.every(r=>!r.revealed&&!r.selectedOptionIds.length)).toBe(true);
 });
});
