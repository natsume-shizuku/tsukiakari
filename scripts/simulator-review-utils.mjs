// Publication gates for the simulator bank. Totals come from the manifest, so new reviewed
// batches can be added later without changing this file.
import {sourceSchema} from '../src/validation.ts';
import {validateQuestionBank,validateQuestionBankReferences} from '../src/questionBankValidation.ts';
import {contentFingerprint} from './pilot-review-utils.mjs';
import {scanQuestionSimilarity} from './exam-review-utils.mjs';

const fail=message=>{throw Error(message)};
const text=value=>typeof value==='string'&&value.trim().length>0;
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value));
const canonical=value=>JSON.stringify(value,(_,v)=>v&&!Array.isArray(v)&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const ids=(items,label)=>{if(!Array.isArray(items)||items.some(item=>!text(item?.id))||new Set(items.map(item=>item.id)).size!==items.length)fail('Missing or duplicate '+label)};
const exact=(actual,expected,label)=>{if(canonical([...actual].sort())!==canonical([...expected].sort()))fail('Unexpected '+label)};
const domainPrefix={deployment:'D1.',channels:'D2.','agents-ai':'D3.','work-distribution':'D4.','representative-experience':'D5.',analytics:'D6.'};
// Microsoft sample names read as lifted scenarios, so invented organizations must be genuinely new.
const sampleNames=/\b(fabrikam|vanarsdel|contoso|northwind|adventure works|tailspin|wide world importers|litware|proseware|woodgrove|fourth coffee|alpine ski|trey research|relecloud|lucerne publishing|margie's travel|wingtip|coho)\b/i;
const formatOf=(question,groups)=>groups.find(group=>group.id===question.groupId)?.kind==='series'?'series':question.kind;
const optionIds=question=>question.kind==='hotspot'?question.rows.flatMap(row=>row.options.map(option=>option.id)):(question.options??question.tokens).map(option=>option.id);
// Case stems are short on purpose ("You need to resolve Issue 4"), so similarity must compare what is tested, not the stem alone.
const withChoices=question=>({...question,prompt:[question.prompt,...(question.options??[]).map(o=>o.text),...(question.tokens??[]).map(o=>o.text),...(question.rows??[]).flatMap(row=>[row.label,...(row.options??[]).map(o=>o.text)])].join(' ')});
const allText=question=>[question.prompt,question.answer,question.explanation,...(question.options??[]).map(o=>o.text),...(question.tokens??[]).map(o=>o.text),...(question.rows??[]).flatMap(row=>[row.label,...(row.options??[]).map(o=>o.text)]),...Object.values(question.optionExplanations)].join('\n');

function checkShape(question,groups){
 const id=question.id,group=groups.find(item=>item.id===question.groupId);
 if(sampleNames.test(allText(question)))fail('Microsoft sample name in '+id);
 if(group?.kind==='series'){
  if(question.kind!=='single'||canonical(question.options.map(o=>o.text))!==canonical(['Yes','No']))fail('Series question must offer Yes then No: '+id);
  if(!/^Solution:/.test(question.prompt)||!/Does the solution meet the goal\?$/.test(question.prompt.trim()))fail('Series prompt must start with Solution: and end with the goal question: '+id);
  return;
 }
 if(question.kind==='single'||question.kind==='multiple'){
  if(question.options.length<4||question.options.length>5||question.correctOptionIds.length>=question.options.length)fail('Selection needs 4 or 5 options: '+id);
  if(question.kind==='multiple'){
   // Read only the final question, so a scenario can mention "three supervisors" freely.
   const match=question.prompt.trim().split(/\n/).at(-1).match(/\b(two|three)\b/i),counts={two:2,three:3};
   if(!match||counts[match[1].toLowerCase()]!==question.correctOptionIds.length)fail('Multiple question must state its exact count: '+id);
  }
 }
 if(question.kind==='match'){
  if(question.tokens.length<4||question.tokens.length>6||question.rows.length<2||question.rows.length>4)fail('Match needs 4 to 6 tokens and 2 to 4 rows: '+id);
  if(question.rows.length<4&&new Set(question.rows.map(row=>row.correctTokenId)).size>=question.tokens.length)fail('Match needs a distractor: '+id);
 }
 if(question.kind==='order'){
  if(question.tokens.length<4||question.tokens.length>6||question.correctOrder.length<3||question.correctOrder.length>=question.tokens.length)fail('Order needs 3 or more steps plus a distractor: '+id);
  if(canonical(question.tokens.slice(0,question.correctOrder.length).map(o=>o.id))===canonical(question.correctOrder))fail('Order tray must not show the answer order: '+id);
 }
 if(question.kind==='hotspot'){
  if(question.rows.length<2||question.rows.length>3||question.rows.some(row=>row.options.length<3||row.options.length>4))fail('Hotspot needs 2 or 3 rows of 3 or 4 options: '+id);
 }
}
function checkGroup(group){
 if(group.exhibits.some(exhibit=>sampleNames.test(exhibit.body)||sampleNames.test(exhibit.title))||sampleNames.test(group.title))fail('Microsoft sample name in group '+group.id);
 if(group.kind==='case-study'&&(group.exhibits.length<4||group.exhibits.reduce((sum,exhibit)=>sum+exhibit.body.length,0)<900))fail('Case study needs at least 4 substantial exhibits: '+group.id);
}

/** Structure only, for authors. Passing this is not review or approval. */
export function validateSimulatorDraft({bundle,pack,objectiveIds,blockedIds,base}){
 exact(Object.keys(bundle),['sources','groups','questions','editorial'],'bundle fields');
 for(const key of ['sources','groups','questions','editorial'])ids(bundle[key],key);
 exact(bundle.editorial.map(item=>item.id),bundle.questions.map(item=>item.id),'editorial identities');
 for(const source of bundle.sources){sourceSchema.parse(source);if(new URL(source.url).hostname!=='learn.microsoft.com'||!source.id.startsWith('sim-'))fail('Sources must be sim- IDs on learn.microsoft.com: '+source.id)}
 bundle.groups.forEach(checkGroup);
 const groupIds=new Set(bundle.groups.map(group=>group.id));
 const bank=validateQuestionBank({...base,sources:bundle.sources,questions:bundle.questions,groups:bundle.groups});
 validateQuestionBankReferences(bank,[pack]);
 for(const group of bundle.groups)if(!bank.questions.some(question=>question.groupId===group.id))fail('Empty group: '+group.id);
 for(const question of bank.questions){
  const editorial=bundle.editorial.find(item=>item.id===question.id);
  checkShape(question,bundle.groups);
  if(!question.id.startsWith('sim-'))fail('Question IDs start with sim-: '+question.id);
  if(question.groupId&&!groupIds.has(question.groupId))fail('Question refers to a group in another bundle: '+question.id);
  if(question.status!=='draft'||!question.relatedNotes.length||question.relatedNotes.some(note=>note.packId!==pack.id))fail('Invalid draft scope: '+question.id);
  if(!question.objectiveIds.length||question.objectiveIds.some(id=>!objectiveIds.has(id)||blockedIds.has(id)||!id.startsWith(domainPrefix[question.domainId])))fail('Unsupported objective scope: '+question.id);
  if(editorial.status!=='source-reviewed'||editorial.revision!==question.revision||editorial.domainId!==question.domainId||editorial.conceptId!==question.conceptId||canonical(editorial.objectiveIds)!==canonical(question.objectiveIds)||!text(editorial.author)||!date(editorial.authoredAt)||!text(editorial.duplicateCheck)||!Array.isArray(editorial.evidence))fail('Incomplete editorial record: '+question.id);
  for(const sourceId of question.sourceIds)if(!editorial.evidence.some(item=>item.sourceId===sourceId&&text(item.section)&&text(item.claim)&&text(item.applicability)))fail('Missing claim evidence: '+question.id);
  if(optionIds(question).some(id=>!text(question.optionExplanations[id])))fail('Every choice needs an explanation: '+question.id);
 }
 return bank;
}

/** Group text is part of the fingerprint, so changing a case study invalidates its questions' approvals. */
export function simulatorFingerprint(question,bundle){
 const group=bundle.groups.find(item=>item.id===question.groupId)??null;
 return contentFingerprint({...question,group},bundle.editorial.find(item=>item.id===question.id),bundle.sources);
}

export function validateSimulatorManifest(manifest){
 if(manifest?.version!==1||!text(manifest.bankId)||!text(manifest.releaseVersion)||!text(manifest.title)||!text(manifest.description)||typeof manifest.release!=='boolean'||!manifest.blueprint)fail('Invalid simulator manifest');
 ids(manifest.batches,'simulator batches');
 for(const batch of manifest.batches)if(!batch.bundle?.startsWith('src/content/simulator/')||!batch.review?.startsWith('docs/phase8/reviews/'))fail('Batch outside the simulator folders: '+batch.id);
 return manifest;
}
export function validateSimulatorBatch({bundle,reviews,pack,objectiveIds,blockedIds,base}){
 validateSimulatorDraft({bundle,pack,objectiveIds,blockedIds,base});
 ids(reviews,'reviews');
 exact(reviews.map(item=>item.id),bundle.questions.map(item=>item.id),'review identities');
 return bundle.questions.map(question=>{
  const editorial=bundle.editorial.find(item=>item.id===question.id),review=reviews.find(item=>item.id===question.id);
  if(review.decision!=='approved'||!text(review.reviewer)||review.reviewer===editorial.author||review.revision!==question.revision||!date(review.reviewedAt)||review.reviewedAt<editorial.authoredAt||!text(review.rationale)||!Array.isArray(review.findings)||review.fingerprint!==simulatorFingerprint(question,bundle))fail('Missing, stale or non-independent approval: '+question.id);
  for(const sourceId of question.sourceIds)if(!review.sourceChecks?.some(item=>item.sourceId===sourceId&&item.supported===true&&text(item.section)&&text(item.notes)&&date(item.accessedAt)&&date(item.claimReviewedAt)))fail('Unreviewed source: '+question.id);
  return {id:question.id,revision:question.revision,domainId:question.domainId,conceptId:question.conceptId,objectiveIds:question.objectiveIds,kind:question.kind,groupId:question.groupId??null,author:editorial.author,reviewer:review.reviewer,reviewedAt:review.reviewedAt,fingerprint:review.fingerprint};
 });
}

export function combineSimulatorBank({manifest,batches,distinctnessReviews,pack,base}){
 const merged=new Map();
 for(const source of batches.flatMap(batch=>batch.bundle.sources)){
  const earlier=merged.get(source.id);
  if(earlier&&earlier.url!==source.url)fail('One source ID has two URLs: '+source.id);
  merged.set(source.id,source);
 }
 const sources=[...merged.values()].sort((a,b)=>a.id.localeCompare(b.id));
 const questions=batches.flatMap(batch=>batch.bundle.questions.map(question=>({...question,status:'approved'})));
 const groups=batches.flatMap(batch=>batch.bundle.groups);
 const approvals=batches.flatMap(batch=>batch.approvals);
 ids(questions,'combined questions');ids(groups,'combined groups');
 if(new Set(questions.map(question=>question.conceptId)).size!==questions.length)fail('Every question needs its own concept');
 if(new Set(questions.map(question=>question.prompt.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim())).size!==questions.length)fail('Duplicate normalized prompts');
 const bank=validateQuestionBank({id:manifest.bankId,version:manifest.releaseVersion,title:manifest.title,description:manifest.description,fixture:false,domains:base.domains,sources,questions,groups,blueprint:manifest.blueprint});
 validateQuestionBankReferences(bank,[pack]);
 const pairs=scanQuestionSimilarity(questions.filter(question=>!question.prompt.startsWith('Solution:')).map(withChoices));
 const reviewed=new Map((distinctnessReviews??[]).map(review=>[review.ids.join('|'),review]));
 for(const pair of pairs){const review=reviewed.get(pair.ids.join('|'));if(!review||review.decision!=='distinct'||!text(review.reviewer)||!date(review.reviewedAt)||!text(review.rationale)||canonical(review.fingerprints)!==canonical(pair.fingerprints))fail('Unresolved similar-question pair: '+pair.ids.join(' / '))}
 const total=questions.length,formats={},domains={};
 for(const question of questions){const format=formatOf(question,groups);formats[format]=(formats[format]??0)+1;domains[question.domainId]=(domains[question.domainId]??0)+1}
 if(manifest.release){
  // A growing bank drifts a little, so the mix is held to a tolerance rather than exact counts.
  for(const [format,share] of Object.entries(manifest.blueprint.shares))if(Math.abs(100*(formats[format]??0)/total-share)>3)fail('Format mix too far from blueprint: '+format);
  for(const domain of base.domains)if(Math.abs(100*(domains[domain.id]??0)/total-domain.weight)>3)fail('Domain mix too far from weight: '+domain.id);
  if(!groups.some(group=>group.kind==='case-study')||!groups.some(group=>group.kind==='series'))fail('A release needs case studies and a series');
 }
 const quality={questions:total,formats,domains,groups:groups.map(group=>({id:group.id,kind:group.kind,questions:questions.filter(question=>question.groupId===group.id).length})),nearDuplicateThreshold:0.55,nearDuplicatePairs:pairs,
  singleAnswerPositions:Array.from({length:5},(_,index)=>({position:index+1,count:questions.filter(question=>question.kind==='single'&&!question.groupId?.includes('series')&&question.options[index]?.id===question.correctOptionIds[0]).length}))};
 return {bank,bankManifest:{id:bank.id,version:bank.version,title:bank.title,description:bank.description,fixture:false,questionCount:total,domains:bank.domains},approvals,quality};
}
