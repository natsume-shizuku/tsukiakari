# Phase 7E channels: voice author report

Author: `/root/exam_channels`. Source claims examined on 2026-11-03 UTC. Bundle revision: 1.

31 original draft questions: `ab250-d2-q36` through `ab250-d2-q66`; 23 single-answer and 8 explicitly counted TWO-answer items. Each has four or five options, explanations for every option, canonical related notes and a source-reviewed editorial record. **Independent review, approval and publication remain pending.**

## Scope and temporal conditions

The bundle addresses D2.2.01 through D2.2.07 and D2.3.23, D2.3.24 and D2.3.26. Existing pilot questions and digital q05–q35 were checked for identity/prompt/concept collisions and operational overlap. D1 owns general capacity overrides, lower-limit effects, profile recreation/reset changes and forced-assignment capacity. Voice q52 instead tests a new outbound profile concurrency limit and inbound assignment blocking; q53 tests the voice-specific monitoring recommendation for separate inbound/outbound queues.

The actual primary Learn pages below were opened and relevant body sections manually checked on 2026-11-03. Evidence is recorded per question as source + exact section + supported claim + applicability. This is an author pass, not independent review or expert certification. No community answer keys or real exam items were used.

- ACS temporal scope: q39 distinguishes specified affected standalone ACS configurations from unaffected Teams Phone extensibility. q40 explicitly uses 2026-11-03 and a customer without an existing ACS resource. Existing ACS-based examples q43, q45–q47 and q54 are scoped to supported existing deployments/transition, not recommendations that new customers can acquire standalone ACS numbers.
- Teams Direct Routing and legacy ACS Direct Routing are identified separately. q37 is a Teams resource-account routing policy; q45–q47 concern the documented ACS IVR/SBC path. q41 selects Operator Connect for a different carrier-management requirement from the study card retaining customer SBC investment. Number portability is expressly conditional.
- q45 tests inbound external-IVR UUI payload representation, not arbitrary X-header equivalence or outbound UUI egress. It does not duplicate D3 header/DTMF authoring decisions.
- q60–q62 explicitly identify the production-ready preview secure-contact feature and satisfied prerequisites. They test active secure hold, contact-specific no-capture scope, and exit restoration, respectively. They do not test different privacy choices between consult and bridged phases.
- D2.2.07 remains partial-depth. q63 and q64 use only the published Azure Teams Phone extensibility architecture: Microsoft 365 agent identity and the multipersona ringing policy/API limitation. No exact Dynamics-specific CCaaS SDK operation is invented. The existing source gap remains open.
- Cost items use documented demand-model concepts without price quotes, numeric consumption rates, guaranteed savings or claims that one purchasing model is always cheapest. No personal Teams-license universal was authored because the generalized SDK and Dynamics training scopes differ.

## Concept allocation

| Question | Kind | Objectives | Tested concept |
|---|---|---|---|
| ab250-d2-q36 | multiple | D2.2.01 | teams-sync-delegated-permission |
| ab250-d2-q37 | single | D2.2.01 | teams-dr-external-call-policy |
| ab250-d2-q38 | single | D2.2.01 | teams-calling-plan-service-number |
| ab250-d2-q39 | multiple | D2.3.23 | acs-retirement-impact-discrimination |
| ab250-d2-q40 | single | D2.2.03, D2.3.23 | new-acs-number-acquisition-date |
| ab250-d2-q41 | single | D2.3.23 | operator-connect-portability-review |
| ab250-d2-q42 | single | D2.2.01, D2.2.03 | single-number-multilanguage-design |
| ab250-d2-q43 | single | D2.2.03 | direct-routing-csv-number-preservation |
| ab250-d2-q44 | single | D2.2.03 | inactive-direct-routing-number-repair |
| ab250-d2-q45 | multiple | D2.2.02 | external-ivr-uui-supported-formats |
| ab250-d2-q46 | multiple | D2.2.02 | external-ivr-sbc-number-topology |
| ab250-d2-q47 | single | D2.3.24 | sbc-dns-region-latency |
| ab250-d2-q48 | multiple | D2.2.04 | inbound-profile-personal-number-prerequisites |
| ab250-d2-q49 | single | D2.2.04 | inbound-forwarding-external-transfer-toggle |
| ab250-d2-q50 | single | D2.2.04 | alternative-caller-id-provisioning |
| ab250-d2-q51 | single | D2.2.04 | outbound-number-label-not-cnam |
| ab250-d2-q52 | multiple | D2.2.04 | outbound-concurrency-and-incoming-block |
| ab250-d2-q53 | single | D2.2.04, D2.3.24 | outbound-queue-monitoring-separation |
| ab250-d2-q54 | multiple | D2.2.05 | voice-capture-mime-event-prerequisites |
| ab250-d2-q55 | single | D2.2.05 | manual-capture-resume-label |
| ab250-d2-q56 | single | D2.2.05 | recording-hold-auto-pause |
| ab250-d2-q57 | single | D2.2.05 | dtmf-only-ai-transcript-boundary |
| ab250-d2-q58 | single | D2.2.05 | voice-transcript-grouped-timestamps |
| ab250-d2-q59 | single | D2.2.06 | representative-quality-survey-sampling |
| ab250-d2-q60 | multiple | D2.3.24 | secure-consult-agent-hold-constraints |
| ab250-d2-q61 | single | D2.3.24 | secure-contact-no-capture-scope |
| ab250-d2-q62 | single | D2.3.24 | secure-consult-exit-restoration |
| ab250-d2-q63 | single | D2.2.07 | tpe-agent-client-m365-identity |
| ab250-d2-q64 | single | D2.2.07 | tpe-multipersona-ringing-policy |
| ab250-d2-q65 | single | D2.3.26 | credit-purchase-model-demand |
| ab250-d2-q66 | single | D2.3.26 | credit-forecast-generative-share |

