// node scripts/compile-simulator-bank.mjs --write | --check
//   --draft-check <bundle.json>   structure check for authors; proves nothing about facts
//   --stamp <batchId>             reviewers: fill fingerprints on approved entries that have none
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePack} from '../src/validation.ts';
import {combineSimulatorBank,simulatorFingerprint,validateSimulatorBatch,validateSimulatorDraft,validateSimulatorManifest} from './simulator-review-utils.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const [mode,target]=process.argv.slice(2);
if(!['--write','--check','--draft-check','--stamp'].includes(mode)||(['--draft-check','--stamp'].includes(mode)&&!target))throw Error('Use --write, --check, --draft-check <bundle> or --stamp <batchId>');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const manifest=validateSimulatorManifest(await read('src/content/simulator/manifest.json'));
const pack=validatePack(await read('src/content/published/study-pack.json'));
const accepted=await read('src/content/published/ab250-bank.json');
const base={id:manifest.bankId,version:manifest.releaseVersion,title:manifest.title,description:manifest.description,fixture:false,domains:accepted.domains};
const objectiveIds=new Set((await fs.readFile(path.join(root,'docs/phase7/objective-coverage.csv'),'utf8')).trim().split(/\r?\n/).slice(1).map(line=>line.split(',')[0]));
const blockedIds=new Set((await read('docs/phase7/source-gaps.json')).filter(gap=>gap.status==='blocked-source').map(gap=>gap.objectiveId));
const context={pack,objectiveIds,blockedIds,base};

if(mode==='--draft-check'){
 const bundle=await read(target);
 const bank=validateSimulatorDraft({...context,bundle});
 console.log(`Draft structure passed: ${bank.questions.length} questions. This does not check facts.`);
 process.exit(0);
}
if(mode==='--stamp'){
 const spec=manifest.batches.find(batch=>batch.id===target);
 const bundlePath=spec?.bundle??`src/content/simulator/${target}.json`,reviewPath=spec?.review??`docs/phase8/reviews/${target}-review.json`;
 const bundle=await read(bundlePath),reviews=await read(reviewPath);
 let stamped=0;
 for(const review of reviews){
  if(review.decision!=='approved'||review.fingerprint)continue;
  const question=bundle.questions.find(item=>item.id===review.id);
  if(!question)throw Error('Review for an unknown question: '+review.id);
  review.fingerprint=simulatorFingerprint(question,bundle);
  stamped++;
 }
 await fs.writeFile(path.join(root,reviewPath),JSON.stringify(reviews,null,2)+'\n');
 console.log(`Stamped ${stamped} approvals in ${reviewPath}.`);
 process.exit(0);
}

const batches=[];
for(const spec of manifest.batches){
 const bundle=await read(spec.bundle),reviews=await read(spec.review);
 batches.push({id:spec.id,bundle,approvals:validateSimulatorBatch({...context,bundle,reviews})});
}
if(!batches.length){console.log('Simulator bank: no approved batches yet.');process.exit(0)}
const distinctnessReviews=await read('docs/phase8/reviews/distinctness.json');
const {bank,bankManifest,approvals,quality}=combineSimulatorBank({manifest,batches,distinctnessReviews,pack,base});
const outputs={'src/content/published/ab250-simulator-bank.json':bank,'src/content/published/simulator-manifest.json':bankManifest,'docs/phase8/approved-index.json':approvals,'docs/phase8/quality-scan.json':quality};
for(const [relative,value] of Object.entries(outputs)){
 const file=path.join(root,relative),output=JSON.stringify(value,null,2)+'\n';
 if(mode==='--write'){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,output)}
 else if(await fs.readFile(file,'utf8')!==output)throw Error('Stale simulator artifact: '+relative);
}
console.log(`Simulator gates passed: ${bank.questions.length} questions, ${approvals.length} independent approvals, ${bank.groups.length} groups.`);
