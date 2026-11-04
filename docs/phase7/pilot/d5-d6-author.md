# Phase 7C author pass: D5 representative experience and D6 analytics

Author: /root/pilot_d5_d6  
Claim review date: 2026-10-30  
Status: source-reviewed draft; independent review and lead approval are still required.

## Inventory

4 notes, 12 cards (8 recall core, 4 scenario MCQ advanced), and 8 original questions (6 single-answer, 2 choose-two). The JSON has 24 matching editorial records. Canonical ownership is contact-center-core. Question status remains draft.

## Opened and examined sources

- cc-d5-s01: [Microsoft Learn: Manage session templates](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/session-templates)
- cc-d5-s02: [Microsoft Learn: Manage application tab templates](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/application-tab-templates)
- cc-d5-s03: [Microsoft Learn: Guide representatives with scripts](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/agent-scripts)
- cc-d5-s04: [Microsoft Learn: Configure macros](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/macros)
- cc-d5-s05: [Microsoft Learn: Create and manage workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams)
- cc-d5-s06: [Microsoft Learn: Automation dictionary](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/automation-dictionary-keys)
- cc-d5-s07: [Microsoft Learn: Productivity automation macros](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/macros-productivity-automation)
- cc-d6-s01: [Microsoft Learn: Monitor voice calls](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/voice-channel-monitor-calls)
- cc-d6-s02: [Microsoft Learn: Analytics access and dashboards](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-customer-service-analytics-insights-csh)
- cc-d6-s03: [Microsoft Learn: Manage real-time analytics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-realtime-analytics-dashboard-administrator)
- cc-d6-s04: [Microsoft Learn: Configure conversation diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics)
- cc-d6-s05: [Microsoft Learn: Conversation diagnostics events](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/conversation-diagnostics-subscenarios)
- cc-d6-s06: [Microsoft Learn: Diagnose contact center health](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/diagnose-dashboard)

The [official AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) was opened for mapping. D5.1.02 maps application tabs; D5.1.04 session templates; D5.2.02 scripts; D5.2.03 macros. D6.1.01 maps supervisor settings; D6.1.03 analytics access; D6.1.04 supervisor actions; D6.2.05 conversation diagnostics; D6.2.06 telemetry and analytics. These locators are internal positions in the existing coverage CSV, not Microsoft identifiers.

Each source above was accessed on 2026-10-30 and the cited sections were examined for the specific claims in the per-item evidence records. This does not claim review of every linked page or every statement in an article.

## Scope decisions

- Workspace templates, scripts, macros, voice monitoring, and analytics permission scenarios explicitly use standalone Contact Center. Their product articles restrict those capabilities to standalone/Customer Service; no embedded parity is inferred.
- The pilot separates guidance, sequential automation, form focus, explicit saves, and contextual parameters. It does not turn a macro into a routing rule.
- D6 differentiates live intervention, report access, report authoring, and event-level diagnosis.
- Raw diagnostics events can include custom assignment rule information. The Diagnose dashboard's diagnostic-insights support is narrower: out-of-the-box assignment methods. These statements are kept separate.
- This is deliberately partial D5/D6 coverage. Knowledge governance, Power BI model extensions, Quality Evaluation agent, and supervisor app setup remain later work.

## Source cautions and exclusions

The automation dictionary article contains a broad anchor-only note alongside examples for other context forms. The pilot teaches runtime parameter resolution without testing disputed literal syntax. No universal slug syntax or portability claim is made.

The application-tab documentation's scope is narrower than the session-template article. All combined scenarios adopt the narrower standalone scope. No claim is made that changing a template bypasses iframe restrictions.

The diagnostics configuration article was updated 2026-10-20 and documents guided provisioning. The pilot tests prerequisites and event selection, not fragile click-by-click setup or manually registering an app. Sovereign-cloud export is excluded by explicitly using a supported commercial environment.

Some Learn pages returned an authorization notice together with readable public article text. Only the returned article sections were used. Failed guessed URLs for macros-slugs, productivity-automation, and omnichannel-real-time-analytics were not cited; actual linked pages were used where needed.

## Validation and review handoff

JSON parses successfully. Counts: 4 notes / 12 cards / 8 questions / 24 editorial records. All questions have explanations for every option, a canonical related-note reference, and a stated choice count for multiple-answer items. Final schema and integrated catalog validation belong to the lead's publication checks.

Independent reviewer should challenge applicability, strongest distractors, reuse across note/card/question, objective scope, and evidence. No item has been independently approved by this author pass. No external question or exam dump was copied.
