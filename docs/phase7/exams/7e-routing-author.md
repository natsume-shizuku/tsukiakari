# Phase 7E routing author record

Author: `/root/exam_ai_routing`  
Authored and primary-claim review: **2026-11-03 UTC**  
Status: **source-reviewed draft; independent review pending**  
Owned bundle: `src/content/exams/7e-routing.json`

## Inventory and concept allocation

Exactly 32 new items: ab250-d4-q05 through q36, 24 single and 8 explicitly counted exact-set multiple. All 15 D4 source-order official skills have authored mappings. The four pilot D4 questions remain untouched. This is scenario practice, not proof of complete certification coverage.

| Item | Format | Tested decision | Objectives | Canonical note |
|---|---|---|---|---|
| ab250-d4-q05 | single | queue-channel-eligibility-diagnosis | D4.1.01 | cc-d4-n03 |
| ab250-d4-q06 | single | cross-queue-business-priority | D4.1.02 | cc-d4-n03 |
| ab250-d4-q07 | single | equal-custom-queue-priority-tiebreak | D4.1.02 | cc-d4-n03 |
| ab250-d4-q08 | single | asynchronous-fifo-time-basis | D4.1.04 | cc-d4-n03 |
| ab250-d4-q09 | single | least-active-signin-misdiagnosis | D4.1.04 | cc-d4-n03 |
| ab250-d4-q10 | single | empty-queue-channel-outcome | D4.1.01 | cc-d4-n03 |
| ab250-d4-q11 | multiple | queued-overflow-versus-prequeue-average | D4.1.03 | cc-d4-n04 |
| ab250-d4-q12 | single | overflow-transfer-check-boundary | D4.1.03 | cc-d4-n04 |
| ab250-d4-q13 | single | fallback-path-overflow-expectation | D4.1.03 | cc-d4-n04 |
| ab250-d4-q14 | single | afterhours-default-action-diagnosis | D4.1.05, D4.1.03 | cc-d4-n04 |
| ab250-d4-q15 | multiple | holiday-timezone-calendar-test | D4.1.05 | cc-d4-n04 |
| ab250-d4-q16 | single | calendar-migration-verification | D4.1.05 | cc-d4-n04 |
| ab250-d4-q17 | single | shared-workstream-policy-boundary | D4.2.01 | cc-d4-n05 |
| ab250-d4-q18 | multiple | engagement-agent-runtime-wiring | D4.2.03, D4.2.01 | cc-d4-n05 |
| ab250-d4-q19 | single | classification-first-match-exception-order | D4.2.02 | cc-d4-n01 |
| ab250-d4-q20 | single | classification-template-local-maintenance | D4.2.02 | cc-d4-n05 |
| ab250-d4-q21 | single | rerouted-skill-accumulation | D4.2.04 | cc-d4-n06 |
| ab250-d4-q22 | multiple | skill-prediction-data-remediation | D4.2.05 | cc-d4-n06 |
| ab250-d4-q23 | single | skill-rating-model-consistency | D4.2.04 | cc-d4-n06 |
| ab250-d4-q24 | single | skill-model-environment-transfer-constraint | D4.2.05 | cc-d4-n06 |
| ab250-d4-q25 | multiple | intent-preview-runtime-prerequisites | D4.2.06 | cc-d4-n07 |
| ab250-d4-q26 | single | intent-skill-and-queue-composition | D4.2.06 | cc-d4-n07 |
| ab250-d4-q27 | single | unmapped-contact-preferred-fallback | D4.2.07 | cc-d4-n07 |
| ab250-d4-q28 | multiple | preferred-route-eligibility-boundaries | D4.2.07 | cc-d4-n07 |
| ab250-d4-q29 | single | unavailable-preferred-channel-policy | D4.2.07 | cc-d4-n07 |
| ab250-d4-q30 | single | record-access-after-routing | D4.2.08 | cc-d4-n08 |
| ab250-d4-q31 | single | basic-routing-related-criteria-limit | D4.2.09 | cc-d4-n08 |
| ab250-d4-q32 | multiple | record-intake-path-integration | D4.2.08, D4.2.09 | cc-d4-n08 |
| ab250-d4-q33 | single | basic-ruleset-update-lifecycle | D4.2.09 | cc-d4-n08 |
| ab250-d4-q34 | single | case-routing-attempt-correlation | D4.2.10 | cc-d4-n09 |
| ab250-d4-q35 | multiple | assignment-snapshot-rule-and-state-evidence | D4.2.10 | cc-d4-n09 |
| ab250-d4-q36 | single | assignment-attempt-versus-acceptance | D4.2.10 | cc-d4-n09 |

