# Phase 7B: shared study material and independent test banks

Implementation and verification date: 2026-10-29. Phase 7A was accepted and 7B authorized. This stage is limited to architecture and engineering fixtures. **Stop for review before 7C.**

## What is ready

The Library now has curated pack views over permanent canonical card/note identities. Foundation fixtures and Shared foundations preview overlap deliberately: adding the four Foundation cards followed by the six-card shared preview produces six distinct deck cards, not ten. A second deck still has its own progress, notes, tags, suspension, and schedule. The global browser retains 124 unique cards and 42 published notes.

Test questions now belong to an independent downloadable bank rather than PublishedCard. Both linked fixture curations open the same bank. Its 300 software fixtures comprise 225 single-answer and 75 multiple-answer questions. They are arithmetic fixtures, not approved AB-250 teaching material. Fixture approval status exercises software eligibility only.

Multiple-answer questions specify a selection count and score one point for the exact correct set. A partial answer is wrong; no selections means skipped. Answers include explanations for each option and registered sources. Saved attempts freeze bank identity/version, question revision, domain, options, answer keys, explanations, and sources. Reloads, retries, deadline expiry, failed-write drafts, and abandonment retain their existing behavior.

Practice may target a domain when at least 50 eligible questions exist. Exam selection applies largest-remainder quotas, then chooses unseen and least-recent questions inside each domain. A 100-question fixture exam uses 17/32/12/12/17/10 questions. These are internal sampling shares, not a prediction of an actual certification exam. Insufficient inventory produces an explicit message; the requested count is never silently reduced.

Abandonment deletes the unfinished attempt and responses without assigning a score. One latest-exposure record per bank/question remains, preventing abandonment from immediately recycling the same questions. Test data remains separate from flashcard reviews, Mistakes, leeches, daily limits, FSRS, and heatmaps.

## Compatibility and loading

- IndexedDB schema 1 upgrades to 2 in one transaction. Every legacy attempt and the single-unfinished-attempt invariant are validated before writes. Failed upgrade retains the old records, version, and indexes.
- Version 1 Tsukiakari JSON imports remain supported for full collections, deck selections, and settings. Current exports are version 2. Full backups include exposure records, including abandoned-question exposure.
- Existing snapshots preserve their original keys and scores. Legacy domains are marked unclassified; missing option explanations are identified explicitly. Migration does not falsely approve old items editorially.
- Full restore clears and replaces all learner tables atomically, including exposures. Injected write failures roll everything back. Missing installed content does not erase historical snapshots or annotations.
- Bank JSON is fetched only when requested. HTTP, JSON, schema, manifest-version, and canonical-reference failures offer a retry without changing learner data.
- Newly loaded related-note references must resolve to canonical owners. A real bank cannot reference fixture notes. Historical snapshots are intentionally not checked against the current installed catalog.
- See [backup contracts](BACKUP_FORMAT.md).

## Review walkthrough

1. Create a temporary deck. In Library add Foundation fixtures, then Shared foundations preview. The second action should add two cards and recognize the four already present.
2. Browse the shared view: six canonical cards, no duplicate rows. Add one to another deck and save a personal note; verify each copy keeps its own annotation.
3. Follow a pack's question-bank link to Tests. Start a practice test and find a “Choose 2 answers” question. Try a complete and a partial selection, reveal, then inspect the explanation.
4. Abandon an unfinished test and start another. No score or flashcard mistake is created; exposure still informs question selection.
5. Select a small practice domain to see the minimum-inventory explanation. Start an exam to exercise mixed domains and the deadline.
6. Transfer a full JSON backup between isolated browser contexts. Old v1 imports should preserve their original learning records and saved test results.

## Verification

- Typecheck: passed.
- Unit tests: **258 passed across 19 files**.
- Production build: passed.
- Browser regressions: **93 passed**, Microsoft Edge, isolated localhost:4187.
- Responsive checks: 320, 768, 1440, 1920, and 2560px in both themes, including long multiple-answer prompts/options/explanations, keyboard selection and persistence. Existing tests cover notes, drafts, focus restoration, review scrolling, and compact Library panes.
- Targeted migration checks cover valid v1 imports, malformed legacy keys/results, failed upgrades, multiple unfinished legacy tests, full-import rollback, and failed exposure writes.
- Lighthouse 13.6.0: **16 navigation audits** across eight routes. Desktop performance 100; mobile performance 99; accessibility 100, best practices 100, SEO 91 on every route.
- **10 populated-screen snapshots**: revealed flashcard, personal note editor, published note document, 100-question practice with a revealed answer, and multiple-answer question; dark 1440px and light 390px. All scored accessibility 100 and best practices 100. Snapshot audits do not produce a performance score.
- Current reports: [navigation summary](../reports/lighthouse/summary.json), [populated desktop](../reports/lighthouse/populated-dark.html), [populated mobile](../reports/lighthouse/populated-light.html). HTML/JSON audit files and layout screenshots are local ignored artifacts.

SEO 91 reflects the local preview returning its HTML fallback at robots.txt; hosting and crawler configuration remain deferred. Lighthouse scores are local laboratory evidence, not a guarantee across all devices or networks. The missing production source-map diagnostic is also retained; it does not change the category scores above.

Repeat navigation audits with `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/lighthouse.ps1` while a production preview runs on isolated port 4187. Run `node scripts/lighthouse-flows.mjs <cached-lighthouse-package-directory>` for populated screens. These runs create isolated browser profiles and never touch the user preview's learner data.

The production bank is a separate 437.73 kB JSON asset (27.55 kB gzip); the application JS is 622.54 kB (182.70 kB gzip). Vite warns about the large application chunk and about the deferred catalog import sharing the existing application chunk. The deferred catalog lookup avoids initialization-order coupling; it is not claimed as a code-splitting optimization. The bank JSON remains a separate fetched asset.

## Limits and next gate

No real D365/AB-250 cards or exam questions have been installed. Schema tests and fixture success do not establish factual accuracy. Content sourcing, editorial provenance, substantive duplicate review, and difficulty assessment continue in the approved 7C pilot and later content batches.

Domain weakness summaries and navigation from test results into related learning material belong to 7F. Requirement-matching/drag-and-drop questions remain deferred. No attempt-history page, cloud sync, accounts, CMS, deployment, or Anki import/export was added. The original study website was not modified.

After the user accepts 7B, the proposed next stage is **7C: 12 notes, 36 cards, and 24 original questions across all six domains**, with independent source review and representative examples for the user. Do not start that stage automatically.
