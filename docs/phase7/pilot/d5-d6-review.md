# D5/D6 independent review — Phase 7C

Reviewer: `/root/pilot_d3_d4`. Actual source and claim review: 2026-10-30. Author: `/root/pilot_d5_d6`.

## Review history and disposition

All 24 items and their editorial evidence were read. Initial review approved 14 items: four notes, eight recall cards and two exam questions. Four advanced MCQ cards and six exam questions needed revision because their distractors were implausible, although the keyed answers had primary evidence. The lead applied the ten proposed revisions with item/editorial revision increments. All ten are now resolved. A second pass on ab250-d6-q02 required an explicit no-report-editing constraint; the lead applied it in revision 3 and this reviewer checked the final stem and explanation.

Current ledger: all 24 approved (four notes, 12 cards, eight questions), with no unresolved findings. `d5-d6-review.json` binds every decision to the exact item, editorial record and referenced sources via `contentFingerprint`. It includes a check for every item source ID. `d5-d6-revisions.json` preserves the initial replacement proposals; the lead owns content changes.

## Original findings and resolution

| Item | Initial finding | Applied resolution |
|---|---|---|
| cc-d5-c05 | Queue/notification distractors unrelated to saving. | Form refresh, repeat Autofill and focus change now contrast with explicit save. Resolved. |
| cc-d5-c06 | Titles/bookmarks/queue priority do not choose scripts. | Associated scripts, display names and step order contrast with conditional selection. Resolved. |
| cc-d6-c05 | Display name/tab title trivialized diagnosis. | Current state, totals and requirements alone contrast with event-time eligibility. Resolved. |
| cc-d6-c06 | Theme/anchor changes trivialized the prerequisite. | Analytics enablement/access choices contrast with configured voice. Resolved. |
| ab250-d5-q01 | Queue priority/title distractors remote from iframe failure. | Application-tab parameters, anchor placement and title misconceptions. Resolved. |
| ab250-d5-q02 | All distractors unrelated to form targeting. | Entity type, anchor context and tab naming contrast with focus. Resolved. |
| ab250-d5-q04 | Title/routing distractors remote from template composition. | Unassociated duplicate and notification-only setup contrast with the two required relationships. Resolved. |
| ab250-d6-q01 | Report editor unrelated to live-call intervention. | Representative departure violates the explicit participation requirement. Resolved. |
| ab250-d6-q02 | Blanket write/notification choices did not test analytics access. | Analytics-related permissions replace them; revision 3 explicitly prohibits report-editing permissions and excludes the author role for that reason. Resolved. |
| ab250-d6-q04 | Queue changes/query-access removal did not test prerequisites. | Environment-type and cross-platform permission misconceptions. Resolved. |

The resolved q02 concern did not mean the author role cannot grant reading access. The cited article does not establish its complete effective privileges. The added requirement that viewers must not receive report-editing permissions makes the alternative wrong without inventing that claim. Both q03 items already used reasonable same-domain alternatives. Both multiple-answer stems explicitly request two answers.

## Opened primary evidence

Each page below was opened on 2026-10-30 and the relevant body sections read. One initial application-tab request failed; the subsequent open succeeded. Learn's visible authorization banner did not prevent reading these article bodies.

- [Session templates](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/session-templates): anchor, supplied-template limitation, tab association and workstream connection.
- [Application tab templates](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/application-tab-templates): Third-party website compatibility and optional parameters.
- [Scripts](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/agent-scripts): author/user prerequisites, action types, association, conditional default and manual switching.
- [Macros](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/macros): mandatory entry step and sequential context-based execution.
- [Workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams): advanced settings and custom template selection.
- [Automation dictionary](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/automation-dictionary-keys): execution-time values and context-specific formats.
- [Productivity automation](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/macros-productivity-automation): Autofill targeting, autosave, explicit save and mandatory fields.
- [Voice monitoring](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/voice-channel-monitor-calls): standalone scope, supervisor role, private text consultation and joining.
- [Analytics access](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-customer-service-analytics-insights-csh): report/data reading, bookmarks and report authoring.
- [Real-time analytics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-realtime-analytics-dashboard-administrator): voice-option prerequisite.
- [Conversation diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics): Application Insights storage, Managed environment and administration/query/Azure prerequisites.
- [Diagnostics events](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/conversation-diagnostics-subscenarios): named events and custom ruleset telemetry.
- [Diagnose dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/diagnose-dashboard): method limitation and event-time comparisons.
- [Official AB-250 guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250): ordered D5/D6 objectives checked against local CSV locators.

## Mapping, scope and distinctness

D5 templates map to D5.1.02/.04, scripts to D5.2.02, macros to D5.2.03. D6 access/intervention maps to D6.1.03/.04; supervisor analytics configuration to D6.1.01; diagnostics and embedded telemetry to D6.2.05/.06. These are partial topical links, not complete objective coverage. D6-c05 applies the embedded-telemetry objective and overlaps routing diagnosis; a secondary D4.2.10 tag could help later coverage work.

Standalone restrictions are preserved. The notes correctly limit the out-of-the-box-assignment restriction to diagnostic insights, not all raw telemetry: custom assignment details have their own documented events. No universal capacity costs, timed skill relaxation or unsafe credential handoff appears.

I compared all three pilot concept inventories. D3 Copilot profiles/voice variables differ from D5 scripts and runtime automation; D4 routing configuration differs from D6 historical investigation. Note-to-card overlap is intentional teaching reuse. No equivalent prompt or duplicated retrieval target was found across this pilot comparison. This is not an exhaustive future-bank similarity audit.

## Checks and limits

Review and proposals parse as JSON. Each fingerprint uses the shared helper. This is an independent agent documentation review, not tenant execution or a human certification-expert sign-off. No exam dump was used. Schema, scoring, build and browser integration checks remain the lead's responsibility and do not prove factual accuracy. The reviewer edited only review/proposal artifacts. No Phase 7D expansion was performed.
Final verification: all 24 ledger fingerprints matched the current authored bundle, and each item had a source-check entry for every cited source. Nine changed items are revision 2; ab250-d6-q02 is revision 3. The original 14 approvals remain bound to their unchanged fingerprints.
