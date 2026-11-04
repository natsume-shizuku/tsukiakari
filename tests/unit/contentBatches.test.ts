import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import baseline from '../../src/content/pilot/study-pack.json';
import pilotCurations from '../../src/content/pilot/curations.json';
import pilotApprovals from '../../docs/phase7/pilot/approved-index.json';
import { validatePack } from '../../src/validation';

// Authoring tooling is native ESM; runtime imports also exercise Node's compiler helpers.
const helperPath = '../../scripts/content-review-utils.mjs';
const fingerprintPath = '../../scripts/pilot-review-utils.mjs';
const { authorizedManifest, validateBatchManifest, validateStudyBatch, combineReviewedContent } = await import(helperPath);
const { contentFingerprint } = await import(fingerprintPath);
const domainPrefixes:Record<string,string>={'deployment':'D1','channels':'D2','agents-ai':'D3','work-distribution':'D4','representative-experience':'D5','analytics':'D6'};
const objectiveIds = new Set(Object.values(domainPrefixes).map(prefix=>prefix+'.1.01'));
objectiveIds.add('D1.3.01');
function fixture(index = 0) {
  const spec = structuredClone(authorizedManifest.batches[index]);
  const topicId = spec.domainId==='channels'?'chat-digital':'users-security';
  const objectiveId = domainPrefixes[spec.domainId]+'.1.01';
  const sources = [{id:spec.id+'-source',title:'Synthetic test source',url:'https://learn.microsoft.com/en-us/example'}];
  const notes = spec.noteIds.map((id:string) => ({id,title:'Fixture '+id,body:'Source-backed fixture body.',sourceIds:[sources[0].id]}));
  const cards = spec.cardIds.map((id:string,index:number) => ({
    id,revision:1,topicId,kind:index<spec.coreCards?'recall':'mcq',prompt:'Fixture prompt '+id,
    answer:'Supported answer',explanation:'Explanation '+id,sourceIds:[sources[0].id],noteIds:[notes[index%notes.length].id],tags:['topic:'+topicId],
    ...(index<spec.coreCards?{}:{options:[{id:'a',text:'Supported answer'},{id:'b',text:'Wrong alternative'}],correctOptionId:'a'}),
  }));
  const items=[...notes,...cards];
  const editorial=items.map(item=>({id:item.id,revision:1,domainId:spec.domainId,conceptId:'concept-'+item.id,objectiveIds:[objectiveId],
    level:cards.findIndex((card:{id:string})=>card.id===item.id)>=spec.coreCards?'advanced':'core',author:'fixture-author',authoredAt:'2026-10-31',status:'source-reviewed',
    evidence:[{sourceId:sources[0].id,section:'Section',claim:'Supported claim',applicability:'Synthetic test scenario'}],duplicateCheck:'Distinct fixture concept.'}));
  const bundle={sources,notes,cards,questions:[],editorial};
  const reviews=items.map(item=>({id:item.id,revision:1,reviewer:'fixture-reviewer',reviewedAt:'2026-10-31',decision:'approved',
    fingerprint:contentFingerprint(item,editorial.find(record=>record.id===item.id),sources),rationale:'Checked the synthetic evidence.',findings:[],
    sourceChecks:[{sourceId:sources[0].id,section:'Section',supported:true,notes:'Checked the complete claim.'}]}));
  return {bundle,reviews,spec,baseline,objectiveIds};
}
function resign(input:ReturnType<typeof fixture>,id:string) {
  const item=[...input.bundle.notes,...input.bundle.cards].find(item=>item.id===id)!;
  const record=input.bundle.editorial.find(record=>record.id===id)!;
  const review=input.reviews.find(review=>review.id===id)!;
  review.revision=record.revision;
  review.fingerprint=contentFingerprint(item,record,input.bundle.sources);
}

