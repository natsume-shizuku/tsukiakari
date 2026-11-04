import {describe,expect,it} from 'vitest';
import {newDeckSettings,type LearningCopy,type ReviewLog,type StudyCuration,type StudyPack,type WorkspaceSnapshot} from '../../src/domain';
import {initialState} from '../../src/scheduling';
import {getTopicStatistics,type TopicCatalog} from '../../src/topicInsights';
import {engineeringQuestionBank} from '../../src/content/engineeringQuestionBank';
import {completeTestAttempt,createTestAttempt} from '../../src/testEngine';

const now=Date.parse('2026-11-03T18:00:00Z');
function workspace():WorkspaceSnapshot{return {decks:['one','two'].map(id=>({id,name:id,createdAt:1,settings:newDeckSettings()})),copies:[],schedulerStates:[],reviewLogs:[],session:null,testAttempts:[],testExposures:[],preferences:{id:'preferences',theme:'dark',timeZone:'UTC',dayStartsAtHour:5}};}
function pack(id:string):StudyPack{return {id,version:'1',title:'Pack '+id,description:'Synthetic source pack',fixture:false,examEnabled:false,topics:[{id:'basics',title:'Basics'},{id:'other',title:'Other'}],sources:[{id:'s',title:'Source',url:'https://learn.microsoft.com/'}],notes:[],cards:[{id:'shared-card',revision:1,topicId:'basics',kind:'recall',prompt:'Question',answer:'Answer',explanation:'Explanation',sourceIds:['s'],noteIds:[],tags:[]}]};}
function catalog():TopicCatalog {
 const packs=[pack('p'),pack('q')];
 const curated=(id:string):StudyCuration=>({id,version:'1',title:'Curation '+id,description:'Synthetic curation',fixture:false,topics:[{id:'domain',title:'Domain'},{id:'untouched',title:'Untouched'}],cards:[{packId:'p',cardId:'shared-card',topicId:'domain'},{packId:'q',cardId:'shared-card',topicId:'domain'}],notes:[],questionBankIds:[]});
 return {packs,curations:[curated('c1'),curated('c2')]};
}
function log(day:string,options:Partial<Pick<ReviewLog,'deckId'|'at'|'rating'|'undone'>> & {packId?:string;cardId?:string;copyId?:string}={}):ReviewLog{
 const deckId=options.deckId??'one',at=options.at??Date.parse(day+'T18:00:00Z');
 const copy:LearningCopy={id:options.copyId??deckId+'-copy',deckId,packId:options.packId??'p',cardId:options.cardId??'shared-card',contentRevision:1,createdAt:1,personalNote:'',tags:[],suspended:false};
 const state=initialState(copy.id),session={id:'active' as const,deckId,copyId:copy.id,turnId:'turn',revealed:true,selectedOptionId:null,guessed:false,startedAt:at,shownAt:at};
 return {id:crypto.randomUUID(),copyId:copy.id,deckId,at,studyDay:day,rating:options.rating??'right',durationMs:1000,undone:options.undone??false,contentRevision:1,before:state,after:state,settings:newDeckSettings(),sequence:1,undoable:false,timeZone:'UTC',dayStartsAtHour:5,copyBefore:copy,copyAfter:copy,sessionBefore:session,sessionAfter:session};
}
function row(data:WorkspaceSnapshot,scope:Parameters<typeof getTopicStatistics>[2]={},content=catalog()){return getTopicStatistics(data,now,scope,content).rows.find(r=>r.packId==='p'&&r.topicId==='basics')!;}

