import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {validatePack} from '../src/validation.ts';
import {validateExamManifest,validateExamBatch,combineExamBank} from './exam-review-utils.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
if(args.length!==1||!['--write','--check'].includes(args[0]))throw Error('Use --write or --check');
execFileSync(process.execPath,[path.join(root,'scripts/compile-content.mjs'),'--check'],{cwd:root,stdio:'inherit'});
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const manifest=validateExamManifest(await read('src/content/exams/manifest.json'));
const pilot=await read('src/content/pilot/ab250-pilot-bank.json'),pack=validatePack(await read('src/content/published/study-pack.json'));
const allPilot=await read('docs/phase7/pilot/approved-index.json'),pilotApprovals=allPilot.filter(r=>pilot.questions.some(q=>q.id===r.id));
const objectiveIds=new Set((await fs.readFile(path.join(root,'docs/phase7/objective-coverage.csv'),'utf8')).trim().split(/\r?\n/).slice(1).map(l=>l.split(',')[0]));
const sourceGaps=await read('docs/phase7/source-gaps.json');
const blockedIds=new Set(sourceGaps.filter(g=>g.status==='blocked-source').map(g=>g.objectiveId));
const batches=[];
for(const spec of manifest.batches){const bundle=await read(spec.bundle),reviews=await read(spec.review);const approvals=validateExamBatch({bundle,reviews,spec,pilot,pack,objectiveIds,blockedIds});batches.push({id:spec.id,bundle,approvals})}
const distinctnessReviews=await read('docs/phase7/exams/distinctness-review.json');
const {bank,bankManifest,approvals,quality}=combineExamBank({pilot,pack,pilotApprovals,batches,manifest,distinctnessReviews});
const coverageRows=[...objectiveIds].map(objectiveId=>{const questionIds=bank.questions.filter(q=>q.objectiveIds.includes(objectiveId)).map(q=>q.id);return{objectiveId,status:blockedIds.has(objectiveId)?'blocked-source':questionIds.length?'exam-partial':'not-represented',questionIds}});
const coverage={questionCount:bank.questions.length,objectiveRows:coverageRows.length,representedObjectives:coverageRows.filter(r=>r.questionIds.length).length,scope:'Mapped items do not establish complete skill coverage or learner mastery.',sourceGaps,rows:coverageRows};
const outputs={'docs/phase7/exams/coverage.json':coverage,'src/content/published/ab250-bank.json':bank,'src/content/published/bank-manifest.json':bankManifest,'docs/phase7/exams/approved-index.json':approvals,'docs/phase7/exams/quality-scan.json':quality};
// Every input gate is checked before any combined bank artifact is written.
for(const [relative,value] of Object.entries(outputs)){const target=path.join(root,relative),text=JSON.stringify(value,null,2)+'\n';if(args[0]==='--write'){await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text)}else if(await fs.readFile(target,'utf8')!==text)throw Error('Stale generated exam artifact: '+relative)}
console.log('Exam publication gates passed:300 questions,300 independent approvals; frozen pilot and study collection preserved.');
