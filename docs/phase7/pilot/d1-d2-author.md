# Phase 7C author pass — D1 Deployment and D2 Channels

Author: /root/pilot_d1_d2. Source access and claim review: 2026-10-30 (America/Denver client date). Stage: source-reviewed drafts, not independent approval.

## Delivered scope

4 notes, 12 cards (8 core recall, 4 advanced MCQ), 8 original exam questions (6 single, 2 multiple), and 24 item-level evidence records. Stable canonical owner: contact-center-core. Question status remains draft. Cards 01–04 in each domain are core; 05–06 are advanced.

D1 teaches representative host choices, controlled solution deployment, dependency verification, and post-restore readiness. D2 teaches authentication versus identification, preconversation context, and customer widget integration. Voice, regional licensing, third-party telephony transitions, and numeric feature limits are deliberately outside this pilot slice.

## Source record

All following pages were opened and their specified relevant sections read on the date above. Some Learn pages rendered an authorization notice alongside readable article bodies; content was reviewed from those readable bodies, not inferred from a blocked page.

- **cc-d1-s01** [Dynamics 365 Contact Center overview](https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/overview-contact-center) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d1-s02** [Use Copilot Service workspace](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/ccw-overview) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d1-s03** [Set up the embedded experience in Salesforce](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d1-s04** [Best practices for application lifecycle management](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/alm-best-practices) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d1-s05** [Migrate configurations for channels using solutions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d1-s06** [Manage Dynamics 365 Contact Center environments](https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/restore-environment) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d2-s01** [Configure authentication settings](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-chat-auth-settings) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d2-s02** [Identify customers automatically](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/record-identification-rule) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d2-s03** [Configure a preconversation survey](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-pre-chat-survey) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d2-s04** [Manage context variables](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-context-variables) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d2-s05** [Embed chat widget in your website or portal](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/embed-chat-widget-portal) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d1-s07** [Solution layers](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/solution-layers) — exact supported claims and sections are listed against each item in d1-d2.json.
- **cc-d2-s06** [Send custom context during live chat](https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/send-context-starting-chat) — exact supported claims and sections are listed against each item in d1-d2.json.

[Official AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) was opened for objective mapping only. Displayed update: 2026-05-15. The current D1/D2 bullet order matches the reserved CSV locators used here. A blueprint entry is not used as behavioral evidence.

A single-tag deployment link returned an error during exploration; no authored item cites it. Overview content does not imply every product feature or linked page was reviewed. No community example or exam-dump stem was copied.

## Review requests and boundaries

- Recheck the distinction between the representative embedded widget and customer-facing chat snippet in cc-d1-n01 / ab250-d1-q01.
- Confirm that recovery wording says provision channels **or** enable routing as applicable, without claiming every environment always needs both.
- For ab250-d1-q04, privileges refer to the documented migration procedure and tables, not blanket tenant administrator permissions.
- For ab250-d2-q01, the scenario is expressly anonymous chat; it does not suggest setContextProvider for authenticated chat.
- The contact-phone question scopes itself to the standard mapping. Alternate-field enablement is outside its requirement.
- The consent question teaches product settings, not legal sufficiency of consent.
- Notes intentionally combine related sources. Evidence records identify which claim belongs to each source. Per-option rationales remain with exam questions.
- There is planned concept reinforcement between flashcards and exam scenarios, not repeated exam stems. Questions test a different decision from their nearest linked card where possible.
- These focused subsets do not establish full D1/D2 objective coverage or exam readiness.

## Local author checks

JSON syntax, item counts, unique IDs, source references, note references, and single/multiple answer cardinality are checked before handoff. Independent reviewer must challenge answers and distractors against the sources; lead approval remains pending.
