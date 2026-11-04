import { validatePack } from '../src/validation.ts';
import { contentFingerprint } from './pilot-review-utils.mjs';

export const topicTitles = Object.freeze({
  'architecture-deployment':'Architecture and deployment','users-security':'Users and security',
  'lifecycle-management':'Lifecycle management','chat-digital':'Chat and digital channels',
  'voice-telephony':'Voice and telephony','copilot-ai':'Copilot and AI','routing-capacity':'Routing and capacity',
  'representative-workspace':'Representative workspace','knowledge-management':'Knowledge management',
  'supervision-analytics':'Supervision and analytics','workforce-management':'Workforce management','proactive-engagement':'Proactive engagement',
});
// Changing this allowlist is an explicit stage-scope change, not an authoring-file switch.
export const authorizedManifest = Object.freeze({
  "version": 1,
  "canonicalPackId": "contact-center-core",
  "releaseVersion": "0.4.0",
  "approvedStage": "7D-final",
  "authorizedOn": "2026-11-02",
  "batches": [
    {
      "id": "7d1-operations",
      "bundle": "src/content/batches/7d1-operations.json",
      "review": "docs/phase7/batches/7d1-operations-review.json",
      "domainId": "deployment",
      "notes": 3,
      "cards": 9,
      "coreCards": 6,
      "advancedCards": 3,
      "noteIds": [
        "cc-d1-n03",
        "cc-d1-n04",
        "cc-d1-n05"
      ],
      "cardIds": [
        "cc-d1-c07",
        "cc-d1-c08",
        "cc-d1-c09",
        "cc-d1-c10",
        "cc-d1-c11",
        "cc-d1-c12",
        "cc-d1-c13",
        "cc-d1-c14",
        "cc-d1-c15"
      ]
    },
    {
      "id": "7d1-users",
      "bundle": "src/content/batches/7d1-users.json",
      "review": "docs/phase7/batches/7d1-users-review.json",
      "domainId": "deployment",
      "notes": 3,
      "cards": 9,
      "coreCards": 6,
      "advancedCards": 3,
      "noteIds": [
        "cc-d1-n06",
        "cc-d1-n07",
        "cc-d1-n08"
      ],
      "cardIds": [
        "cc-d1-c16",
        "cc-d1-c17",
        "cc-d1-c18",
        "cc-d1-c19",
        "cc-d1-c20",
        "cc-d1-c21",
        "cc-d1-c22",
        "cc-d1-c23",
        "cc-d1-c24"
      ]
    },
    {
      "id": "7d2-chat",
      "bundle": "src/content/batches/7d2-chat.json",
      "review": "docs/phase7/batches/7d2-chat-review.json",
      "domainId": "channels",
      "notes": 3,
      "cards": 9,
      "coreCards": 6,
      "advancedCards": 3,
      "noteIds": [
        "cc-d2-n03",
        "cc-d2-n04",
        "cc-d2-n05"
      ],
      "cardIds": [
        "cc-d2-c07",
        "cc-d2-c08",
        "cc-d2-c09",
        "cc-d2-c10",
        "cc-d2-c11",
        "cc-d2-c12",
        "cc-d2-c13",
        "cc-d2-c14",
        "cc-d2-c15"
      ]
    },
    {
      "id": "7d2-digital",
      "bundle": "src/content/batches/7d2-digital.json",
      "review": "docs/phase7/batches/7d2-digital-review.json",
      "domainId": "channels",
      "notes": 3,
      "cards": 9,
      "coreCards": 6,
      "advancedCards": 3,
      "noteIds": [
        "cc-d2-n06",
        "cc-d2-n07",
        "cc-d2-n08"
      ],
      "cardIds": [
        "cc-d2-c16",
        "cc-d2-c17",
        "cc-d2-c18",
        "cc-d2-c19",
        "cc-d2-c20",
        "cc-d2-c21",
        "cc-d2-c22",
        "cc-d2-c23",
        "cc-d2-c24"
      ]
    },
    {
      "id": "7d-final-deployment",
      "bundle": "src/content/batches/7d-final-deployment.json",
      "review": "docs/phase7/batches/7d-final-deployment-review.json",
      "domainId": "deployment",
      "notes": 4,
      "cards": 12,
      "coreCards": 8,
      "advancedCards": 4,
      "noteIds": [
        "cc-d1-n09",
        "cc-d1-n10",
        "cc-d1-n11",
        "cc-d1-n12"
      ],
      "cardIds": [
        "cc-d1-c25",
        "cc-d1-c26",
        "cc-d1-c27",
        "cc-d1-c28",
        "cc-d1-c29",
        "cc-d1-c30",
        "cc-d1-c31",
        "cc-d1-c32",
        "cc-d1-c33",
        "cc-d1-c34",
        "cc-d1-c35",
        "cc-d1-c36"
      ]
    },
    {
      "id": "7d-final-digital",
      "bundle": "src/content/batches/7d-final-digital.json",
      "review": "docs/phase7/batches/7d-final-digital-review.json",
      "domainId": "channels",
      "notes": 7,
      "cards": 22,
      "coreCards": 15,
      "advancedCards": 7,
      "noteIds": [
        "cc-d2-n09",
        "cc-d2-n10",
        "cc-d2-n11",
        "cc-d2-n12",
        "cc-d2-n13",
        "cc-d2-n14",
        "cc-d2-n15"
      ],
      "cardIds": [
        "cc-d2-c25",
        "cc-d2-c26",
        "cc-d2-c27",
        "cc-d2-c28",
        "cc-d2-c29",
        "cc-d2-c30",
        "cc-d2-c31",
        "cc-d2-c32",
        "cc-d2-c33",
        "cc-d2-c34",
        "cc-d2-c35",
        "cc-d2-c36",
        "cc-d2-c37",
        "cc-d2-c38",
        "cc-d2-c39",
        "cc-d2-c40",
        "cc-d2-c41",
        "cc-d2-c42",
        "cc-d2-c43",
        "cc-d2-c44",
        "cc-d2-c45",
        "cc-d2-c88"
      ]
    },
    {
      "id": "7d-final-voice",
      "bundle": "src/content/batches/7d-final-voice.json",
      "review": "docs/phase7/batches/7d-final-voice-review.json",
      "domainId": "channels",
      "notes": 7,
      "cards": 21,
      "coreCards": 14,
      "advancedCards": 7,
      "noteIds": [
        "cc-d2-n16",
        "cc-d2-n17",
        "cc-d2-n18",
        "cc-d2-n19",
        "cc-d2-n20",
        "cc-d2-n21",
        "cc-d2-n22"
      ],
      "cardIds": [
        "cc-d2-c46",
        "cc-d2-c47",
        "cc-d2-c48",
        "cc-d2-c49",
        "cc-d2-c50",
        "cc-d2-c51",
        "cc-d2-c52",
        "cc-d2-c53",
        "cc-d2-c54",
        "cc-d2-c55",
        "cc-d2-c56",
        "cc-d2-c57",
        "cc-d2-c58",
        "cc-d2-c59",
        "cc-d2-c60",
        "cc-d2-c61",
        "cc-d2-c62",
        "cc-d2-c63",
        "cc-d2-c64",
        "cc-d2-c65",
        "cc-d2-c66"
      ]
    },
    {
      "id": "7d-final-outbound",
      "bundle": "src/content/batches/7d-final-outbound.json",
      "review": "docs/phase7/batches/7d-final-outbound-review.json",
      "domainId": "channels",
      "notes": 7,
      "cards": 21,
      "coreCards": 14,
      "advancedCards": 7,
      "noteIds": [
        "cc-d2-n23",
        "cc-d2-n24",
        "cc-d2-n25",
        "cc-d2-n26",
        "cc-d2-n27",
        "cc-d2-n28",
        "cc-d2-n29"
      ],
      "cardIds": [
        "cc-d2-c67",
        "cc-d2-c68",
        "cc-d2-c69",
        "cc-d2-c70",
        "cc-d2-c71",
        "cc-d2-c72",
        "cc-d2-c73",
        "cc-d2-c74",
        "cc-d2-c75",
        "cc-d2-c76",
        "cc-d2-c77",
        "cc-d2-c78",
        "cc-d2-c79",
        "cc-d2-c80",
        "cc-d2-c81",
        "cc-d2-c82",
        "cc-d2-c83",
        "cc-d2-c84",
        "cc-d2-c85",
        "cc-d2-c86",
        "cc-d2-c87"
      ]
    },
    {
      "id": "7d-final-ai",
      "bundle": "src/content/batches/7d-final-ai.json",
      "review": "docs/phase7/batches/7d-final-ai-review.json",
      "domainId": "agents-ai",
      "notes": 8,
      "cards": 24,
      "coreCards": 16,
      "advancedCards": 8,
      "noteIds": [
        "cc-d3-n03",
        "cc-d3-n04",
        "cc-d3-n05",
        "cc-d3-n06",
        "cc-d3-n07",
        "cc-d3-n08",
        "cc-d3-n09",
        "cc-d3-n10"
      ],
      "cardIds": [
        "cc-d3-c07",
        "cc-d3-c08",
        "cc-d3-c09",
        "cc-d3-c10",
        "cc-d3-c11",
        "cc-d3-c12",
        "cc-d3-c13",
        "cc-d3-c14",
        "cc-d3-c15",
        "cc-d3-c16",
        "cc-d3-c17",
        "cc-d3-c18",
        "cc-d3-c19",
        "cc-d3-c20",
        "cc-d3-c21",
        "cc-d3-c22",
        "cc-d3-c23",
        "cc-d3-c24",
        "cc-d3-c25",
        "cc-d3-c26",
        "cc-d3-c27",
        "cc-d3-c28",
        "cc-d3-c29",
        "cc-d3-c30"
      ]
    },
    {
      "id": "7d-final-routing",
      "bundle": "src/content/batches/7d-final-routing.json",
      "review": "docs/phase7/batches/7d-final-routing-review.json",
      "domainId": "work-distribution",
      "notes": 7,
      "cards": 21,
      "coreCards": 14,
      "advancedCards": 7,
      "noteIds": [
        "cc-d4-n03",
        "cc-d4-n04",
        "cc-d4-n05",
        "cc-d4-n06",
        "cc-d4-n07",
        "cc-d4-n08",
        "cc-d4-n09"
      ],
      "cardIds": [
        "cc-d4-c07",
        "cc-d4-c08",
        "cc-d4-c09",
        "cc-d4-c10",
        "cc-d4-c11",
        "cc-d4-c12",
        "cc-d4-c13",
        "cc-d4-c14",
        "cc-d4-c15",
        "cc-d4-c16",
        "cc-d4-c17",
        "cc-d4-c18",
        "cc-d4-c19",
        "cc-d4-c20",
        "cc-d4-c21",
        "cc-d4-c22",
        "cc-d4-c23",
        "cc-d4-c24",
        "cc-d4-c25",
        "cc-d4-c26",
        "cc-d4-c27"
      ]
    },
    {
      "id": "7d-final-experience",
      "bundle": "src/content/batches/7d-final-experience.json",
      "review": "docs/phase7/batches/7d-final-experience-review.json",
      "domainId": "representative-experience",
      "notes": 8,
      "cards": 24,
      "coreCards": 16,
      "advancedCards": 8,
      "noteIds": [
        "cc-d5-n03",
        "cc-d5-n04",
        "cc-d5-n05",
        "cc-d5-n06",
        "cc-d5-n07",
        "cc-d5-n08",
        "cc-d5-n09",
        "cc-d5-n10"
      ],
      "cardIds": [
        "cc-d5-c07",
        "cc-d5-c08",
        "cc-d5-c09",
        "cc-d5-c10",
        "cc-d5-c11",
        "cc-d5-c12",
        "cc-d5-c13",
        "cc-d5-c14",
        "cc-d5-c15",
        "cc-d5-c16",
        "cc-d5-c17",
        "cc-d5-c18",
        "cc-d5-c19",
        "cc-d5-c20",
        "cc-d5-c21",
        "cc-d5-c22",
        "cc-d5-c23",
        "cc-d5-c24",
        "cc-d5-c25",
        "cc-d5-c26",
        "cc-d5-c27",
        "cc-d5-c28",
        "cc-d5-c29",
        "cc-d5-c30"
      ]
    },
    {
      "id": "7d-final-analytics",
      "bundle": "src/content/batches/7d-final-analytics.json",
      "review": "docs/phase7/batches/7d-final-analytics-review.json",
      "domainId": "analytics",
      "notes": 6,
      "cards": 18,
      "coreCards": 12,
      "advancedCards": 6,
      "noteIds": [
        "cc-d6-n03",
        "cc-d6-n04",
        "cc-d6-n05",
        "cc-d6-n06",
        "cc-d6-n07",
        "cc-d6-n08"
      ],
      "cardIds": [
        "cc-d6-c07",
        "cc-d6-c08",
        "cc-d6-c09",
        "cc-d6-c10",
        "cc-d6-c11",
        "cc-d6-c12",
        "cc-d6-c13",
        "cc-d6-c14",
        "cc-d6-c15",
        "cc-d6-c16",
        "cc-d6-c17",
        "cc-d6-c18",
        "cc-d6-c19",
        "cc-d6-c20",
        "cc-d6-c21",
        "cc-d6-c22",
        "cc-d6-c23",
        "cc-d6-c24"
      ]
    }
  ]
});
// Stable domain identities follow the frozen AB-250 taxonomy; objective IDs are editorial locators.
const objectivePrefixes = new Map([
  ['deployment','D1.'],['channels','D2.'],['agents-ai','D3.'],
  ['work-distribution','D4.'],['representative-experience','D5.'],['analytics','D6.'],
]);
const canonical = value => JSON.stringify(value,(_,item)=>item && !Array.isArray(item) && typeof item==='object' ? Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))) : item);
const fail = message => { throw new Error(message); };
const nonempty = value => typeof value==='string' && value.trim().length>0;
const date = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
function unique(items,label) {
  if(!Array.isArray(items) || items.some(item=>!nonempty(item?.id)) || new Set(items.map(item=>item.id)).size!==items.length) fail('Missing or duplicate '+label+' identities.');
}
function sameIds(items,expected,label) {
  if(canonical(items.map(item=>item.id).sort())!==canonical([...expected].sort())) fail('Unauthorized '+label+' identities or count.');
}
export function validateBatchManifest(input) {
  if(canonical(input)!==canonical(authorizedManifest)) fail('Manifest is outside the authorized final 7D scope.');
  return input;
}

