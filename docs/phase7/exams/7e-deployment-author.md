# Phase 7E deployment author report

Author: `/root/exam_deployment`  
Authored and claim-reviewed: 2026-11-03 UTC  
Bundle: `src/content/exams/7e-deployment.json`

## Scope and disposition

47 original draft questions, `ab250-d1-q05` through `ab250-d1-q51`: 35 single-answer and 12 explicitly counted exact-set multiple-answer. All remain runtime `draft` and editorial `source-reviewed`; none is independently reviewed or approved by this author. The frozen pilot q01–q04 was read for distinctness and not edited. No generated publication, compiler, study content, learner data, or old project was changed.

The 235-card / 78-note published study collection supplied the canonical teaching map. Every new question links to an existing `contact-center-core` note; 16 self-contained registered HTTPS Microsoft Learn sources support the behavior. Product pages were opened and their relevant sections examined on the actual authoring date; the current official AB-250 guide was also reopened to confirm objective order. No community question or exam dump was used.

## Distinctness and coverage

Allocation: connector/embedding/retained-provider/workspace9; simulation/Service Operations/rollout11; ALM/migration/copy12; users/security/capacity15. All14 available D1 objective rows have authored application questions; Health Agent objective D1.1.06 remains excluded as source-blocked. Counts are evidence scope, not a claim of complete exam preparation.

Each editorial duplicateCheck records the unique operation, its nearest comparison and the strongest alternative. The following decision matrix is an author inventory for the independent reviewer.

