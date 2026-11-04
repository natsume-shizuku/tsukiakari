import {createHash} from 'node:crypto';
import {sourceSchema} from '../src/validation.ts';
import {validateQuestionBank,validateQuestionBankReferences} from '../src/questionBankValidation.ts';
import {contentFingerprint} from './pilot-review-utils.mjs';
export const authorizedExamManifest=Object.freeze({
  "version": 1,
  "bankId": "ab250-original",
  "releaseVersion": "1.0.0",
  "approvedStage": "7E",
  "authorizedOn": "2026-11-03",
  "batches": [
    {
      "id": "7e-deployment",
      "bundle": "src/content/exams/7e-deployment.json",
      "review": "docs/phase7/exams/7e-deployment-review.json",
      "domainId": "deployment",
      "objectivePrefix": "D1.",
      "sourcePrefix": "exam-d1-",
      "questionIds": [
        "ab250-d1-q05",
        "ab250-d1-q06",
        "ab250-d1-q07",
        "ab250-d1-q08",
        "ab250-d1-q09",
        "ab250-d1-q10",
        "ab250-d1-q11",
        "ab250-d1-q12",
        "ab250-d1-q13",
        "ab250-d1-q14",
        "ab250-d1-q15",
        "ab250-d1-q16",
        "ab250-d1-q17",
        "ab250-d1-q18",
        "ab250-d1-q19",
        "ab250-d1-q20",
        "ab250-d1-q21",
        "ab250-d1-q22",
        "ab250-d1-q23",
        "ab250-d1-q24",
        "ab250-d1-q25",
        "ab250-d1-q26",
        "ab250-d1-q27",
        "ab250-d1-q28",
        "ab250-d1-q29",
        "ab250-d1-q30",
        "ab250-d1-q31",
        "ab250-d1-q32",
        "ab250-d1-q33",
        "ab250-d1-q34",
        "ab250-d1-q35",
        "ab250-d1-q36",
        "ab250-d1-q37",
        "ab250-d1-q38",
        "ab250-d1-q39",
        "ab250-d1-q40",
        "ab250-d1-q41",
        "ab250-d1-q42",
        "ab250-d1-q43",
        "ab250-d1-q44",
        "ab250-d1-q45",
        "ab250-d1-q46",
        "ab250-d1-q47",
        "ab250-d1-q48",
        "ab250-d1-q49",
        "ab250-d1-q50",
        "ab250-d1-q51"
      ],
      "single": 35,
      "multiple": 12
    },
    {
      "id": "7e-channels-digital",
      "bundle": "src/content/exams/7e-channels-digital.json",
      "review": "docs/phase7/exams/7e-channels-digital-review.json",
      "domainId": "channels",
      "objectivePrefix": "D2.",
      "sourcePrefix": "exam-d2-digital-",
      "questionIds": [
        "ab250-d2-q05",
        "ab250-d2-q06",
        "ab250-d2-q07",
        "ab250-d2-q08",
        "ab250-d2-q09",
        "ab250-d2-q10",
        "ab250-d2-q11",
        "ab250-d2-q12",
        "ab250-d2-q13",
        "ab250-d2-q14",
        "ab250-d2-q15",
        "ab250-d2-q16",
        "ab250-d2-q17",
        "ab250-d2-q18",
        "ab250-d2-q19",
        "ab250-d2-q20",
        "ab250-d2-q21",
        "ab250-d2-q22",
        "ab250-d2-q23",
        "ab250-d2-q24",
        "ab250-d2-q25",
        "ab250-d2-q26",
        "ab250-d2-q27",
        "ab250-d2-q28",
        "ab250-d2-q29",
        "ab250-d2-q30",
        "ab250-d2-q31",
        "ab250-d2-q32",
        "ab250-d2-q33",
        "ab250-d2-q34",
        "ab250-d2-q35"
      ],
      "single": 23,
      "multiple": 8
    },
    {
      "id": "7e-channels-voice",
      "bundle": "src/content/exams/7e-channels-voice.json",
      "review": "docs/phase7/exams/7e-channels-voice-review.json",
      "domainId": "channels",
      "objectivePrefix": "D2.",
      "sourcePrefix": "exam-d2-voice-",
      "questionIds": [
        "ab250-d2-q36",
        "ab250-d2-q37",
        "ab250-d2-q38",
        "ab250-d2-q39",
        "ab250-d2-q40",
        "ab250-d2-q41",
        "ab250-d2-q42",
        "ab250-d2-q43",
        "ab250-d2-q44",
        "ab250-d2-q45",
        "ab250-d2-q46",
        "ab250-d2-q47",
        "ab250-d2-q48",
        "ab250-d2-q49",
        "ab250-d2-q50",
        "ab250-d2-q51",
        "ab250-d2-q52",
        "ab250-d2-q53",
        "ab250-d2-q54",
        "ab250-d2-q55",
        "ab250-d2-q56",
        "ab250-d2-q57",
        "ab250-d2-q58",
        "ab250-d2-q59",
        "ab250-d2-q60",
        "ab250-d2-q61",
        "ab250-d2-q62",
        "ab250-d2-q63",
        "ab250-d2-q64",
        "ab250-d2-q65",
        "ab250-d2-q66"
      ],
      "single": 23,
      "multiple": 8
    },
    {
      "id": "7e-channels-operations",
      "bundle": "src/content/exams/7e-channels-operations.json",
      "review": "docs/phase7/exams/7e-channels-operations-review.json",
      "domainId": "channels",
      "objectivePrefix": "D2.",
      "sourcePrefix": "exam-d2-operations-",
      "questionIds": [
        "ab250-d2-q67",
        "ab250-d2-q68",
        "ab250-d2-q69",
        "ab250-d2-q70",
        "ab250-d2-q71",
        "ab250-d2-q72",
        "ab250-d2-q73",
        "ab250-d2-q74",
        "ab250-d2-q75",
        "ab250-d2-q76",
        "ab250-d2-q77",
        "ab250-d2-q78",
        "ab250-d2-q79",
        "ab250-d2-q80",
        "ab250-d2-q81",
        "ab250-d2-q82",
        "ab250-d2-q83",
        "ab250-d2-q84",
        "ab250-d2-q85",
        "ab250-d2-q86",
        "ab250-d2-q87",
        "ab250-d2-q88",
        "ab250-d2-q89",
        "ab250-d2-q90",
        "ab250-d2-q91",
        "ab250-d2-q92",
        "ab250-d2-q93",
        "ab250-d2-q94",
        "ab250-d2-q95",
        "ab250-d2-q96"
      ],
      "single": 23,
      "multiple": 7
    },
    {
      "id": "7e-ai",
      "bundle": "src/content/exams/7e-ai.json",
      "review": "docs/phase7/exams/7e-ai-review.json",
      "domainId": "agents-ai",
      "objectivePrefix": "D3.",
      "sourcePrefix": "exam-d3-",
      "questionIds": [
        "ab250-d3-q05",
        "ab250-d3-q06",
        "ab250-d3-q07",
        "ab250-d3-q08",
        "ab250-d3-q09",
        "ab250-d3-q10",
        "ab250-d3-q11",
        "ab250-d3-q12",
        "ab250-d3-q13",
        "ab250-d3-q14",
        "ab250-d3-q15",
        "ab250-d3-q16",
        "ab250-d3-q17",
        "ab250-d3-q18",
        "ab250-d3-q19",
        "ab250-d3-q20",
        "ab250-d3-q21",
        "ab250-d3-q22",
        "ab250-d3-q23",
        "ab250-d3-q24",
        "ab250-d3-q25",
        "ab250-d3-q26",
        "ab250-d3-q27",
        "ab250-d3-q28",
        "ab250-d3-q29",
        "ab250-d3-q30",
        "ab250-d3-q31",
        "ab250-d3-q32",
        "ab250-d3-q33",
        "ab250-d3-q34",
        "ab250-d3-q35",
        "ab250-d3-q36"
      ],
      "single": 24,
      "multiple": 8
    },
    {
      "id": "7e-routing",
      "bundle": "src/content/exams/7e-routing.json",
      "review": "docs/phase7/exams/7e-routing-review.json",
      "domainId": "work-distribution",
      "objectivePrefix": "D4.",
      "sourcePrefix": "exam-d4-",
      "questionIds": [
        "ab250-d4-q05",
        "ab250-d4-q06",
        "ab250-d4-q07",
        "ab250-d4-q08",
        "ab250-d4-q09",
        "ab250-d4-q10",
        "ab250-d4-q11",
        "ab250-d4-q12",
        "ab250-d4-q13",
        "ab250-d4-q14",
        "ab250-d4-q15",
        "ab250-d4-q16",
        "ab250-d4-q17",
        "ab250-d4-q18",
        "ab250-d4-q19",
        "ab250-d4-q20",
        "ab250-d4-q21",
        "ab250-d4-q22",
        "ab250-d4-q23",
        "ab250-d4-q24",
        "ab250-d4-q25",
        "ab250-d4-q26",
        "ab250-d4-q27",
        "ab250-d4-q28",
        "ab250-d4-q29",
        "ab250-d4-q30",
        "ab250-d4-q31",
        "ab250-d4-q32",
        "ab250-d4-q33",
        "ab250-d4-q34",
        "ab250-d4-q35",
        "ab250-d4-q36"
      ],
      "single": 24,
      "multiple": 8
    },
    {
      "id": "7e-experience",
      "bundle": "src/content/exams/7e-experience.json",
      "review": "docs/phase7/exams/7e-experience-review.json",
      "domainId": "representative-experience",
      "objectivePrefix": "D5.",
      "sourcePrefix": "exam-d5-",
      "questionIds": [
        "ab250-d5-q05",
        "ab250-d5-q06",
        "ab250-d5-q07",
        "ab250-d5-q08",
        "ab250-d5-q09",
        "ab250-d5-q10",
        "ab250-d5-q11",
        "ab250-d5-q12",
        "ab250-d5-q13",
        "ab250-d5-q14",
        "ab250-d5-q15",
        "ab250-d5-q16",
        "ab250-d5-q17",
        "ab250-d5-q18",
        "ab250-d5-q19",
        "ab250-d5-q20",
        "ab250-d5-q21",
        "ab250-d5-q22",
        "ab250-d5-q23",
        "ab250-d5-q24",
        "ab250-d5-q25",
        "ab250-d5-q26",
        "ab250-d5-q27",
        "ab250-d5-q28",
        "ab250-d5-q29",
        "ab250-d5-q30",
        "ab250-d5-q31",
        "ab250-d5-q32",
        "ab250-d5-q33",
        "ab250-d5-q34",
        "ab250-d5-q35",
        "ab250-d5-q36",
        "ab250-d5-q37",
        "ab250-d5-q38",
        "ab250-d5-q39",
        "ab250-d5-q40",
        "ab250-d5-q41",
        "ab250-d5-q42",
        "ab250-d5-q43",
        "ab250-d5-q44",
        "ab250-d5-q45",
        "ab250-d5-q46",
        "ab250-d5-q47",
        "ab250-d5-q48",
        "ab250-d5-q49",
        "ab250-d5-q50",
        "ab250-d5-q51"
      ],
      "single": 35,
      "multiple": 12
    },
    {
      "id": "7e-analytics",
      "bundle": "src/content/exams/7e-analytics.json",
      "review": "docs/phase7/exams/7e-analytics-review.json",
      "domainId": "analytics",
      "objectivePrefix": "D6.",
      "sourcePrefix": "exam-d6-",
      "questionIds": [
        "ab250-d6-q05",
        "ab250-d6-q06",
        "ab250-d6-q07",
        "ab250-d6-q08",
        "ab250-d6-q09",
        "ab250-d6-q10",
        "ab250-d6-q11",
        "ab250-d6-q12",
        "ab250-d6-q13",
        "ab250-d6-q14",
        "ab250-d6-q15",
        "ab250-d6-q16",
        "ab250-d6-q17",
        "ab250-d6-q18",
        "ab250-d6-q19",
        "ab250-d6-q20",
        "ab250-d6-q21",
        "ab250-d6-q22",
        "ab250-d6-q23",
        "ab250-d6-q24",
        "ab250-d6-q25",
        "ab250-d6-q26",
        "ab250-d6-q27",
        "ab250-d6-q28",
        "ab250-d6-q29",
        "ab250-d6-q30"
      ],
      "single": 20,
      "multiple": 6
    }
  ]
});
const canonical=value=>JSON.stringify(value,(_,v)=>v&&!Array.isArray(v)&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const fail=message=>{throw Error(message)};
const text=value=>typeof value==='string'&&value.trim().length>0;
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const ids=(items,label)=>{if(!Array.isArray(items)||items.some(x=>!text(x?.id))||new Set(items.map(x=>x.id)).size!==items.length)fail('Missing/duplicate '+label)};
const exact=(actual,expected,label)=>{if(canonical([...actual].sort())!==canonical([...expected].sort()))fail('Unauthorized '+label)};
export function validateExamManifest(input){if(canonical(input)!==canonical(authorizedExamManifest))fail('Exam manifest outside authorized7E scope');return input}
export function validateExamBatch({bundle,reviews,spec,pilot,pack,objectiveIds,blockedIds}){
 if(!authorizedExamManifest.batches.some(x=>canonical(x)===canonical(spec)))fail('Unauthorized exam batch');
 exact(Object.keys(bundle),['sources','questions','editorial'],'exam bundle fields');
 for(const k of ['sources','questions','editorial'])ids(bundle[k],k);
 exact(bundle.questions.map(q=>q.id),spec.questionIds,'question identities');
 exact(bundle.editorial.map(q=>q.id),spec.questionIds,'editorial identities');
 ids(reviews,'reviews');exact(reviews.map(q=>q.id),spec.questionIds,'review identities');
 for(const s of bundle.sources){sourceSchema.parse(s);if(new URL(s.url).hostname!=='learn.microsoft.com'||!s.id.startsWith(spec.sourcePrefix))fail('Unregistered primary source scope: '+s.id)}
 if(bundle.sources.some(s=>pilot.sources.some(old=>old.id===s.id)))fail('Source identity collides with pilot');
 const bank=validateQuestionBank({...pilot,sources:bundle.sources,questions:bundle.questions});
 validateQuestionBankReferences(bank,[pack]);
 if(bank.questions.filter(q=>q.kind==='single').length!==spec.single||bank.questions.filter(q=>q.kind==='multiple').length!==spec.multiple)fail('Unauthorized format counts');
 const approvals=[];
 for(const q of bundle.questions){
  const e=bundle.editorial.find(x=>x.id===q.id),r=reviews.find(x=>x.id===q.id);
  if(q.status!=='draft'||q.domainId!==spec.domainId||q.options.length<4||q.options.length>5||!q.relatedNotes.length||q.relatedNotes.some(n=>n.packId!==pack.id)||q.correctOptionIds.length>=q.options.length)fail('Invalid draft question scope: '+q.id);
  if(q.objectiveIds.some(id=>!objectiveIds.has(id)||!id.startsWith(spec.objectivePrefix)||blockedIds.has(id)))fail('Unsupported objective scope: '+q.id);
  if(q.kind==='multiple'){
   const match=q.prompt.match(/(?:choose|select)\s+(two|three|2|3)\b/i),counts={two:2,three:3,'2':2,'3':3};
   if(!match||counts[match[1].toLowerCase()]!==q.correctOptionIds.length)fail('Multiple question must state exact selection count: '+q.id);
  }
  if(e.status!=='source-reviewed'||e.revision!==q.revision||e.domainId!==q.domainId||e.conceptId!==q.conceptId||canonical(e.objectiveIds)!==canonical(q.objectiveIds)||e.level!=='advanced'||!text(e.author)||!date(e.authoredAt)||!text(e.duplicateCheck)||!Array.isArray(e.evidence))fail('Incomplete editorial record: '+q.id);
  for(const sid of q.sourceIds)if(!e.evidence.some(v=>v.sourceId===sid&&text(v.section)&&text(v.claim)&&text(v.applicability)))fail('Missing claim evidence: '+q.id);
  if(r.decision!=='approved'||!text(r.reviewer)||r.reviewer===e.author||r.revision!==q.revision||!date(r.reviewedAt)||r.reviewedAt<e.authoredAt||!text(r.rationale)||!Array.isArray(r.findings)||r.fingerprint!==contentFingerprint(q,e,bundle.sources))fail('Missing stale or non-independent exam approval: '+q.id);
  for(const sid of q.sourceIds)if(!r.sourceChecks?.some(v=>v.sourceId===sid&&v.supported===true&&text(v.section)&&text(v.notes)))fail('Unreviewed exam source: '+q.id);
  approvals.push({id:q.id,revision:q.revision,domainId:q.domainId,conceptId:q.conceptId,objectiveIds:q.objectiveIds,kind:q.kind,author:e.author,reviewer:r.reviewer,reviewedAt:r.reviewedAt,fingerprint:r.fingerprint});
 }
 return approvals;
}
const stop=new Set('a an the is are was were be to of in on at with and or for from that this their its has have had as by should which what how team company organization contact center dynamics365 dynamics 365 customer service representative representatives configure configured uses using needs requires requirement wants you must'.split(' '));
const tokens=q=>new Set(q.prompt.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(t=>t.length>2&&!stop.has(t)));
export const questionDigest=q=>createHash('sha256').update(JSON.stringify(q)).digest('hex');
export function scanQuestionSimilarity(questions){
 const sets=questions.map(tokens),pairs=[],digests=new Map(questions.map(q=>[q.id,questionDigest(q)]));
 for(let i=0;i<questions.length;i++)for(let j=i+1;j<questions.length;j++){
  const intersection=[...sets[i]].filter(t=>sets[j].has(t)).length,score=intersection/(sets[i].size+sets[j].size-intersection);
  if(score>=0.55)pairs.push({ids:[questions[i].id,questions[j].id].sort(),score:Number(score.toFixed(3)),fingerprints:[questions[i],questions[j]].sort((a,b)=>a.id.localeCompare(b.id)).map(q=>digests.get(q.id))});
 }
 return pairs.sort((a,b)=>b.score-a.score);
}
export function combineExamBank({pilot,pack,pilotApprovals,batches,manifest,distinctnessReviews}){
 validateExamManifest(manifest);
 exact(batches.map(b=>b.id),manifest.batches.map(b=>b.id),'exam batches');
 const sources=[...pilot.sources,...batches.flatMap(b=>b.bundle.sources)],questions=[...pilot.questions,...batches.flatMap(b=>b.bundle.questions.map(q=>({...q,status:'approved'})))];
 ids(sources,'combined sources');ids(questions,'combined questions');
 exact(pilotApprovals.map(r=>r.id),pilot.questions.map(q=>q.id),'pilot question approvals');
 const approvals=[...pilotApprovals,...batches.flatMap(b=>b.approvals)];ids(approvals,'combined approvals');
 if(questions.length!==300||approvals.length!==300||new Set(questions.map(q=>q.conceptId)).size!==300)fail('Bank needs300 distinct approved concepts');
 if(new Set(questions.map(q=>q.prompt.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim())).size!==300)fail('Duplicate normalized exam prompts');
 const expected=[51,96,36,36,51,30];pilot.domains.forEach((d,i)=>{if(questions.filter(q=>q.domainId===d.id).length!==expected[i])fail('Wrong domain allocation')});
 if(questions.filter(q=>q.kind==='single').length!==225||questions.filter(q=>q.kind==='multiple').length!==75)fail('Wrong bank format mix');
 const bank=validateQuestionBank({...pilot,version:manifest.releaseVersion,title:'AB-250 — Original Practice',description:'300 sourced original practice questions across six skill domains. Review explanations and linked notes to revisit decisions. This is independent practice material, not Microsoft exam content.',sources,questions});
 validateQuestionBankReferences(bank,[pack]);
 const pairs=scanQuestionSimilarity(questions);
 if(!Array.isArray(distinctnessReviews))fail('Missing distinctness review');
 const pairReviews=new Map();for(const r of distinctnessReviews){if(!Array.isArray(r.ids)||r.ids.length!==2||r.ids[0]===r.ids[1])fail('Invalid distinctness review');const key=r.ids.join('|');if(pairReviews.has(key))fail('Duplicate distinctness review');pairReviews.set(key,r)}
 for(const pair of pairs){const review=pairReviews.get(pair.ids.join('|'));if(!review||review.decision!=='distinct'||!text(review.reviewer)||!date(review.reviewedAt)||!text(review.rationale)||canonical(review.fingerprints)!==canonical(pair.fingerprints))fail('Unresolved similar-question pair: '+pair.ids.join(' / '))}
 const quality={questions:300,single:225,multiple:75,nearDuplicateThreshold:0.55,nearDuplicatePairs:pairs,domainCounts:pilot.domains.map(d=>({id:d.id,count:questions.filter(q=>q.domainId===d.id).length})),singleAnswerPositions:Array.from({length:5},(_,i)=>({position:i+1,count:questions.filter(q=>q.kind==='single'&&q.options[i]?.id===q.correctOptionIds[0]).length}))};
 const bankManifest={id:bank.id,version:bank.version,title:bank.title,description:bank.description,fixture:bank.fixture,questionCount:bank.questions.length,domains:bank.domains};
 return {bank,bankManifest,approvals,quality};
}
