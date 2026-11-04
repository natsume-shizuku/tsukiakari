# Phase 7C: reviewed Contact Center content pilot

Implementation date: 2026-10-30. User authorized this subphase after 7B. Stop for review before 7D expansion.

## Working result

Library now exposes three real study curations sharing one canonical collection:

| Curation | Cards | Purpose |
|---|---:|---|
| D365 Contact Center — Implementation | 24 recall | Selected configuration foundations |
| AB-250 — Certification Preparation | 36: 24 recall, 12 MCQ | Foundations and applications organized by six exam domains |
| AB-250 — Advanced Scenarios | 12 MCQ | A focused view of the application cards |

These are 36 unique cards, not 72. Adding all three to one deck still creates only 36 learning copies. Another deck retains independent progress and personal annotations. Twelve shared reference notes support the cards, with 39 registered Microsoft Learn sources. Existing engineering fixtures remain clearly labelled and separate.

Tests exposes **AB-250 original questions — pilot**: 24 original questions, 18 single-answer and six explicitly counted multiple-answer questions. Each domain contributes three single and one multiple question. Answers include explanations, why the alternatives fail, and direct source links.

This bank is read-only preview for the pilot. It creates no responses, scores, attempts or exposure records. Normal practice and exams remain unavailable until the real bank has at least 300 approved items; the minimum of 50 questions per attempt is unchanged. The engineering test bank remains available to exercise scoring and timers.

## Learning and coverage

The pilot touches all six domains, but only selected claims within 29 of the 119 inventoried objectives. All 29 are marked `pilot-partial`; the other 90 remain `scope-inventoried`. Counts are traceability, not an exam-readiness percentage. See [objective tracking](phase7/objective-coverage.csv).

| Domain | Notes / cards / questions | Objective rows with some pilot material |
|---|---|---:|
| Deployment | 2 / 6 / 4 | 6 |
| Channels | 2 / 6 / 4 | 6 |
| Agents and AI | 2 / 6 / 4 | 4 |
| Work distribution | 2 / 6 / 4 | 4 |
| Representative experience | 2 / 6 / 4 | 4 |
| Analytics | 2 / 6 / 4 | 5 |

The official [AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) governs objective mappings; product documentation supports the behavior. Community material remains an idea source rather than an answer authority. No exam-dump question or answer was imported.

This pilot tests foundational and moderate application decisions. The Advanced Scenarios title describes its intended curation, not evidence of full advanced or actual-exam difficulty. Later batches need richer multi-constraint cases, practical teaching progression and much broader coverage. Voice provisioning/telephony, knowledge management, workforce management and proactive engagement are not comprehensively taught here.

## Review findings and safeguards

Three authors researched two domains each; independent reviewers rotated to another author's domains. All 72 notes/cards/questions now have approved records with source sections, supported claims, applicability, author/reviewer identities and exact current-content fingerprints. This is independent agent review, not human expert certification or a guarantee that Microsoft behavior cannot change.

The review replaced two duplicate flashcard concepts, strengthened 26 items with implausible or overly obvious distractors, and clarified an analytics question so its requirement explicitly excludes report-editing permissions. Findings and resolutions remain in the review reports rather than being erased on approval:

- [Deployment/channels review](phase7/pilot/d1-d2-review.md)
- [AI/routing review](phase7/pilot/d3-d4-review.md)
- [Experience/analytics review](phase7/pilot/d5-d6-review.md)
- [Approved item index](phase7/pilot/approved-index.json)

`npm run content:check` validates current independent approvals and compares generated artifacts. Production build runs it automatically. Changes to an item, editorial evidence or cited source invalidate its approval fingerprint. Authoring files keep questions in draft; the compiler promotes only approved generated copies. See [content authoring](../CONTENT_AUTHORING.md).

No database, scheduler, backup format or learner-data migration changed in 7C. The question bank stays a separate asset loaded on demand. The read-only preview reuses the question reader and restores focus when returning to Tests. A separate integration audit found no actionable publication-gate or preview-persistence issue.

## Representative review walkthrough

1. Add Implementation to a new deck, then Certification Preparation. The first action adds 24; the second adds 12. The Advanced view should then show all its cards already added.
2. Read **Distinguish authenticated customers from matching records** (`cc-d2-n01`), then its related cards. Check whether the distinction is understandable before studying the recall questions.
3. Read **Scope voice-agent variables before sharing context** (`cc-d3-n02`). The revised global-variable card distinguishes session lifetime from permanent customer storage.
4. In question preview, examine `ab250-d4-q03`: custom assignment rules need their own exact-skill condition. Its alternatives test realistic confusion between classification, default algorithms and capacity ranking.
5. Examine `ab250-d6-q02`: separate analytics viewing privileges from authoring privileges under an explicit no-editing requirement. Review the source-backed option explanations.

The user reviews clarity, depth, usefulness and desired progression. Detailed factual review has been handled by the author/reviewer process; it is not delegated back to the learner.

## Verification

- Typecheck passed; 262 unit tests passed across 20 files.
- Production build passed, including all 72 review fingerprints and generated-content checks.
- All 97 Microsoft Edge browser tests passed on isolated localhost:4187 with four workers.
- New browser coverage checks canonical deduplication, real note/source readability, disabled normal tests, zero preview writes, preview focus restoration and 320/768/1440/1920/2560px layouts in both themes.
- Existing regressions cover per-deck isolation, failed writes, v1 imports, snapshots, keyboard/draft guards, scheduling and responsive readers.
- Two older assertions were updated for expanded catalog counts. An older backup test now handles either randomly selected question format. An earlier eight-worker run had one browser lock-release timeout; the complete four-worker run passed without changing runtime lock behavior.
- Lighthouse 13.6.0: 16 navigation audits across eight routes. Performance 100 desktop / 99 mobile; accessibility 100, best practices 100 and SEO 91 throughout.
- Twelve populated snapshots (dark 1440px and light 390px): revealed review, personal note editor, published note, 100-question practice, multiple-answer question and sourced pilot preview. All accessibility/best-practices scores are 100; snapshot audits do not measure performance.
- Additional isolated browser smoke check successfully reviewed a real pilot recall card and captured sourced notes at 320/1440px in both themes with no horizontal overflow. Desktop and mobile screenshots were visually inspected.
- Local reports: [navigation summary](../reports/lighthouse/summary.json), [populated desktop](../reports/lighthouse/populated-dark.html), [populated mobile](../reports/lighthouse/populated-light.html), [real desktop note](../reports/pilot/real-note-dark-1440.png), [real mobile note](../reports/pilot/real-note-light-320.png). Reports/screenshots are ignored local artifacts.

SEO 91 is the existing local-preview robots.txt fallback issue; hosting and crawler configuration remain deferred. Lighthouse results describe these local laboratory runs, not all devices or networks. User data on port 5186 was not touched by tests; its development server remains reachable.

Build warnings remain: the application JS chunk is 677.46 kB (195.53 kB gzip), and the deferred catalog lookup shares the application chunk. The pilot question bank is a separate 57.32 kB asset (10.77 kB gzip). These warnings do not prevent the build. Broader content expansion should consider load costs before scaling the catalog.

## Next gate

Phase 7D has not started. After pilot acceptance, expand study notes/cards in reviewed domain batches; 7E expands the original bank to at least 300 approved items. Weak-area summaries and navigation from results to related learning remain 7F. Requirement-matching/drag questions remain deferred. No deployment, commit or push was performed.
