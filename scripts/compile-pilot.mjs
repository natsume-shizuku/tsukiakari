import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { contentFingerprint, pilotItems } from './pilot-review-utils.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = async path => JSON.parse(await fs.readFile(root + path, 'utf8'));
const names = ['d1-d2', 'd3-d4', 'd5-d6'];
const domains = [
  {id:'deployment',title:'Deploy Contact Center',weight:17},
  {id:'channels',title:'Implement channels',weight:32},
  {id:'agents-ai',title:'Configure agents and AI',weight:12},
  {id:'work-distribution',title:'Configure work distribution',weight:12},
  {id:'representative-experience',title:'Configure the representative experience',weight:17},
  {id:'analytics',title:'Manage analytics',weight:10},
];
const topicTitles = {
  'architecture-deployment':'Architecture and deployment','users-security':'Users and security',
  'lifecycle-management':'Lifecycle management','chat-digital':'Chat and digital channels','voice-telephony':'Voice and telephony',
  'copilot-ai':'Copilot and AI','routing-capacity':'Routing and capacity','representative-workspace':'Representative workspace',
  'knowledge-management':'Knowledge management','supervision-analytics':'Supervision and analytics',
};
const bundles = await Promise.all(names.map(name => read('src/content/pilot/' + name + '.json')));
const sources = bundles.flatMap(bundle => bundle.sources);
const notes = bundles.flatMap(bundle => bundle.notes);
const cards = bundles.flatMap(bundle => bundle.cards);
const questions = bundles.flatMap(bundle => bundle.questions);
const editorial = bundles.flatMap(bundle => bundle.editorial);
const unique = (items, name) => { if(new Set(items.map(item => item.id)).size !== items.length) throw new Error('Duplicate ' + name); };
for(const [items,name] of [[sources,'sources'],[notes,'notes'],[cards,'cards'],[questions,'questions'],[editorial,'editorial']]) unique(items,name);
if(notes.length !== 12 || cards.length !== 36 || questions.length !== 24) throw new Error('Pilot must contain 12 notes, 36 cards and 24 questions.');
const items = bundles.flatMap(pilotItems);
if(editorial.length !== items.length) throw new Error('Every item needs exactly one editorial record.');
const approved = [];
for(let index=0;index<names.length;index++) {
  const reviews = await read('docs/phase7/pilot/' + names[index] + '-review.json');
  unique(reviews,'reviews');
  const bundle = bundles[index];
  if(reviews.length !== pilotItems(bundle).length) throw new Error('Missing independent reviews for ' + names[index]);
  for(const item of pilotItems(bundle)) {
    const record = bundle.editorial.find(entry => entry.id === item.id);
    const review = reviews.find(entry => entry.id === item.id);
    const fingerprint = contentFingerprint(item,record,bundle.sources);
    if(!record || record.status !== 'source-reviewed' || !record.objectiveIds.length || !record.evidence.length ||
       record.revision !== (item.revision ?? 1)) throw new Error('Incomplete editorial record: ' + item.id);
    if(!review || review.decision !== 'approved' || !review.reviewer || review.reviewer === record.author ||
       review.revision !== record.revision || review.fingerprint !== fingerprint || !review.reviewedAt ||
       !review.rationale || !Array.isArray(review.findings)) throw new Error('Missing, stale or non-independent approval: ' + item.id);
    if(item.sourceIds.some(id => !review.sourceChecks?.some(check => check.sourceId === id && check.supported === true && check.section && check.notes))) throw new Error('Unreviewed source for ' + item.id);
    if(item.sourceIds.some(id => !record.evidence.some(evidence => evidence.sourceId === id && evidence.section && evidence.claim && evidence.applicability))) throw new Error('Missing claim evidence for ' + item.id);
    approved.push({id:item.id,revision:record.revision,domainId:record.domainId,conceptId:record.conceptId,objectiveIds:record.objectiveIds,level:record.level,author:record.author,reviewer:review.reviewer,reviewedAt:review.reviewedAt,fingerprint});
  }
}
for(const domain of domains) {
  const records = approved.filter(item => item.domainId === domain.id);
  const ownQuestions = questions.filter(item => item.domainId === domain.id);
  if(records.filter(item => notes.some(note => note.id === item.id)).length !== 2 ||
     records.filter(item => cards.some(card => card.id === item.id)).length !== 6 ||
     ownQuestions.filter(item => item.kind === 'single').length !== 3 ||
     ownQuestions.filter(item => item.kind === 'multiple').length !== 1) throw new Error('Incorrect domain balance: ' + domain.id);
}
const owner = 'contact-center-core';
const pack = {
  id:owner,version:'0.1.0',title:'Contact Center source collection',
  description:'Reviewed Phase 7C pilot. A small selection of implementation concepts, not complete certification coverage.',
  fixture:false,examEnabled:false,
  topics:[...new Set(cards.map(card => card.topicId))].map(id => { if(!topicTitles[id]) throw new Error('Unknown topic '+id); return {id,title:topicTitles[id]}; }),
  sources,notes,cards,
};
const bank = {
  id:'ab250-original',version:'0.1.0',title:'AB-250 original questions — pilot',
  description:'24 independently reviewed original questions. Read-only pilot preview; full practice and exams unlock at 300 approved questions. Not Microsoft exam content.',
  fixture:false,domains,sources,questions:questions.map(question => ({...question,status:'approved'})),
};
const curation = (id,title,description,chosen,exam) => ({
  id,version:'0.1.0',title,description,fixture:false,
  topics:exam ? domains.map(({id,title})=>({id,title})) : pack.topics,
  cards:chosen.map(card => ({packId:owner,cardId:card.id,topicId:exam ? approved.find(item=>item.id===card.id).domainId : card.topicId})),
  notes:[...new Set(chosen.flatMap(card => card.noteIds))].map(noteId=>({packId:owner,noteId})),
  questionBankIds:exam ? [bank.id] : [],
});
const curations = [
  curation('d365-contact-center','D365 Contact Center — Implementation',
    'Pilot · 24 foundational recall cards. Learn selected configuration concepts and practical decisions with linked references.',cards.filter(card=>approved.find(item=>item.id===card.id).level==='core'),false),
  curation('ab250-preparation','AB-250 — Certification Preparation',
    'Pilot · 36 cards across all six domains. Includes shared foundations and scenario cards; this is partial objective coverage.',cards,true),
  curation('ab250-advanced','AB-250 — Advanced Scenarios',
    'Pilot · 12 application cards. Work through scoped decisions rather than duplicate the foundational recall cards.',cards.filter(card=>approved.find(item=>item.id===card.id).level==='advanced'),true),
];
if(curations[0].cards.length !==24 || curations[2].cards.length !==12) throw new Error('Incorrect core/advanced card split.');
const manifest = {id:bank.id,version:bank.version,title:bank.title,description:bank.description,fixture:bank.fixture,questionCount:bank.questions.length,domains:bank.domains};
const outputs = {
  'src/content/pilot/study-pack.json':pack,
  'src/content/pilot/ab250-pilot-bank.json':bank,
  'src/content/pilot/curations.json':curations,
  'src/content/pilot/bank-manifest.json':manifest,
  'docs/phase7/pilot/approved-index.json':approved,
};
for(const [path,value] of Object.entries(outputs)) {
  const text = JSON.stringify(value,null,2)+'\n';
  if(process.argv.includes('--write')) await fs.writeFile(root+path,text);
  else if(await fs.readFile(root+path,'utf8') !== text) throw new Error('Generated pilot artifact is stale: '+path);
}
console.log('Pilot review gates passed: 12 notes, 36 cards, 24 questions, 72 independent approvals.');