/** No I/O. Approval applies to this exact item, editorial evidence and cited source objects. */
export function validateStudyBatch({bundle,reviews,spec,baseline,objectiveIds}) {
  if(!authorizedManifest.batches.some(allowed=>canonical(allowed)===canonical(spec))) fail('Unauthorized batch specification.');
  if(baseline.id!==authorizedManifest.canonicalPackId) fail('Canonical owner cannot change.');
  if(!bundle || canonical(Object.keys(bundle).sort())!==canonical(['sources','notes','cards','questions','editorial'].sort())) fail('Unexpected batch structure.');
  for(const key of ['sources','notes','cards','questions','editorial']) unique(bundle[key],key);
  if(bundle.questions.length) fail('Phase 7D batches cannot publish exam questions.');
  if(bundle.notes.length!==spec.notes || bundle.cards.length!==spec.cards) fail('Unauthorized batch size.');
  sameIds(bundle.notes,spec.noteIds,'note'); sameIds(bundle.cards,spec.cardIds,'card');
  const items=[...bundle.notes,...bundle.cards];
  unique([...bundle.sources,...items],'cross-type batch');
  const existing=new Set([...baseline.sources,...baseline.notes,...baseline.cards].map(item=>item.id));
  if([...bundle.sources,...items].some(item=>existing.has(item.id))) fail('Batch identity collides with published content.');
  const sourceIds=new Set(bundle.sources.map(source=>source.id));
  for(const source of bundle.sources) {
    let url;try {url=new URL(source.url);}catch {fail('Invalid source URL: '+source.id);}
    if(url.protocol!=='https:' || url.hostname!=='learn.microsoft.com') fail('Batch sources must be Microsoft Learn HTTPS pages: '+source.id);
  }
  for(const item of items) {
    if(!Array.isArray(item.sourceIds) || !item.sourceIds.length || item.sourceIds.some(id=>!sourceIds.has(id))) fail('Item needs registered batch sources: '+item.id);
  }
  const combinedCards=[...baseline.cards,...bundle.cards];
  const usedTopics=[...new Set(combinedCards.map(card=>card.topicId))];
  if(usedTopics.some(id=>!topicTitles[id])) fail('Unknown topic in study batch.');
  // The app's strict schema also verifies option keys, source/note references and forbidden fields.
  validatePack({...baseline,topics:usedTopics.map(id=>({id,title:topicTitles[id]})),sources:[...baseline.sources,...bundle.sources],notes:[...baseline.notes,...bundle.notes],cards:combinedCards});
  if(bundle.notes.some(note=>!bundle.cards.some(card=>card.noteIds.includes(note.id)))) fail('Each new note must support a batch card.');
  unique(reviews,'review');
  sameIds(bundle.editorial,items.map(item=>item.id),'editorial');
  sameIds(reviews,items.map(item=>item.id),'review');
  const objectivePrefix=objectivePrefixes.get(spec.domainId);
  if(!objectivePrefix) fail('Unknown batch domain.');
  const approved=[];
  for(const item of items) {
    const record=bundle.editorial.find(entry=>entry.id===item.id);
    const review=reviews.find(entry=>entry.id===item.id);
    if(record.status!=='source-reviewed' || !nonempty(record.author) || !date(record.authoredAt) ||
       !Number.isInteger(record.revision) || record.revision<1 || (item.revision!==undefined && record.revision!==item.revision) ||
       record.domainId!==spec.domainId || !['core','advanced'].includes(record.level) ||
       !nonempty(record.conceptId) || !nonempty(record.duplicateCheck) ||
       !Array.isArray(record.objectiveIds) || !record.objectiveIds.length ||
       new Set(record.objectiveIds).size!==record.objectiveIds.length ||
       record.objectiveIds.some(id=>!objectiveIds.has(id) || !id.startsWith(objectivePrefix))) fail('Invalid editorial scope or objective: '+item.id);
    if(!Array.isArray(record.evidence) || item.sourceIds.some(id=>!record.evidence.some(evidence=>evidence.sourceId===id && nonempty(evidence.section) && nonempty(evidence.claim) && nonempty(evidence.applicability)))) fail('Incomplete claim evidence: '+item.id);
    const fingerprint=contentFingerprint(item,record,bundle.sources);
    if(review.decision!=='approved' || !nonempty(review.reviewer) || review.reviewer===record.author ||
       review.revision!==record.revision || review.fingerprint!==fingerprint || !date(review.reviewedAt) ||
       review.reviewedAt<record.authoredAt || !nonempty(review.rationale) || !Array.isArray(review.findings)) fail('Missing, stale or non-independent approval: '+item.id);
    if(!Array.isArray(review.sourceChecks) || item.sourceIds.some(id=>!review.sourceChecks.some(check=>check.sourceId===id && check.supported===true && nonempty(check.section) && nonempty(check.notes)))) fail('Unreviewed item source: '+item.id);
    approved.push({id:item.id,revision:record.revision,domainId:record.domainId,conceptId:record.conceptId,objectiveIds:record.objectiveIds,level:record.level,author:record.author,reviewer:review.reviewer,reviewedAt:review.reviewedAt,fingerprint});
  }
  const cardRecords=approved.filter(record=>bundle.cards.some(card=>card.id===record.id));
  if(cardRecords.filter(record=>record.level==='core').length!==spec.coreCards || cardRecords.filter(record=>record.level==='advanced').length!==spec.advancedCards ||
     bundle.cards.some(card=>(card.kind==='recall')!==(cardRecords.find(record=>record.id===card.id).level==='core'))) fail('Unauthorized core/advanced card split.');
  return approved;
}

