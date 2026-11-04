# D3/D4 pilot author record

Author: /root/pilot_d3_d4
Source review date: 2026-10-30
Status: source-reviewed draft; independent review and lead approval required.
Owned content: src/content/pilot/d3-d4.json

## Inventory and boundaries

- 4 notes, 12 cards (8 recall, 4 application MCQs), 8 original exam questions (6 single, 2 exact-set multiple).
- 24 editorial records map each item to primary evidence and official objective locators.
- All questions remain draft. No learning data, catalog registration, or UI changed by this author.
- D3 focuses on representative assistance and native standalone voice-context variables.
- D4 focuses on classification dependencies, assignment ordering, strict skill eligibility, and profile-capacity exceptions.
- Wording and scenarios are original. The exam items are separate from flashcards; their supporting notes can appear in multiple curations without duplicate identity.

## Sources actually opened

The exact claim sections are recorded per item in the JSON. Access is not a blanket approval of the full article.

- cc-d3-s01: [Configure Copilot features](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-copilot-features) — opened 2026-10-30.
- cc-d3-s02: [Enable Copilot case and conversation summaries](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-summary) — opened 2026-10-30.
- cc-d3-s03: [Use Copilot to summarize conversations](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-summarize-conversations) — opened 2026-10-30.
- cc-d3-s04: [Configure Copilot features in the help pane](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-help-pane) — opened 2026-10-30.
- cc-d3-s05: [Configure context variables for AI agents](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/context-variables-for-bot) — opened 2026-10-30.
- cc-d3-s06: [Work with global variables](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-variables-bot) — opened 2026-10-30.
- cc-d3-s07: [Work with variables](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-variables) — opened 2026-10-30.
- cc-d4-s01: [Overview of unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/overview-unified-routing) — opened 2026-10-30.
- cc-d4-s02: [Configure work classification rulesets](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) — opened 2026-10-30.
- cc-d4-s03: [Understand skill matching in unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing) — opened 2026-10-30.
- cc-d4-s04: [Create and manage capacity profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles) — opened 2026-10-30.
- cc-d4-s05: [Assignment methods in unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) — opened 2026-10-30.
- cc-d4-s06: [Best practices for unified routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-best-practices) — opened 2026-10-30.

The [official AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) was opened to map the D3/D4 source-order objective locators. Most mapped objectives have only partial pilot coverage; none is claimed comprehensively covered.

## Scope decisions and source tensions

1. External-variable timeouts: the general native context-variable article recommends timeouts, while the linked Copilot Studio global-variable article expressly excludes agents published to the Contact Center IVR channel. The pilot preserves this exception in cc-d3-n02 and does not suggest a voice timeout workaround.
2. Summary availability: the general Copilot feature tables can be broader than the dedicated enable/use pages. Conversation-summary scenarios in this batch explicitly use standalone Contact Center, matching those dedicated instructions. No broad embedded claim is made.
3. Native variable names versus webpage URLs: the native Contact Center integration requires exact case-sensitive names. The separate embedded-webpage URL example has a different case rule; cc-d3-c04 is explicitly native and does not generalize to that API.
4. Custom assignment: workstream default skill matching does not automatically provide conditions for a custom queue assignment method. The original custom-assignment scenario explicitly preserves existing custom rules.
5. Capacity blocking is scoped to automatic assignment. Manual supervisor override remains documented. No universal voice/chat unit cost or automatic timed skill relaxation is asserted.

## Checks and remaining review

JSON parses with the expected counts and unique item identities. Lead integration must run the application's pack, question, reference, and editorial validators. Independent reviewer should challenge each answer/distractor, objective mapping, and cross-domain overlap, especially D3 profile access versus the D5 profile material and D4 capacity versus D1 user-management material.

Items deliberately reinforce prerequisite concepts across notes, recall, application cards, and exam questions; this is not permission to duplicate the same canonical item per curated pack. No external exam-dump question or answer was used.
