/** Coverage is reviewed teaching evidence, never an exam-readiness percentage. */
export function auditStudyCoverage({pack,approved,objectiveIds,gaps,reviewedAt}) {
  const known=new Set(objectiveIds),gapMap=new Map();
  for(const gap of gaps) {
    if(!known.has(gap.objectiveId)||gapMap.has(gap.objectiveId)||!['blocked-source','partial-depth'].includes(gap.status)||!gap.reason?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(gap.reviewedAt)||!gap.researchUrls?.length||gap.researchUrls.some(url=>!url.startsWith('https://learn.microsoft.com/')))throw Error('Invalid coverage research gap');
    gapMap.set(gap.objectiveId,gap);
  }
  const notes=new Set(pack.notes.map(item=>item.id)),cards=new Set(pack.cards.map(item=>item.id));
  const rows=objectiveIds.map(id=>{
    const evidence=approved.filter(item=>item.objectiveIds.includes(id));
    const noteIds=evidence.filter(item=>notes.has(item.id)).map(item=>item.id);
    const cardIds=evidence.filter(item=>cards.has(item.id)).map(item=>item.id);
    const gap=gapMap.get(id),hasMaterial=noteIds.length>0&&cardIds.length>0;
    if(!hasMaterial&&gap?.status!=='blocked-source')throw Error('Objective needs reviewed note and card or explicit source block: '+id);
    if(hasMaterial&&gap?.status==='blocked-source')throw Error('Blocked objective cannot imply supported setup: '+id);
    return {id,state:hasMaterial?'sourced-study':'blocked-source',noteIds,cardIds,questionIds:evidence.filter(item=>!notes.has(item.id)&&!cards.has(item.id)).map(item=>item.id),gap:gap??null};
  });
  return {version:1,collectionVersion:pack.version,reviewedAt,meaning:'Sourced notes and cards support the listed claims. This does not establish complete objective mastery or exam readiness.',objectives:rows};
}