## Opened primary sources and precise scope

All listed pages were reopened on 2026-11-03. Each listed section was examined for the corresponding asserted claim and alternatives. Editorial evidence contains the exact claim/applicability map; this access date is not blanket verification of unrelated page content.

| ID | Primary source | Reviewed sections |
|---|---|---|
| exam-d4-s01 | [Create and manage queues for unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel) | How work items are routed to queues; Configure queue prioritization; Create a queue for unified routing; How fallback queues work |
| exam-d4-s02 | [Manage overflow of work items in queues](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow) | Handle overflow when a work item is queued; Overflow condition and actions when queued; Handle overflow before a work item is queued; How overflow works when work item is routed to a fallback queue |
| exam-d4-s03 | [Create and manage operating hours](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-operating-hours) | Create a record to define operating hours; Define a holiday on the calendar; Limitation; Add operating hours to a queue |
| exam-d4-s04 | [Create and manage workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams) | Create a workstream |
| exam-d4-s05 | [Configure work classification rulesets](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) | How classification rulesets work; Create work classification rulesets; Create logical skill classification rulesets: note |
| exam-d4-s06 | [Configure the engagement agent](https://learn.microsoft.com/en-us/training/modules/configure-routing-contact-center/3-configure-engagement-agent) | Connect a Copilot Studio agent to omnichannel; Add the engagement agent; Context variables and classification |
| exam-d4-s07 | [Understand how skill match algorithm works](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing) |  |
| exam-d4-s08 | [Set up intelligent skill finder model](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-isf-model) | Retrain the model iteratively; Important: import skill finder models between environments |
| exam-d4-s09 | [Configure intent-driven routing (preview)](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-intent-driven-routing) | Prerequisites; How intent-driven routing works; Configure classification rules using intent; Use skill-based routing with intent; Considerations |
| exam-d4-s10 | [Configure routing to preferred or previously engaged representatives](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-preferred-agent) | How routing to preferred representative works; Prerequisites; How routing to preferred representative works; Configure preferred representative for contacts; How routing works |
| exam-d4-s11 | [Set up unified routing for records](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-record-routing) | Configure work distribution and advanced settings: note; Configure unified routing for records; Create workstreams; Configure intake rules |
| exam-d4-s12 | [Route cases using basic routing rulesets](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-rules-automatically-route-cases) | Create routing rulesets to route cases; Create routing rulesets to route cases: note |
| exam-d4-s13 | [Configure conversation diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics) | View case diagnostics; Prerequisites; Set up a connection with Azure Application Insights |
| exam-d4-s14 | [Understand conversation diagnostics data](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/conversation-diagnostics-subscenarios) | Assignment and routing; Other non-channel specific events |
| exam-d4-s15 | [FAQ about unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-faqs) | Route to least-active representative; General: queue with no representatives; Intelligent skill finder: email activities; right skills |
| exam-d4-s16 | [Assignment methods in unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) | How unified routing prioritizes work items; Least active |

The [AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250), reopened 2026-11-03 during this domain-authoring run, governs D4.1.01–05/D4.2.01–10 locators. It does not establish runtime behavior. Published 78 notes/235 cards were used for source discovery, distinctness comparison and canonical learning links, not as substitute product evidence.

## Scope and caveat decisions

- No D1-reserved capacity-profile decisions were authored: default/custom override edits, lower limits not redistributing work, reset-frequency recreation, override removal, forced/manual negative capacity and end-of-day resets are excluded. Pilot D4 q04 custom limits plus blocking is also untouched.
- Queue priority, within-queue prioritization, channel-compatible destination types, representative ordering and record permissions are different layers. Equal-priority custom queues use the documented alphabetical tie policy; q07 scopes both queues to custom prioritization so it does not generalize to default FIFO queues.
- Default asynchronous FIFO is last-interaction based; record FIFO has its own routed-time basis and is not inferred from the messaging example. Least-active q09 controls for equal concurrent workload before using release timestamps. The source method examples also consider concurrent work, so no universal single-timestamp-only ranking is claimed.
- Empty queue outcomes differ for conversations and records. Membership is required; queue priority or skills cannot staff an empty pool.
- Prequeue overflow is evaluated once, separately from queued-wait handling. The queued-overflow page uses actual waiting in its explanation but says predicted in one setup sentence; q11 tests the explicit When queued / Waiting time in queue exceeds stage, not a numerical prediction formula. Supported actions vary by channel.
- A no-match/classification-error/route-error fallback ignores that queue's overflow settings. This exception is not generalized to ordinary routing directly matching the same queue. Queue hours, channel/widget hours and representative schedules are not interchangeable. Adding queue hours defaults to Assign to queue anyway until the action is changed.
- Calendar export/import limitations are scoped to the documented ordinary options; no assertion is made that custom tooling can never recreate schedules.
- The engagement agent is the workstream-associated Studio agent described in the current Learn unit, not a newly invented service. q18 tests omnichannel connection and workstream association; D3 explicit handoff execution is a separate tested concept.
- The skill finder page requires AI Builder regional availability and preview-model enablement. q22 assumes those prerequisites and tests text/label quality; q24 uses its explicit same-environment-type model-transfer restriction, not a general Power Platform solution-migration rule. Prediction attaches work requirements; it does not replace assignment.
- New skills are appended when rerouting. Rating-model identity must align; equal displayed numeric proficiency on different models is not proof of compatibility. No built-in timed Closest Match relaxation, fixed voice/chat unit costs or automatic skill replacement is asserted.
- Intent-driven routing is the current production-ready preview. Upstream agents determine live chat/voice intent and persist fields; routing consumes those fields. Case intent differs in timing and is not inferred from the live-chat scenario. Legacy intent-to-user-group mappings are not used for the current experience.
- Preferred representative scenarios use the standard Push feature, not preview orchestration playbooks. Presence and queue membership still matter, while capacity/skill/assignment-rule checks are skipped on that path. No-mapping and mapped-but-unavailable contacts have different fallback behavior. No immediate availability guarantee is implied.
- Basic routing is case-specific. q31 explicitly disables unified routing when explaining the single-active-basic-rule alternative. Unified records need intake wiring and record access; assignment does not grant Dataverse permission.
- Conversation lifecycle diagnostics requires its Application Insights connection, Managed environment and setup permissions. No event backfill, free telemetry, legacy-diagnostics guarantee or assignment-attempt-equals-acceptance claim is made. Multiple attempts must be correlated to their corresponding conversation.

## Originality and answer challenge

Compared against all four D4 pilot questions and published D4 notes/cards. New concepts avoid pilot static-attribute reuse, highest-capacity Exact Match selection, custom exact-skill conditions, and custom-capacity-plus-blocking. Each scenario asks for a concrete design correction, runtime interpretation or diagnostic boundary. Nearby study-card knowledge is the prerequisite learning link; no external exam item or community answer key was copied.

Key alternatives challenged: cross-queue versus within-queue priority (q06–07); creation versus last-interaction age (q08); prequeue versus queued overflow (q11–12); hours condition versus its action (q14); template ownership versus local copy (q20); metadata versus prediction quality/model transfer (q21–24); missing upstream intent versus consuming populated fields (q25–26); mapped versus unmapped preferred contact (q27–29); routing versus record permission (q30); and offered versus accepted work (q36).

Single-answer display positions are A=6/B=6/C=6/D=6; sequence CDDABDCDAAAADCDBCBBABCBC. Option identities remain attached to their original meanings when positions move. Multiple answers are exactly two per prompt, with five options and complete per-option explanations. Correct options are not uniformly longest.

## Author validation and remaining review

Direct application schema/bank/canonical-reference validation is recorded after the final save. Validated inventory: 32 questions, 24 single/8 multiple, 32 unique concepts/editorial records, all 15 objectives, valid contact-center-core note links. No runtime registration, compiler, pilot, study content, approvals or learner storage changed.

Full application lint/unit/build/browser checks remain for lead integration. Independent reviewer must reopen sources, challenge complete answer sets and adjacent alternatives, and return findings. The author has not self-approved or generated review fingerprints. Representative review examples: q07 equal-priority custom queues; q12 overflow transfer evaluation boundary; q22 email HTML and labels; q27 unmapped preferred contact; q36 assignment attempt versus acceptance.

## Cross-domain duplicate correction

During D6 preparation, compared D4 q35 with frozen D6 pilot q04. Replaced the overlapping Managed-environment/setup-permission candidate with revision 2 on custom assignment-rule snapshots plus historical representative state. Correct set remains A/D and existing identities remain stable. No approval is claimed.

## Independent source/quality revision pass (2026-11-03)

Revised q08–10, q12–13, q16–18, q22, q24–26, q29, q31–33 to revision 2. Stronger alternatives now compare relevant timestamps, channel FIFO bases, prequeue/queued boundaries, calendar deployment/association, raw text/label/model lifecycle, intent prerequisites and same-ID rule lifecycle. Removed supplied diagnoses from q10/q25/q32. Replaced q17 with shared-workstream policy inheritance after D2 duplicate review; replaced q31 with Unified Interface basic-rule related-criteria limits after q19 duplicate review. q35 had already advanced to revision 2 in the cross-domain audit. No review approvals were authored.
