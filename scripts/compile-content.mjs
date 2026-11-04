import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { auditStudyCoverage } from './study-coverage-utils.mjs';
import { validateBatchManifest, validateStudyBatch, combineReviewedContent } from './content-review-utils.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
if(args.some(arg=>!['--write','--check'].includes(arg)) || args.length>1) throw new Error('Use compile-content.mjs --write or --check.');
const read=async relative=>JSON.parse(await fs.readFile(path.join(root,relative),'utf8'));
// Frozen pilot outputs must match their own independent reviews. Never regenerate them here.
execFileSync(process.execPath,[path.join(root,'scripts/compile-pilot.mjs'),'--check'],{cwd:root,stdio:'inherit'});
const manifest=validateBatchManifest(await read('src/content/batches/manifest.json'));
const [baseline,pilotCurations,pilotApprovals,objectiveCsv]=await Promise.all([
  read('src/content/pilot/study-pack.json'),read('src/content/pilot/curations.json'),read('docs/phase7/pilot/approved-index.json'),
  fs.readFile(path.join(root,'docs/phase7/objective-coverage.csv'),'utf8'),
]);
const objectiveIds=new Set(objectiveCsv.trim().split(/\r?\n/).slice(1).map(line=>line.split(',')[0]));
const batches=[];
for(const spec of manifest.batches) {
  const [bundle,reviews]=await Promise.all([read(spec.bundle),read(spec.review)]);
  const approvals=validateStudyBatch({bundle,reviews,spec,baseline,objectiveIds});
  batches.push({id:spec.id,bundle,approvals});
}
const {pack,curations,approved}=combineReviewedContent({baseline,pilotCurations,pilotApprovals,batches,manifest});
const coverage=auditStudyCoverage({pack,approved,objectiveIds:[...objectiveIds],gaps:await read('docs/phase7/source-gaps.json'),reviewedAt:approved.reduce((latest,item)=>item.reviewedAt>latest?item.reviewedAt:latest,manifest.authorizedOn)});
const outputs={
  'docs/phase7/study-coverage.json':coverage,
  'src/content/published/study-pack.json':pack,
  'src/content/published/curations.json':curations,
  'docs/phase7/approved-content-index.json':approved,
};
// No publication begins until every batch, reference and approval has passed.
for(const [relative,value] of Object.entries(outputs)) {
  const target=path.join(root,relative), text=JSON.stringify(value,null,2)+'\n';
  if(args.includes('--write')) {
    await fs.mkdir(path.dirname(target),{recursive:true});
    await fs.writeFile(target,text);
  } else if(await fs.readFile(target,'utf8')!==text) throw new Error('Generated content is stale: '+relative);
}
console.log(`Content review gates passed: ${pack.notes.length} notes, ${pack.cards.length} cards, ${approved.length} approvals; pilot question bank unchanged.`);