export function combineReviewedContent({baseline,pilotCurations,pilotApprovals,batches,manifest}) {
  validateBatchManifest(manifest);
  if(baseline.id!==manifest.canonicalPackId) fail('Canonical owner cannot change.');
  if(batches.length!==manifest.batches.length || batches.some((batch,index)=>batch.id!==manifest.batches[index].id)) fail('Missing authorized content batch.');
  const sources=[...baseline.sources,...batches.flatMap(batch=>batch.bundle.sources)];
  const notes=[...baseline.notes,...batches.flatMap(batch=>batch.bundle.notes)];
  const cards=[...baseline.cards,...batches.flatMap(batch=>batch.bundle.cards)];
  const approved=[...pilotApprovals,...batches.flatMap(batch=>batch.approvals)];
  unique([...sources,...notes,...cards],'combined content'); unique(approved,'combined approval');
  if([...notes,...cards].some(item=>!approved.some(record=>record.id===item.id))) fail('Published study item lacks approval.');
  const topics=[...new Set(cards.map(card=>card.topicId))].map(id=>({id,title:topicTitles[id]}));
  const pack=validatePack({...baseline,version:manifest.releaseVersion,title:'Dynamics 365 Contact Center',description:'Reviewed study material across deployment, channels, AI, routing, representative experience and analytics. Consult the cited guidance for feature prerequisites and availability; documented study gaps remain.',sources,notes,cards,topics});
  const core=cards.filter(card=>approved.find(record=>record.id===card.id).level==='core');
  const advanced=cards.filter(card=>approved.find(record=>record.id===card.id).level==='advanced');
  const choices=[core,cards,advanced];
  const expected=['d365-contact-center','ab250-preparation','ab250-advanced'];
  if(pilotCurations.length!==3 || pilotCurations.some((curation,index)=>curation.id!==expected[index])) fail('Unexpected pilot curation identities.');
  const descriptions=[`${core.length} foundational recall cards. Learn sourced configuration concepts and practical decisions; coverage remains partial.`,`${cards.length} cards across six domains, including foundations and applications. Reviewed study material; not complete exam preparation.`,`${advanced.length} application cards focused on scoped decisions and troubleshooting. Shared with Certification Preparation.`];
  const curations=pilotCurations.map((curation,index)=>({...curation,version:manifest.releaseVersion,description:descriptions[index],topics:index===0?topics:curation.topics,
    cards:choices[index].map(card=>({packId:pack.id,cardId:card.id,topicId:index===0?card.topicId:approved.find(record=>record.id===card.id).domainId})),
    notes:[...new Set(choices[index].flatMap(card=>card.noteIds))].map(noteId=>({packId:pack.id,noteId})),
  }));
  return {pack,curations,approved};
}