| ID | Tested decision | Objective | Related note | Answer positions |
|---|---|---|---|---|
| ab250-d1-q05 | connector-initial-load-completeness | D1.1.02 | cc-d1-n09 | 3 |
| ab250-d1-q06 | connector-change-delivery | D1.1.02 | cc-d1-n09 | 1 |
| ab250-d1-q07 | connector-record-provenance | D1.1.02 | cc-d1-n09 | 2, 4 |
| ab250-d1-q08 | connector-environment-alignment | D1.1.02 | cc-d1-n09 | 4 |
| ab250-d1-q09 | salesforce-call-center-membership | D1.1.03 | cc-d1-n10 | 2 |
| ab250-d1-q10 | salesforce-console-utility | D1.1.03 | cc-d1-n10 | 1 |
| ab250-d1-q11 | retained-provider-operational-ownership | D1.1.04 | cc-d1-n10 | 3 |
| ab250-d1-q12 | embedded-salesforce-readiness | D1.1.03 | cc-d1-n10 | 2, 4 |
| ab250-d1-q13 | workspace-session-context-navigation | D1.1.01 | cc-d1-n01 | 4 |
| ab250-d1-q14 | simulation-keypad-acceptance-boundary | D1.1.05 | cc-d1-n04 | 2 |
| ab250-d1-q15 | simulation-evidence-location | D1.1.05 | cc-d1-n04 | 1, 3 |
| ab250-d1-q16 | simulation-destination-number | D1.1.05 | cc-d1-n04 | 3 |
| ab250-d1-q17 | simulation-supported-journey-selection | D1.1.05 | cc-d1-n04 | 4 |
| ab250-d1-q18 | service-operations-mcp-diagnosis | D1.1.07 | cc-d1-n05 | 1 |
| ab250-d1-q19 | service-operations-troubleshooting-observability | D1.1.07 | cc-d1-n05 | 3, 5 |
| ab250-d1-q20 | service-operations-condition-authoring-boundary | D1.1.07 | cc-d1-n05 | 2 |
| ab250-d1-q21 | rollout-enabled-agent-prerequisite | D1.2.01 | cc-d1-n03 | 3 |
| ab250-d1-q22 | rollout-scheduled-activation | D1.2.01 | cc-d1-n03 | 1 |
| ab250-d1-q23 | rollout-stop-effects-by-agent | D1.2.01 | cc-d1-n03 | 2, 4 |
| ab250-d1-q24 | rollout-combined-scope | D1.2.01 | cc-d1-n03 | 4 |
| ab250-d1-q25 | alm-development-release-artifact | D1.2.02 | cc-d1-n02 | 2 |
| ab250-d1-q26 | alm-release-preflight | D1.2.03 | cc-d1-n02 | 3, 5 |
| ab250-d1-q27 | alm-active-layer-precedence | D1.2.03 | cc-d1-n02 | 4 |
| ab250-d1-q28 | alm-managed-configuration-removal | D1.2.03 | cc-d1-n11 | 1 |
| ab250-d1-q29 | channel-migration-excluded-dependencies | D1.2.02 | cc-d1-n11 | 1, 4 |
| ab250-d1-q30 | channel-migration-dependency-order | D1.2.02 | cc-d1-n11 | 3 |
| ab250-d1-q31 | channel-migration-user-associations | D1.2.02 | cc-d1-n11 | 2 |
| ab250-d1-q32 | environment-minimal-copy-scope | D1.2.04 | cc-d1-n12 | 4 |
| ab250-d1-q33 | copy-chat-and-record-routing | D1.2.04 | cc-d1-n12 | 2, 5 |
| ab250-d1-q34 | copy-acs-resource-isolation | D1.2.04 | cc-d1-n12 | 1 |
| ab250-d1-q35 | copy-teams-channel-cross-environment-link | D1.2.04 | cc-d1-n12 | 3 |
| ab250-d1-q36 | copy-agent-validation-and-publication | D1.2.04 | cc-d1-n12 | 3, 5 |
| ab250-d1-q37 | environment-security-group-onboarding | D1.3.02 | cc-d1-n06 | 3 |
| ab250-d1-q38 | nested-group-team-provisioning | D1.3.02 | cc-d1-n06 | 1 |
| ab250-d1-q39 | representative-case-role-set | D1.3.03 | cc-d1-n06 | 2, 3, 5 |
| ab250-d1-q40 | representative-bookable-resource-readiness | D1.3.01 | cc-d1-n06 | 2 |
| ab250-d1-q41 | representative-sign-in-presence | D1.3.01 | cc-d1-n06 | 4 |
| ab250-d1-q42 | representative-deactivated-skill-eligibility | D1.3.01 | cc-d1-n06 | 1 |
| ab250-d1-q43 | security-cumulative-role-audit | D1.3.03 | cc-d1-n07 | 3 |
| ab250-d1-q44 | custom-role-surface-access | D1.3.03 | cc-d1-n07 | 1, 4 |
| ab250-d1-q45 | custom-role-appropriate-baseline | D1.3.03 | cc-d1-n07 | 2 |
| ab250-d1-q46 | capacity-default-change-preserves-overrides | D1.3.04 | cc-d1-n08 | 4 |
| ab250-d1-q47 | capacity-lower-limit-existing-work | D1.3.04 | cc-d1-n08 | 3 |
| ab250-d1-q48 | capacity-reset-frequency-recreation | D1.3.04 | cc-d1-n08 | 1 |
| ab250-d1-q49 | capacity-end-of-day-open-work | D1.3.04 | cc-d1-n08 | 2 |
| ab250-d1-q50 | capacity-override-return-to-default | D1.3.04 | cc-d1-n08 | 2, 3 |
| ab250-d1-q51 | capacity-negative-manual-assignment-diagnosis | D1.3.04 | cc-d1-n08 | 4 |

## Source scope and cautions

- Health Agent enablement remains excluded; the blueprint is not a configuration procedure.
- Third-party CCaaS coverage is one retained-provider architecture responsibility decision. No modern provisioning sequence is invented.
- Service Operations questions cover supported configuration, MCP access and monitoring prerequisites. No autonomous environment migration or transformation capability is inferred.
- Simulation questions explicitly name preview and stay within the documented channel/direction/language and DTMF limits. No production suitability or undocumented availability claim is made.
- ACS material concerns an existing copied configuration and resource isolation, not permission to provision new standalone ACS services or a generalized telephony retirement claim.
- Environment copy and channel configuration migration remain distinct operations; target acceptance is scoped to each procedure.
- Capacity questions distinguish defaults, overrides, existing assignments, reset lifecycle and manual/forced assignment. The frozen D4 pilot question about selecting custom limits plus cross-profile blocking is not reused.

