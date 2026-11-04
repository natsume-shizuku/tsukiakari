# Phase 7A source inventory

Inventory date: 2026-10-28. This is a research index, not a verified content catalog.

## Status meanings

- discovered: URL identified from Microsoft search results; full page/claim review remains pending.
- scope-read: page content opened to establish scope, module order or objectives; does not approve all linked material.
- targeted-review: named claim examined by the lead or independent audit agent; approval applies only to that limited finding, not every statement on the page.

Dates refer to this actual inventory/review pass. Do not copy them into future card claim-review dates. Source publication/update dates and our access dates are different fields. Learn pages sometimes show a sign-in notice while returning readable article content; unreadable protected material must remain pending.

## Primary sources

| ID | Source | Status | Verified scope or next work |
|---|---|---|---|
| S01 | [Product documentation index](https://learn.microsoft.com/en-us/dynamics365/contact-center/) | scope-read | Entry point; follow feature-specific pages before claims are approved. |
| S02 | [Product overview](https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/overview-contact-center) | scope-read | Architecture and capabilities; not an answer source for configuration details. |
| S03 | [Official AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) | scope-read | Coverage/weight authority; observed update 2026-05-15. Behavior still needs product evidence. |
| S04 | [AB-250T00 course](https://learn.microsoft.com/en-us/training/courses/ab-250t00) | scope-read | Teaching audience and course purpose. |
| S05 | [Implement learning path](https://learn.microsoft.com/en-us/training/paths/implement-dynamics-365-contact-center/) | scope-read | Four modules: introduction, core, queues, routing. |
| S06 | [Channels learning path](https://learn.microsoft.com/en-us/training/paths/configure-channels-dynamics-365-contact-center/) | scope-read | Four modules: digital, voice, advanced settings, voice agents. |
| S07 | [Empower learning path](https://learn.microsoft.com/en-us/training/paths/empower-service-representatives-contact-center/) | scope-read | Five modules: workforce, workspace, productivity, knowledge, AI. |
| S08 | [Monitor learning path](https://learn.microsoft.com/en-us/training/paths/monitor-optimize-dynamics-365-contact-center/) | scope-read | Three modules: supervision, proactive engagement, analytics. |
| S09 | [Capacity profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles) | targeted-review | Audit checked profile limits, blocking and manual-assignment caveats; not universal channel unit costs. |
| S10 | [User capacity](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles#capacity) | targeted-review | Audit distinguished configured units from profile limits. |
| S11 | [Skill matching](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing) | targeted-review | Audit checked matching semantics; timed relaxation claim unsupported here. |
| S12 | [Native context variables](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/context-variables-for-bot) | targeted-review | Audit checked native context and applicability; embedded needs separate verification. |
| S13 | [SIP X-headers](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sip-x-header) | targeted-review | Audit checked Direct Routing scope; do not equate every SIP header mechanism. |
| S14 | [Voice-agent module](https://learn.microsoft.com/en-us/training/modules/configure-voice-agents-contact-center/) | scope-read | Objectives include SIP UUI and variables; exact handoff scenario remains a research task. |
| S15 | [ACS migration guidance](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/migrate-from-azure-communication-services) | targeted-review | Lead checked dated transition scope and TPE exception. Recheck before authoring/publishing. |
| S16 | [Teams Phone configuration](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-teams-phone-in-voice-channel) | targeted-review | Lead checked prerequisites: PSTN choices, service-number constraint for Calling Plan, roles/permissions. Detailed API permissions need corroboration before question use. |
| S17 | [ALM practices](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/alm-best-practices) | targeted-review | Lead checked environment parity, managed deployment and active-layer warning. |
| S18 | [Experience profile overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/overview) | discovered | Read search excerpt only; full claim review pending. |
| S19 | [Experience profile configuration](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-agent-experience-profile) | discovered | Read search excerpt only; verify roles, default profiles and feature access. |
| S20 | [Copilot feature configuration](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-copilot-features) | targeted-review | Lead checked embedded/standalone feature table and access through profiles. Region/availability claims require linked-region-source confirmation. |
| S21 | [Proactive engagement overview](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/overview-proactive-engagement) | discovered | Read search excerpt only; campaign/provider prerequisites pending. |
| S22 | [Workforce Engagement Management app](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/workforce-management-wem-app-overview) | targeted-review | Lead checked preview status of this app and distinction from existing workspace capabilities; do not label all WFM preview. |
| S23 | [Proactive dial modes](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/proactive-engagement-dial-modes) | discovered | Read search excerpt only; confirm mode constraints before scenario writing. |
| S24 | [Inbound/outbound profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-outbound-inbound-profiles) | discovered | Read search excerpt only; recording, caller ID and transfer prerequisites pending. |
| S25 | [Voice installation](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-install) | discovered | Read search excerpt only; licensing/region source followups required. |

## Research still required before item approval

This inventory is deliberately finite. Follow the official documentation tree for each authored claim, register its exact source/section, and review linked dependencies. Priorities: embedded deployment/CRM connectors; roles/personas; solution component support; Health/simulation agents; detailed channel SDKs; knowledge-source access; supervisor/Power BI/Application Insights capabilities; WFM and proactive configuration. Neither a syllabus nor this inventory replaces that work.

The guide and course may use different organizing structures. Use the course as teaching order and the guide as coverage authority. Keep feature name changes, preview scope, geography and prerequisites visible in editorial records.

## Audit provenance and limits

The independent audit agent completed the community claim review. Two research agents returned partial findings before reaching usage limits; the lead verified the inventory/counts and integrated available evidence. Their unreturned reports are not represented as completed audits. All 16 module landing pages were reported opened by the blueprint agent; the saved course map relies on the four path contents, and no full unit-level review is claimed.

No source in this inventory has yet approved a real Tsukiakari study card or test item. Approval is per item/revision under [the review process](REVIEW_PROCESS.md).