describe('flashcard topic statistics',()=>{
 it('shows untouched current topics as zero counts with no fabricated rate',()=>{const result=getTopicStatistics(workspace(),now,{},catalog());expect(result.rows).toHaveLength(4);expect(result.from).toBe('2026-10-05');expect(result.rows.every(r=>r.reviews===0&&r.distinctCards===0&&r.againRate===null)).toBe(true);});
 it('uses the inclusive30 saved-study-day window and excludes undone/future/invalid reviews',()=>{
  const w=workspace();w.reviewLogs=[log('2026-10-04'),log('2026-10-05',{rating:'again'}),log('2026-11-03'),log('2026-11-03',{undone:true}),log('2026-11-04',{at:now-1}),log('2026-11-03',{at:now+1}),log('2026-10-99',{at:now-1}),log('not-a-date',{at:now-1})];
  expect(row(w)).toMatchObject({reviews:2,again:1,right:1,againRate:.5,distinctCards:1});
  expect(row(w,{period:'all'})).toMatchObject({reviews:3,again:1,right:2,againRate:1/3});
 });
 it('uses today before/after5am without moving historical saved dates when timezone changes',()=>{
  const w=workspace();w.reviewLogs=[log('2026-10-04'),log('2026-11-02',{at:Date.parse('2026-11-03T04:30:00Z')})];
  const early=getTopicStatistics(w,Date.parse('2026-11-03T04:59:59Z'),{},catalog());expect(early.today).toBe('2026-11-02');expect(early.from).toBe('2026-10-04');expect(early.rows[0].reviews).toBe(2);
  const boundary=getTopicStatistics(w,Date.parse('2026-11-03T05:00:00Z'),{},catalog());expect(boundary.today).toBe('2026-11-03');expect(boundary.rows[0].reviews).toBe(1);
  w.preferences.timeZone='Asia/Tokyo';expect(getTopicStatistics(w,now,{},catalog()).rows[0].reviews).toBe(1);
 });
 it('uses calendar-day arithmetic across fall DST rather than a fixed30x24-hour cutoff',()=>{
  const w=workspace();w.preferences.timeZone='America/Denver';w.reviewLogs=[log('2026-10-04'),log('2026-10-05',{at:Date.parse('2026-10-05T11:00:00Z')})];
  const summary=getTopicStatistics(w,Date.parse('2026-11-03T12:00:00Z'),{},catalog());expect(summary.today).toBe('2026-11-03');expect(summary.from).toBe('2026-10-05');expect(summary.rows[0].reviews).toBe(1);
 });
 it('counts repeated reviews but deduplicates canonical cards across independent decks',()=>{
  const w=workspace();w.reviewLogs=[log('2026-11-02',{rating:'again'}),log('2026-11-03'),log('2026-11-03',{deckId:'two'})];
  expect(row(w)).toMatchObject({reviews:3,again:1,right:2,distinctCards:1});expect(row(w,{deckId:'one'})).toMatchObject({reviews:2,again:1,right:1,distinctCards:1});expect(row(w,{deckId:'two'})).toMatchObject({reviews:1,again:0,right:1});
 });
 it('keeps removed-copy history and uses the saved canonical identity even if copy IDs collide',()=>{
  const w=workspace();const first=log('2026-11-03',{copyId:'collision',packId:'p'}),second=log('2026-11-03',{copyId:'collision',packId:'q'});w.reviewLogs=[first,second];w.copies=[{...first.copyBefore,removed:true}];
  const rows=getTopicStatistics(w,now,{},catalog()).rows;expect(rows.filter(r=>r.reviews).map(r=>r.distinctCards)).toEqual([1,1]);expect(rows.reduce((n,r)=>n+r.reviews,0)).toBe(2);
 });
 it('groups by current content topics rather than stale copy revisions',()=>{
  const w=workspace();w.reviewLogs=[log('2026-11-03')];const content=catalog();content.packs[0].cards[0].topicId='other';const result=getTopicStatistics(w,now,{},content);expect(result.rows.find(r=>r.packId==='p'&&r.topicId==='basics')!.reviews).toBe(0);expect(result.rows.find(r=>r.packId==='p'&&r.topicId==='other')!.reviews).toBe(1);
 });
 it('uses one selectedcuration mapping without duplicating overlapping collections',()=>{
  const w=workspace();w.reviewLogs=[log('2026-11-03',{rating:'again'}),log('2026-11-03',{packId:'q'})];const summary=getTopicStatistics(w,now,{curationId:'c1'},catalog());expect(summary.rows).toHaveLength(2);expect(summary.rows[0]).toMatchObject({curationId:'c1',topicId:'domain',reviews:2,again:1,right:1,distinctCards:2,href:'#library/cards?curation=c1&topic=domain'});expect(summary.rows[1].againRate).toBeNull();expect(getTopicStatistics(w,now,{},catalog()).rows.reduce((n,r)=>n+r.reviews,0)).toBe(2);
 });
 it('retains an explicit unavailable-content bucket and never assigns unknown history to a curation',()=>{
  const w=workspace();w.reviewLogs=[log('2026-11-03',{cardId:'uninstalled'}),log('2026-11-03',{packId:'gone'}),log('2026-11-03',{packId:'gone',cardId:'other'})];const result=getTopicStatistics(w,now,{},catalog());expect(result.rows.filter(r=>r.unavailable).map(r=>({reviews:r.reviews,distinct:r.distinctCards,href:r.href}))).toEqual([{reviews:1,distinct:1,href:null},{reviews:2,distinct:2,href:null}]);expect(getTopicStatistics(w,now,{curationId:'c1'},catalog()).rows.every(r=>r.reviews===0)).toBe(true);
 });
 it('never includes test attempts or changes any learner records',()=>{
  const w=workspace();w.testAttempts=[completeTestAttempt(createTestAttempt(engineeringQuestionBank,{mode:'practice',count:50,durationMinutes:120,fixturePreview:true},[],now-1000),now)];const before=structuredClone(w);expect(getTopicStatistics(w,now,{},catalog()).rows.every(r=>r.reviews===0)).toBe(true);expect(w).toEqual(before);
 });
 it('fails explicitly for an unavailable curated pack or unsupported period',()=>{expect(()=>getTopicStatistics(workspace(),now,{curationId:'missing'},catalog())).toThrow(/unavailable/);expect(()=>getTopicStatistics(workspace(),now,{period:'invalid' as 'all'},catalog())).toThrow(/period/);});
});
