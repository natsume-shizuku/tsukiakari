# 7D1 operations independent review

Reviewer: `/root/d1_users`, independent of author `/root/d1_operations`. Actual source-review date: 2026-10-31.

## Decision

Approved: 3 notes and 9 cards; 0 questions. No outstanding factual blockers. First pass approved 9 items and requested 3 revisions. The lead applied the proposals verbatim. A fresh pass checked changed text, editorial evidence and primary sections. All 12 current fingerprints are approved, including revision 2 of n05, c09 and c12. The other nine fingerprints are unchanged.

## Findings resolved

- **cc-d1-n05:** Added current English-only Service Operations Agent scope. The note preserves distinct access versus connection-management roles and the conditional Application Insights requirement for troubleshooting during setup.
- **cc-d1-c09:** Replaced weak scheduled/global-plan alternatives with plausible plan-management alternatives. The corresponding agent administration settings page is the supported path; manipulating Knowledge agent rollout plans does not substitute for changing that setting. Key c and option IDs remain unchanged.
- **cc-d1-c12:** Replaced implausible false capability alternatives with documented simulation activities. In the English inbound-voice preview, DTMF is unsupported while a configured receiving number, a single inbound conversation and closed-conversation transcript inspection are supported. Key b and option IDs remain unchanged.

The proposal file and ledger retain resolved findings as an audit trail.

## Sources checked

Every cited source was opened and its exact claims examined. Each item's full source list appears in the ledger. Changed items' relevant pages were reopened after integration. Search snippets did not establish approval.

| Source | Review focus |
| --- | --- |
| [Agent hub](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/overview-agent-hub) | Unified learning, rollout, insights and governance view. |
| [Rollout plans](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/create-rollout-plans) | Enabled-agent prerequisite, future scheduling and existing settings; Knowledge/Intent settings versus Case Management rules have different lifecycle effects. |
| [Agentic simulations](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-simulation-agent) | Preview restrictions, prerequisites, receiving-workstream number versus caller identity, evidence views, English inbound voice and no DTMF. |
| [Use Service Operations Agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/use-service-operations-agent) | English scope, separate access/connection roles, billing, conditional diagnostics setup, Dataverse/MCP requirement and manual rule-condition editing. Detailed tool limits override broad capability examples. |
| [Service Operations Agent overview](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/overview-service-operations-agent) | Configuration, validation and troubleshooting scope; no assertion that every manual operation is automated. |
| [Responsible AI FAQ](https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/service-operations-agent-rai-faq) | Administrator judgment, precise inputs, review, verification and manual alternatives. No GA inference from general preview-versus-GA discussion. |

## Coverage and distinctness

Compared mappings with the [official AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250). Coverage gained is D1.2.01 Agent hub, D1.1.05 simulations and the configuration portion of D1.1.07 Service Operations Agent. This remains partial coverage. Health Agent D1.1.06 is explicitly unfilled; no invented replacement or rename claim is taught. Exam-bank expansion remains outside this batch.

Compared the pilot's 36 cards and 12 notes and sibling user-administration bundle. No duplicate tested decision was found. The Service Operations role split concerns agent access versus connection management, distinct from representative provisioning/persona mapping. Teaching-note context is not another copy of each prompt.

## Validation and limits

Verified all 12 editorial records and complete per-source checks; exact application of all three proposals; revision increments; preserved option IDs/keys; and all current SHA-256 fingerprints using `scripts/pilot-review-utils.mjs`. Nine unchanged items retained previously reviewed fingerprints. The lead owns application/schema/build/browser validation; these suites were not run by this factual-review pass.

This is an independent agent review of current Microsoft documentation, not human certification-author endorsement. Feature changes require renewed review.
