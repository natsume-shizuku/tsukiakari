# D3/D4 independent pilot review

Reviewer: `/root/pilot_d1_d2`. Reviewed 2026-10-30. Author: `/root/pilot_d3_d4`.

Initial result: 22 approved; two require revision for duplicated retrieval targets. The JSON records bind each verdict to the actual item, editorial record, and referenced sources through `contentFingerprint` from `scripts/pilot-review-utils.mjs`.

## Blocking corrections

- `cc-d3-c04` accurately teaches native context-name case sensitivity, but repeats `cc-d2-c02`. Replace it with global-variable scope/lifetime. The global-variables page states that variables span topics within a single user session; its Lifecycle section also describes resets. This is already supported by `cc-d3-n02` and tests a distinct D3.2.02 concept.
- `cc-d4-c05` accurately orders producer and consumer rulesets but repeats `cc-d4-c02`. Replace it with a troubleshooting case where a first matching rule prevents another rule in the same classification ruleset from running. The classification page explains the transition to the next ruleset after a match. A later classification ruleset can perform the second calculation. This supports a distinct D4.2.02 decision.

These are editorial quality blockers, not incorrect product answer keys. Their `sourceChecks.supported` values remain true while their decisions remain `needs-revision`.

## Evidence and scope

Every source below was opened and its relevant sections read on the review date. Source access alone was not treated as verification. All notes, cards, questions, editorial evidence, correct keys, and distractor explanations were inspected.

| Source | Opened URL | Sections checked |
|---|---|---|
| cc-d3-s01 | https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/configure-copilot-features | Feature access through profiles; custom-role privileges |
| cc-d3-s02 | https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-summary | Conversation applicability and summary triggers |
| cc-d3-s03 | https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-summarize-conversations | Open/closed summaries and conditional case creation |
| cc-d3-s04 | https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-help-pane | Applicability; help pane; knowledge sources; three filter categories |
| cc-d3-s05 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/context-variables-for-bot | Native mapping; voice variables; handoff context |
| cc-d3-s06 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-variables-bot | Global scope/lifecycle; external settings; IVR timeout exclusion |
| cc-d3-s07 | https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-variables | Explicit value assignment and types |
| cc-d4-s01 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/overview-unified-routing | Classification and assignment stages |
| cc-d4-s02 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification | Evaluation order, first-match transition, prior output consumption |
| cc-d4-s03 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing | Exact Match thresholds; custom-method distinction |
| cc-d4-s04 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles | Manual override; blocking; individual limits |
| cc-d4-s05 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods | Retries; highest-capacity ordering; queue-specific round robin |
| cc-d4-s06 | https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-best-practices | Static classification reuse guidance |

The current help-pane page expressly includes embedded and standalone Contact Center, so representative and preset filter items are supported. Conversation summaries are deliberately scoped to standalone in the reference note; the more general feature matrix should not be used to broaden that detailed summary-page scope. The closed-summary recall inherits that context through its linked note.

The native-context article generally recommends external-value timeouts, but the Copilot Studio global-variable article explicitly excludes Contact Center IVR. The note preserves this narrower exception. No timeout-based voice recovery is claimed.

The capacity note and questions distinguish automatic assignment from supervisor manual override. Exact Match means sufficient required proficiency, not numerical equality. Custom assignment does not inherit the workstream skill algorithm. The highest-capacity question follows the assignment-method article's explicit Exact/Closest distinction.

## Objective and duplication review

Checked editorial locators against `objective-coverage.csv` and the official guide previously opened during this review session: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250 . D3.1.01 covers summaries; D3.1.02 questions; D3.1.03 knowledge; D3.2.02 variables. D4.1.04 covers assignment methods, D4.2.02 classification, D4.2.04 skills; D1.3.04 is a justified capacity-profile cross-map. These are project locators and partial coverage, not Microsoft's published item IDs or full objective completion.

Notes intentionally teach the concepts tested by linked cards and exam questions. Exam questions are independent scenarios, not copies of recalled question wording. Besides the two blocked card duplicates, no materially identical retrieval target was found in this pair or the inspected D1/D2 material. Some distractors are easier than a production certification bank; these remain original pilot questions and make no claim of matching actual examination difficulty.

## Limits and checks

This is independent agent evidence review, not human subject-matter certification or live-tenant validation. No exam-dump material was used. No questions are approved by their author. No authored content, application code, database, or backup contract was modified by this review.

JSON parsed successfully; 24 per-item records have source checks, verdicts, rationale, and computed fingerprints. Final changed content must be re-read and re-fingerprinted before approval. No application test run is warranted for these review-only files; integration validation belongs to the lead.

## Revision-2 duplicate corrections and distractor follow-up

The lead replaced cc-d3-c04 and cc-d4-c05 at revision 2. I read the exact replacement items and editorial evidence and approved fresh fingerprints. The two initial duplicate blockers above are resolved.

A subsequent adversarial distractor pass identified seven items whose wrong answers were too unrelated, redundant, or easy to dismiss. Exact changes are proposed in d3-d4-revisions.json for cc-d3-c05, cc-d3-c06, cc-d4-c06, ab250-d3-q01, ab250-d3-q03, ab250-d4-q01, and ab250-d4-q03. Current keys remain factually supported, but these items are now needs-revision until the proposals are applied and independently re-read. The other 17 current items are approved. Original findings remain above for audit history.

## Final independent verdict after revision-2 application

All 24 D3/D4 items are now approved for this pilot. I read the exact seven revised items and editorial records on disk, including prompts, options, explanations, keys, revision reasons, and objective mappings. They match the proposed changes; none introduces a competing correct answer under its stated constraints. The corrected options remain grounded in the Microsoft documentation already opened in this review.

The lead applied the changes; this reviewer did not modify authored content. All seven changed records now bind revision 2 to freshly computed fingerprints. All 24 ledger fingerprints match current items/editorial/source metadata, and every referenced source has a supported source-check entry. The eight authored questions remain draft for the generator to publish only through the reviewed integration. Initial findings and intermediate verdicts above are retained as review history, not unresolved blockers.

Final scope: 4 notes, 12 cards, 8 exam questions. No claim of full domain coverage, live-tenant testing, or human expert certification is made.