## Source map

Accessed and claim-reviewed by the author on 2026-11-03 UTC. The independent reviewer must reopen the relevant body sections and challenge every answer/distractor.

| Source | Primary page | Used by |
|---|---|---|
| exam-d2-voice-s01 | [Configure Teams Phone in voice channel](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-teams-phone-in-voice-channel) | q36, q37, q38 |
| exam-d2-voice-s02 | [Plan migration from Azure Communication Services](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/migrate-from-azure-communication-services) | q39, q40, q41 |
| exam-d2-voice-s03 | [Manage phone numbers](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-manage-phone-numbers) | q42, q44 |
| exam-d2-voice-s04 | [Set up inbound calling](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-inbound-calling) | q42 |
| exam-d2-voice-s05 | [Integrate a non-Microsoft IVR system with voice channel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-contextual-transfer-external-ivr) | q45, q46 |
| exam-d2-voice-s06 | [Bring your own carrier](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-bring-your-own-number) | q43, q47 |
| exam-d2-voice-s07 | [Configure outbound and inbound profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-outbound-inbound-profiles) | q48, q49, q50, q51 |
| exam-d2-voice-s08 | [Set up outbound calling](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-outbound-calling) | q52, q53 |
| exam-d2-voice-s09 | [Configure call recording, transcription, and real-time translation](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-configure-transcripts) | q54, q55, q56, q57, q58 |
| exam-d2-voice-s10 | [Enable voice call experiences](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-voice-call-experiences) | q54, q59, q60, q61 |
| exam-d2-voice-s11 | [Transfer calls and consult with users in the voice channel](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/voice-channel-transfer-consult) | q62 |
| exam-d2-voice-s12 | [Teams Phone extensibility overview](https://learn.microsoft.com/en-us/azure/communication-services/concepts/interop/tpe/teams-phone-extensibility-overview) | q63, q64 |
| exam-d2-voice-s13 | [Cost and licensing](https://learn.microsoft.com/en-us/training/modules/intro-implement-dynamics-365-contact-center/6-cost-and-licensing) | q65, q66 |

## Representative decisions and strongest alternatives

- q36 separates number/resource preparation from the role and delegated permissions needed to synchronize. Resource account licensing does not replace operator authority or application consent.
- q40 distinguishes the 2026 new-acquisition restriction from the 2028 end-of-service milestone. It does not imply existing resources lost all transition support.
- q45 tests named UUI key/value representation after matching variables already exist. Hex encoding retains names rather than converting only anonymous values.
- q52 requires both the outbound concurrency limit and Assignment blocking. User-profile eligibility is already established, avoiding a replay of study c56/c57.
- q55 challenges the inference that the initial Manual-start Resume label proves previous audio capture. q57 separately distinguishes DTMF-only agent transcripts from voice-workstream capture.
- q60 applies Agent on hold to all representatives and prohibits user removal during the secure consultation. q61 requires both audio and text suppression for only one contact. q62 checks restoration when that contact leaves.
- q64 rejects an assumed per-call client-selector API using the overview explicit policy boundary. It does not fill the unresolved Dynamics-specific SDK contract gap.

## Duplicate and answer-quality checks

Editorial duplicateCheck fields record comparisons against the frozen pilot and nearby D2 study cards. Digital overlap was checked: no identity/prompt/concept collision, and no reuse of its deployment, text masking, chat consult, survey or timeline scenarios. Q60 hold participants differs from digital q21 chat consultee read-only/explicit join; q61 capture scope differs from D3 phase-specific capture policy selection. Q66 forecasts generative workload mix rather than repeating broad TCO cost categories.

Distractors use adjacent permissions, number roles, profile controls, capture behaviors, topology choices and plausible incorrect interpretations. Visible answer placement is irregular: single-answer positions A=6/B=6/C=5/D=6; multiple-answer sets vary. Internal option identities and keys remain attached to their text when order changes. The independent review should still challenge wording/length clues and source conditions.

## Validation and remaining work

Ran direct Node validation with `examQuestionSchema` for all 31 questions, canonical published-note reference checks, registered source checks, editorial/evidence matching, pilot/digital ID/prompt/concept collision checks, explicit multiple-answer selection counts and objective inventory. Result: 31 questions, 23 single, 8 multiple, 13 registered sources, 31 matching editorial records, 31 unique concepts, all 10 assigned objective rows represented. Single-answer position counts are 6/6/5/6.

The bounded author did not run full lint/unit/build/browser checks. The lead owns integrated checks and content gating. No generated output, runtime, compiler, study material, pilot, review approval or browser storage was changed. All items remain draft.

## Handoff

Voice authoring is ready for independent review. Operations q67–q96 remains the next bounded authoring part after lead assignment. No content in this report is approved or published.

## Independent-review author corrections

2026-11-03: q50 advanced to revision 2 to explicitly require the different caller-ID number outbound profile and resulting representative settings, while explaining the initial channel-or-profile provisioning stage. q44, q64 and q65 retain revision 1 with improved adjacent number-state, ringing-policy and purchasing-model alternatives. Independent reviewer must recheck current fingerprints.

2026-11-03 final reviewer checkpoint: q54 advanced to revision 2 for explicit ACS scope. q61 advanced to revision 2 and now tests secure settings across ALL bridged origins including AI/overflow, replacing the D3q21 subset. q44/q53/q64/q66 alternatives improved; explicit Choose TWO added without key changes.