describe('bounded study-content batch publication',()=>{
  it('allows only the approved manifest and assigned IDs/counts',()=>{
    const manifest=JSON.parse(readFileSync('src/content/batches/manifest.json','utf8'));
    expect(validateBatchManifest(manifest)).toEqual(authorizedManifest);
    const changed=structuredClone(manifest);changed.batches[0].cards=12;
    expect(()=>validateBatchManifest(changed)).toThrow(/authorized/);
    const extra=structuredClone(manifest);extra.batches.push({...extra.batches[0],id:'7d2'});
    expect(()=>validateBatchManifest(extra)).toThrow(/authorized/);
    const owner=structuredClone(manifest);owner.canonicalPackId='replacement';
    expect(()=>validateBatchManifest(owner)).toThrow(/authorized/);
    const input=fixture();input.bundle.cards.pop();
    expect(()=>validateStudyBatch(input)).toThrow(/size/);
  });
  it('accepts complete source reviews without mutating source content',()=>{
    const input=fixture(), before=JSON.stringify(input.bundle);
    const approved=validateStudyBatch(input);
    expect(approved).toHaveLength(12);
    expect(new Set(approved.map((item:{id:string})=>item.id)).size).toBe(12);
    expect(JSON.stringify(input.bundle)).toBe(before);
  });
  it.each(['item','editorial','source'])('invalidates approval after a %s change',kind=>{
    const input=fixture();
    if(kind==='item') input.bundle.cards[0].prompt='A different tested meaning';
    if(kind==='editorial') input.bundle.editorial[0].evidence[0].claim='Changed evidence';
    if(kind==='source') input.bundle.sources[0].title='Changed source';
    expect(()=>validateStudyBatch(input)).toThrow(/stale/);
  });
  it('rejects missing, duplicate, self, unapproved and revision-mismatched reviews',()=>{
    const missing=fixture();missing.reviews.pop();expect(()=>validateStudyBatch(missing)).toThrow(/review/);
    const duplicate=fixture();duplicate.reviews[1]=duplicate.reviews[0];expect(()=>validateStudyBatch(duplicate)).toThrow(/duplicate/);
    const self=fixture();self.reviews[0].reviewer='fixture-author';expect(()=>validateStudyBatch(self)).toThrow(/non-independent/);
    const pending=fixture();pending.reviews[0].decision='needs-revision';expect(()=>validateStudyBatch(pending)).toThrow(/approval/);
    const revision=fixture();revision.reviews[0].revision=2;expect(()=>validateStudyBatch(revision)).toThrow(/approval/);
  });
  it('requires known objective mappings and complete source evidence even with a new fingerprint',()=>{
    const unknown=fixture();unknown.bundle.editorial[0].objectiveIds=['D1.9.99'];resign(unknown,unknown.bundle.notes[0].id);
    expect(()=>validateStudyBatch(unknown)).toThrow(/objective/);
    const scope=fixture();scope.bundle.editorial[0].domainId='channels';resign(scope,scope.bundle.notes[0].id);
    expect(()=>validateStudyBatch(scope)).toThrow(/scope/);
    const evidence=fixture();evidence.bundle.editorial[0].evidence=[];resign(evidence,evidence.bundle.notes[0].id);
    expect(()=>validateStudyBatch(evidence)).toThrow(/evidence/);
    const unchecked=fixture();unchecked.reviews[0].sourceChecks[0].supported=false;
    expect(()=>validateStudyBatch(unchecked)).toThrow(/Unreviewed/);
  });
  it.each([0,2,8,9,10,11])('enforces the exact domain prefix as well as known objective membership for batch %s',index=>{
    const valid=fixture(index);
    expect(validateStudyBatch(valid)).toHaveLength(valid.spec.notes+valid.spec.cards);
    const crossDomain=fixture(index);
    crossDomain.bundle.editorial[0].objectiveIds=[index===0?'D2.1.01':'D1.3.01'];
    resign(crossDomain,crossDomain.bundle.notes[0].id);
    expect(()=>validateStudyBatch(crossDomain)).toThrow(/objective/);
    const unknown=fixture(index);
    unknown.bundle.editorial[0].objectiveIds=[index===0?'D1.9.99':'D2.9.99'];
    resign(unknown,unknown.bundle.notes[0].id);
    expect(()=>validateStudyBatch(unknown)).toThrow(/objective/);
    const spoofed=fixture(index);
    spoofed.bundle.editorial[0].objectiveIds=[index===0?'D10.1.01':'D20.1.01'];
    spoofed.objectiveIds=new Set([...objectiveIds,...spoofed.bundle.editorial[0].objectiveIds]);
    resign(spoofed,spoofed.bundle.notes[0].id);
    expect(()=>validateStudyBatch(spoofed)).toThrow(/objective/);
  });
  it('rejects duplicate identities and collisions with published items',()=>{
    const duplicate=fixture();duplicate.bundle.cards[1].id=duplicate.bundle.cards[0].id;
    expect(()=>validateStudyBatch(duplicate)).toThrow(/duplicate/);
    const source=fixture();source.bundle.sources[0].id=baseline.sources[0].id;
    expect(()=>validateStudyBatch(source)).toThrow(/collides/);
    const item=fixture();item.bundle.cards[0].id=baseline.cards[0].id;
    expect(()=>validateStudyBatch(item)).toThrow(/identities/);
  });
  it('uses the app schema for note references, topics and correct option keys',()=>{
    const note=fixture();note.bundle.cards[0].noteIds=['missing-note'];expect(()=>validateStudyBatch(note)).toThrow();
    const topic=fixture();topic.bundle.cards[0].topicId='unknown';expect(()=>validateStudyBatch(topic)).toThrow(/topic/);
    const key=fixture();key.bundle.cards[6].correctOptionId='unknown';expect(()=>validateStudyBatch(key)).toThrow(/Correct option/);
    const source=fixture();source.bundle.cards[0].sourceIds=['missing-source'];expect(()=>validateStudyBatch(source)).toThrow(/registered/);
  });
  it('blocks exam additions, unlinked notes and unauthorized core/application splits',()=>{
    const exam=fixture();(exam.bundle.questions as {id:string}[]).push({id:'new-exam-question'});
    expect(()=>validateStudyBatch(exam)).toThrow(/cannot publish exam/);
    const unlinked=fixture();unlinked.bundle.cards.forEach((card:{noteIds:string[]})=>{card.noteIds=[unlinked.bundle.notes[0].id];});
    expect(()=>validateStudyBatch(unlinked)).toThrow(/Each new note/);
    const level=fixture();level.bundle.editorial.find(record=>record.id===level.bundle.cards[0].id)!.level='advanced';resign(level,level.bundle.cards[0].id);
    expect(()=>validateStudyBatch(level)).toThrow(/split/);
  });
  it('permits a reviewed note editorial revision without adding runtime schema fields',()=>{
    const input=fixture();input.bundle.editorial[0].revision=2;resign(input,input.bundle.notes[0].id);
    expect(validateStudyBatch(input)[0].revision).toBe(2);
    expect(input.bundle.notes[0]).not.toHaveProperty('revision');
  });
  it('preserves pilot objects and canonical ownership while adding only reviewed study material',()=>{
    const batches=authorizedManifest.batches.map((_:unknown,index:number)=>fixture(index)).map((input:ReturnType<typeof fixture>)=>({id:input.spec.id,bundle:input.bundle,approvals:validateStudyBatch(input)}));
    const result=combineReviewedContent({baseline,pilotCurations,pilotApprovals,batches,manifest:structuredClone(authorizedManifest)});
    expect(result.pack.id).toBe('contact-center-core');expect(result.pack.version).toBe('0.4.0');
    expect(result.pack.cards).toHaveLength(235);expect(result.pack.notes).toHaveLength(78);expect(result.approved).toHaveLength(337);
    expect(result.pack.cards.slice(0,36)).toEqual(baseline.cards);
    expect(result.pack.notes.slice(0,12)).toEqual(baseline.notes);
    expect(result.pack.sources.slice(0,baseline.sources.length)).toEqual(baseline.sources);
    expect(result.curations.map((curation:{cards:unknown[]})=>curation.cards.length)).toEqual([157,235,78]);
    expect(result.curations.map((curation:{id:string})=>curation.id)).toEqual(pilotCurations.map(curation=>curation.id));
    expect(result.curations.map((curation:{questionBankIds:string[]})=>curation.questionBankIds)).toEqual(pilotCurations.map(curation=>curation.questionBankIds));
    expect(Object.keys(result).sort()).toEqual(['approved','curations','pack']);
    expect(()=>validatePack(result.pack)).not.toThrow();
  });
  it('rejects cross-batch source collisions before output creation',()=>{
    const first=fixture(0), second=fixture(1);
    second.bundle.sources[0].id=first.bundle.sources[0].id;
    for(const item of [...second.bundle.notes,...second.bundle.cards]) item.sourceIds=[first.bundle.sources[0].id];
    for(const record of second.bundle.editorial) record.evidence[0].sourceId=first.bundle.sources[0].id;
    for(const review of second.reviews) {review.sourceChecks[0].sourceId=first.bundle.sources[0].id;resign(second,review.id);}
    const batches=[first,second,...authorizedManifest.batches.slice(2).map((_:unknown,index:number)=>fixture(index+2))].map((input:ReturnType<typeof fixture>)=>({id:input.spec.id,bundle:input.bundle,approvals:validateStudyBatch(input)}));
    expect(()=>combineReviewedContent({baseline,pilotCurations,pilotApprovals,batches,manifest:authorizedManifest})).toThrow(/duplicate/);
  });
});
