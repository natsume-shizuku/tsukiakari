import {describe,it,expect} from 'vitest';
import type {ExamQuestion,StudyPack,TestAttempt,TestQuestionSnapshot} from '../../src/domain';
import {getLearningResources,getTestDomainResults} from '../../src/testResults';

function question(id:string,domainId:string,title:string,kind:'single'|'multiple'='single'):TestQuestionSnapshot {
 const card:ExamQuestion={id,revision:1,kind,domainId,objectiveIds:[],conceptId:id,prompt:'Question '+id,answer:'Recorded answer',explanation:'Recorded explanation',sourceIds:['source'],tags:[],options:[{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C'},{id:'d',text:'D'}],correctOptionIds:kind==='multiple'?['b','d']:['a'],optionExplanations:{a:'Recorded A',b:'Recorded B',c:'Recorded C',d:'Recorded D'},relatedNotes:[{packId:'owner',noteId:'note'}],status:'approved'};
 return {bankId:'bank',card,domainTitle:title,sources:[{id:'source',title:'Recorded source',url:'https://learn.microsoft.com/en-us/'}]};
}
function attempt():TestAttempt {
 return {id:'attempt',bankId:'bank',bankVersion:'old-version',bankTitle:'Recorded bank',mode:'practice',startedAt:1,deadlineAt:null,completedAt:10,
 questions:[question('one','old-routing','Recorded routing'),question('two','old-routing','Recorded routing','multiple'),question('three','old-ai','Recorded AI'),question('four','old-ai','Recorded AI')],
 responses:[{cardId:'one',selectedOptionIds:['a'],revealed:false},{cardId:'two',selectedOptionIds:['b'],revealed:true},{cardId:'three',selectedOptionIds:[],revealed:true},{cardId:'four',selectedOptionIds:['a'],revealed:true}],result:{correct:2,wrong:1,skipped:1}};
}
function pack(id='owner'):StudyPack {
 return {id,version:'current',title:'Current '+id,description:'Fixture for resource resolution',fixture:true,examEnabled:false,topics:[{id:'topic',title:'Topic'}],sources:[{id:'source',title:'Source',url:'https://learn.microsoft.com/en-us/'}],notes:[{id:'note',title:'Current note '+id,body:'Current teaching text',sourceIds:['source']}],cards:[{id:'card',revision:1,topicId:'topic',kind:'recall',prompt:'Current card '+id,answer:'Answer',explanation:'Explanation',sourceIds:['source'],noteIds:['note'],tags:[]}]};
}

describe('completed test domain results',()=>{
 it('returns no results or resource references for an unfinished practice or exam',()=>{
  for(const mode of ['practice','exam'] as const){const value=attempt();value.mode=mode;value.completedAt=null;value.result=null;expect(getTestDomainResults(value)).toEqual([]);}
 });
 it('scores frozen exact sets and separates revealed correct, wrong and skipped samples',()=>{
  const rows=getTestDomainResults(attempt());
  expect(rows.map(({domainId,title,total,correct,wrong,skipped,revealed,correctWithoutReveal})=>({domainId,title,total,correct,wrong,skipped,revealed,correctWithoutReveal}))).toEqual([
   {domainId:'old-routing',title:'Recorded routing',total:2,correct:1,wrong:1,skipped:0,revealed:1,correctWithoutReveal:1},
   {domainId:'old-ai',title:'Recorded AI',total:2,correct:1,wrong:0,skipped:1,revealed:2,correctWithoutReveal:0}
  ]);
 });
 it('accepts a complete multiple-answer set in either order and gives partial or wrong sets no point',()=>{
  const value=attempt();value.responses[1].selectedOptionIds=['d','b'];
  expect(getTestDomainResults(value)[0]).toMatchObject({correct:2,wrong:0});
  value.responses[1].selectedOptionIds=['d','c'];expect(getTestDomainResults(value)[0]).toMatchObject({correct:1,wrong:1});
 });
 it('keeps recorded titles, answers and references when current content changes or disappears',()=>{
  const value=attempt(),before=structuredClone(value),current=pack();current.title='Renamed content';current.cards[0].answer='Different current answer';current.notes=[];
  const rows=getTestDomainResults(value);
  expect(rows[0].title).toBe('Recorded routing');expect(rows[0].correct).toBe(1);
  expect(getLearningResources(rows[0].relatedNotes,[current])).toMatchObject({notes:[],cards:[],unavailableNotes:[{packId:'owner',noteId:'note'}]});
  expect(value).toEqual(before);
 });
 it('deduplicates references by owner plus note and preserves legacy unclassified grouping',()=>{
  const value=attempt();value.questions.forEach(q=>{q.card.domainId='legacy-unclassified';q.domainTitle='Unclassified (legacy)';q.card.relatedNotes=[];});
  value.questions[0].card.relatedNotes=[{packId:'a',noteId:'same'},{packId:'a',noteId:'same'},{packId:'b',noteId:'same'}];
  const [row]=getTestDomainResults(value);
  expect(row).toMatchObject({domainId:'legacy-unclassified',title:'Unclassified (legacy)',total:4,unlinkedQuestions:3});
  expect(row.relatedNotes).toEqual([{packId:'a',noteId:'same'},{packId:'b',noteId:'same'}]);
 });
});

describe('current learning resources from saved canonical references',()=>{
 it('deduplicates overlapping note/card links without merging owners with matching local IDs',()=>{
  const a=pack('a'),b=pack('b');a.notes.push({...a.notes[0],id:'second',title:'Another note'});a.cards[0].noteIds.push('second');
  const refs=[{packId:'a',noteId:'note'},{packId:'a',noteId:'note'},{packId:'a',noteId:'second'},{packId:'b',noteId:'note'}];
  const result=getLearningResources(refs,[a,b]);
  expect(result.notes).toHaveLength(3);expect(result.cards).toEqual([{packId:'a',cardId:'card',prompt:'Current card a'},{packId:'b',cardId:'card',prompt:'Current card b'}]);
  expect(result.unavailableNotes).toEqual([]);
 });
 it('does not infer replacement resources for unavailable packs or deleted notes',()=>{
  const installed=pack('a');
  const result=getLearningResources([{packId:'gone',noteId:'note'},{packId:'a',noteId:'deleted'},{packId:'a',noteId:'deleted'}],[installed]);
  expect(result).toEqual({notes:[],cards:[],unavailableNotes:[{packId:'gone',noteId:'note'},{packId:'a',noteId:'deleted'}]});
 });
 it('shows a surviving reference note even when all its related cards are unavailable',()=>{
  const current=pack();current.cards=[];
  expect(getLearningResources([{packId:'owner',noteId:'note'}],[current])).toEqual({notes:[{packId:'owner',noteId:'note',title:'Current note owner'}],cards:[],unavailableNotes:[]});
 });
 it('returns no guessed learning links for snapshots with no saved references and does not mutate inputs',()=>{
  const current=pack(),before=structuredClone(current);
  expect(getLearningResources([],[current])).toEqual({notes:[],cards:[],unavailableNotes:[]});
  getLearningResources([{packId:'owner',noteId:'note'}],[current]);expect(current).toEqual(before);
 });
});
