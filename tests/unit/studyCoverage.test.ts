import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import published from '../../src/content/published/study-pack.json';
import approved from '../../docs/phase7/approved-content-index.json';
import gaps from '../../docs/phase7/source-gaps.json';
const helper='../../scripts/study-coverage-utils.mjs';
const {auditStudyCoverage}=await import(helper);
const objectiveIds=readFileSync('docs/phase7/objective-coverage.csv','utf8').trim().split(/\r?\n/).slice(1).map(line=>line.split(',')[0]);
const input=()=>({pack:published,approved,objectiveIds,gaps,reviewedAt:approved.reduce((latest,item)=>item.reviewedAt>latest?item.reviewedAt:latest,'2026-11-02')});
describe('final study evidence reconciliation',()=>{
 it('accounts for every official objective with study evidence or a visible researched block',()=>{
  const report=auditStudyCoverage(input());expect(report.objectives).toHaveLength(119);
  expect(report.objectives.filter((row:{state:string})=>row.state==='blocked-source').map((row:{id:string})=>row.id)).toEqual(['D1.1.06','D6.1.05']);
  const saved=JSON.parse(readFileSync('docs/phase7/study-coverage.json','utf8'));expect(saved).toEqual(report);
 });
 it('cannot silently omit teaching evidence or replace an unsupported setup with a different feature',()=>{
  const missing=input();missing.approved=approved.filter(item=>!item.objectiveIds.includes('D2.1.01'));expect(()=>auditStudyCoverage(missing)).toThrow(/note and card/);
  const blocked=input();blocked.approved=[...approved,{...approved[0],id:published.notes[0].id,objectiveIds:['D1.1.06']},{...approved[0],id:published.cards[0].id,objectiveIds:['D1.1.06']}];expect(()=>auditStudyCoverage(blocked)).toThrow(/Blocked objective/);
 });
 it('requires distinct, registered primary research gaps with reasons',()=>{
  expect(()=>auditStudyCoverage({...input(),gaps:[...gaps,gaps[0]]})).toThrow(/research gap/);
  expect(()=>auditStudyCoverage({...input(),gaps:[{...gaps[0],reason:''},...gaps.slice(1)]})).toThrow(/research gap/);
 });
});