## Source review ledger

All following primary pages were opened and relevant claims examined on 2026-11-03. The per-question editorial evidence gives the precise section and applicability.

| Source | Page |
|---|---|
| exam-d1-s01 | [Configure the connector for any CRM solution](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-custom-connector) |
| exam-d1-s02 | [Set up the embedded experience in Salesforce](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience) |
| exam-d1-s03 | [Contact center with existing CRM and CCaaS](https://learn.microsoft.com/en-us/dynamics365/guidance/reference-architectures/contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio) |
| exam-d1-s04 | [Use Copilot Service workspace](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/ccw-overview) |
| exam-d1-s05 | [Agentic simulations (preview)](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-simulation-agent) |
| exam-d1-s06 | [Use Service Operations Agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/use-service-operations-agent) |
| exam-d1-s07 | [Create rollout plans to manage AI agents](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/create-rollout-plans) |
| exam-d1-s08 | [Best practices for application lifecycle management](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/alm-best-practices) |
| exam-d1-s09 | [Migrate configurations for channels using solutions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions) |
| exam-d1-s10 | [Copy an environment with omnichannel capabilities](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/copy-environment-with-omnichannel) |
| exam-d1-s11 | [Use enhanced user management](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles) |
| exam-d1-s12 | [Manage personas and custom security roles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/role-persona-mapping) |
| exam-d1-s13 | [Create and manage capacity profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles) |
| exam-d1-s14 | [Control user access with security groups and licenses](https://learn.microsoft.com/en-us/power-platform/admin/control-user-access) |
| exam-d1-s15 | [Assign security roles](https://learn.microsoft.com/en-us/power-platform/admin/assign-security-roles) |
| exam-d1-s16 | [Assign roles and enable users](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/add-users-assign-roles) |

## Author checks

Passed locally:47 `examQuestionSchema` parses;16 `sourceSchema` parses; current published pack `validatePack()`; all question-source registrations and all canonical related-note references; exact consecutive IDs;47 distinct concept IDs; editorial/item revision and mapping alignment; explicit TWO/THREE selection counts;35single/12multiple. No pilot concept IDs were reused.

Single-answer correct displayed positions: A9/B8/C9/D9, without a cyclic sequence. Correct-option length ranks among four choices: shortest9, second9, third9, longest8. Distractors were revised toward adjacent configurations and the explanation for every option was checked after edits. These distribution checks are pattern diagnostics, not factual approval.

No app runtime change was made. Full lint/unit/build/browser checks are reserved for lead integration, not claimed here. Independent source and ambiguity review remains required; no approval ledger or fingerprint was fabricated.

## Representative applications

- q07 distinguishes source-system provenance from name-based identity across two CRMs.
- q20 separates supported Service Operations rule creation from manually authored conditions.
- q23 applies different deactivation effects to two autonomous agents.
- q33 addresses two explicitly scoped target-copy gaps without treating a full copy as a functional test.
- q50 restores future default inheritance rather than merely copying the current limit.

## Independent-review author corrections

On2026-11-03, reviewer /root/exam_ai_routing requested adjacent-alternative and stem-quality refinements. Updated question and editorial revision2 for q05, q06, q07, q10, q12, q18, q19, q21, q22, q27, q28, q31, q32, q35, q36, q38, q40, q44, q48. Source claims and correct sets remain supported; q06 now explicitly requires event-driven changes. Generic Service Operations/rollout evidence applicability was replaced with actual scoped descriptions. No approval was authored.

q21 revision3 removes the stated activation defect and asks the supported agent-setup/plan order directly, per independent reviewer.
