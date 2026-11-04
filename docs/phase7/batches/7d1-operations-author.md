# 7D1 operations author report

Author: `/root/d1_operations`. Source pages opened and claims reviewed on **2026-10-31**. Status: source-reviewed drafts, awaiting independent review; not publication approval.

## Scope and inventory

Three reference notes (`cc-d1-n03`–`cc-d1-n05`), six core recall cards and three advanced/application MCQs (`cc-d1-c07`–`cc-d1-c15`). No exam-bank questions. Six registered primary sources. Every card links to its supporting note; all 12 records have revision, concept, domain, objective, evidence and duplicate-disposition metadata.

- Agent hub: configuration versus rollout, enablement prerequisite, scheduled activation, agent-specific deactivation effects. Mapping D1.2.01.
- Agentic simulation: supported preview boundary, destination number, run versus conversation evidence, unsupported DTMF. Mapping D1.1.05.
- Service Operations Agent: conversational setup, connection/role prerequisites, human verification and unsupported condition editing. Mapping D1.1.07 (configuration portion only).

These explain selected claims, not complete objective coverage. The Service Operations material does not establish environment-migration or transformation-agent coverage.

## Current primary evidence

All listed body sections were opened, not inferred from search snippets. Microsoft Learn showed its generic authorization banner but provided these article bodies.

- [Overview of agent hub](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/overview-agent-hub).
- [Create rollout plans to manage AI agents](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/create-rollout-plans).
- [Use AI-generated conversations for agentic simulations (preview)](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-simulation-agent).
- [Use Service Operations Agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/use-service-operations-agent).
- [Overview of Service Operations Agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/overview-service-operations-agent).
- [Responsible AI FAQ for Service Operations Agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/service-operations-agent-rai-faq).

Exact evidence sections and claim/applicability statements are attached to each editorial record in the bundle. The official [AB-250 guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) was also opened; its D1 source-order locators remain D1.1.05 for simulation, D1.1.07 for configuration agents and D1.2.01 for Agent hub.

## Important source decisions

The simulation documentation remains explicitly prerelease. The note states preview, not for production use, inbound voice only, English only and no DTMF. Do not replace this with an archived release-plan claim of broad readiness. No fixed billing amount, concurrency quota or numeric availability promise is taught as a core fact. Its administrator, voice and configured-number prerequisites are included.

Rollout-plan deactivation must be scoped by agent: Intent/Knowledge agent settings remain intact, while Case Management rules follow plan deactivation/deletion. Do not imply that every agent setting behaves identically, or that deleting a Knowledge plan turns the agent off.

The Service Operations source differentiates Omnichannel administrator access from System Administrator connection management. Its tool table explicitly excludes rule-condition editing and custom assignment. The overview's broad description of routing support does not override those limits. Billing and Application Insights prerequisites are summarized without inventing licensing entitlements or numerical credit guarantees. The responsible-AI source requires human review and verification.

## Gap retained

The study guide still names Health Agent at D1.1.06. Searches found generic release-note references but no current configuration page sufficient to author reliable enablement behavior. This batch therefore leaves D1.1.06 uncovered. The lead agreed to substitute supported Service Operations Agent configuration under D1.1.07. No claim that Health Agent was renamed, removed, or replaced is made.

## Duplicate and answer checks

Read all 36 pilot card prompts and 12 note titles/bodies relevant to D1. Existing pilot D1 content covers workspace/embedded CRM, managed solution packaging, active layers, environment recovery and skill-resource migration. New operations concepts do not duplicate those tests. Existing D4 classification conditions explain routing behavior; new c15 instead tests the boundary of Service Operations tooling.

Recall cards separate prerequisite, scheduling action, destination identity, inspection location, connection and role responsibilities. MCQs apply agent-specific lifecycle, simulation limitations and manual condition editing. Their fixed correct option IDs are c, b and d. Options have stable a–d IDs. Review should particularly challenge c09/c12 distractor plausibility and whether each scenario's requirements make the answer unique.

## Checks performed

Parsed JSON; checked 3 notes / 9 cards / 12 unique editorial records, six recall / three MCQ, stable unique IDs, referenced note/source availability, correct option text matching its answer and all six sources used. No changes to catalog, generated output, runtime, learner data or previous pilot files. Full schema/build/browser tests belong to lead integration after independent review.
