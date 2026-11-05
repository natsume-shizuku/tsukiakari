# Content authoring

Published material is maintained in this private repository. Learner progress, personal annotations and settings remain in browser IndexedDB and portable JSON; no CMS or cloud storage was added.

## Frozen pilot source of truth

- `src/content/pilot/d1-d2.json`, `d3-d4.json`, and `d5-d6.json` contain authored sources, notes, cards, questions and editorial evidence.
- `docs/phase7/pilot/*-review.json` records independent reviewers, current content fingerprints, source checks, findings and decisions. The matching Markdown reports preserve review history.
- `scripts/compile-pilot.mjs --write` publishes generated pack, curations, bank and manifest only when all 72 pilot items pass the review gate. Never edit generated files directly.
- `npm run content:check` checks approvals and exact generated outputs. The pilot compiler remains deliberately bounded to its approved 12/36/24 baseline. Phase 7D uses a separate batch compiler below; it never regenerates that baseline.

## Approved study batches

The user authorized Phase 7D on 2026-10-31 and completion of its remaining study material on 2026-11-02. Intermediate user batch stops are superseded for this stage; independent author/reviewer gates remain required. The final inventory is 78 notes and 235 unique cards, including the frozen pilot and earlier 7D batches. Independent approval and final integrated checks passed on 2026-11-03; the collection is ready for user review. The user accepted 7D and authorized the separate Phase 7E question-bank expansion on2026-11-03. See the [full 7D report](docs/PHASE_7D.md).

- Author bundles live in `src/content/batches/`: the four earlier `7d1-*`/`7d2-*` bundles and eight `7d-final-*` bundles covering deployment, digital channels, voice, outbound/WFM, AI, routing, representative experience and analytics. Independent ledgers and reports live in `docs/phase7/batches/`.
- `src/content/batches/manifest.json` lists the twelve authorized bundles, permanent identities and counts for collection version `0.4.0`. `scripts/content-review-utils.mjs` enforces that scope, the app schema and independent evidence requirements. An author cannot publish another batch by adding a file.
- `node scripts/compile-content.mjs --write` first verifies the frozen pilot, validates every batch, then generates `src/content/published/study-pack.json`, `curations.json`, `docs/phase7/approved-content-index.json` and the [machine-readable study coverage audit](docs/phase7/study-coverage.json).
- `npm run content:check` and the production prebuild check compare combined outputs with current reviewed sources. Do not edit generated outputs. An unresolved or stale review blocks publication.
- Existing card/note/source objects and the canonical owner remain intact. Collection membership expands without changing database, scheduling or backup contracts. Existing learning copies, removed-copy history and annotations remain learner data. The separate 24-question pilot bank is unchanged.

Follow [the editorial process](docs/phase7/REVIEW_PROCESS.md). Open and verify each claim against its cited primary documentation. An independent agent pass is evidence of review, not a human expert certification. Do not infer accuracy from schema or link success.

## Identity, revisions and evidence

Preserve permanent item, source and option IDs. Answer or tested-meaning changes increment the item and editorial revision. Source, editorial or item changes invalidate the fingerprint and require a new independent review. Notes currently have an editorial revision; cards and exam questions also carry runtime revisions. Never regenerate approval fingerprints without reviewing the change.

Each editorial record maps claims to exact source sections and scenario applicability. Every referenced source needs an affirmative independent source check. Authored questions stay draft in source bundles; the compiler promotes only approved generated copies. The approved index links current revision, author, reviewer and objective mappings.

The objective CSV uses pilot-partial for rows with pilot material and study-partial when a reviewed study expansion adds evidence. Final 7D maps sourced notes and useful cards to 117 of 119 objective rows; this does not establish every skill within an objective or learner mastery. Health Agent enablement and a distinct supervisor app setup remain source-blocked. Three further partial-depth gaps are recorded in [source-gaps.json](docs/phase7/source-gaps.json): third-party CCaaS Copilot provisioning, autonomous transformation/environment migration, and the exact Dynamics CCaaS SDK API contract. Keep gaps visible in both the [coverage explanation](docs/phase7/COVERAGE.md) and generated audit. Do not mass-update verification dates.

## Shared material and tests

The canonical owner is `contact-center-core`. Visible curations select the same card/note identities. Final 7D membership is Implementation: 157 core recall cards; Certification Preparation: all 235 cards; Advanced Scenarios: 78 application cards. The collection contains 78 unique notes. Adding overlapping curations to one deck preserves its original learning copies; another deck has separate progress and annotations. Counts and objective mappings describe reviewed material, not complete certification preparation.

The `ab250-original` question bank is separate and downloaded on demand. Its published1.0.0 release contains300 independently approved questions (225 single,75 multiple), including the unchanged24 pilot questions. Normal tests require at least300 approved bank questions. Exams need at least50 per attempt; practice can use any count from1 up to the questions available in the selected domain. Questions are original practice, not copied Microsoft exam items. Tests remain separate from flashcard scheduling and Mistakes.

Run `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. Include source review, duplicate/ambiguity checks, responsive readers and Lighthouse in the phase report. Final7D and7E integration results are recorded in their phase reports; earlier batch results remain historical evidence. Test only on isolated port 4187; do not touch the old website or user preview data.

## Phase7E original exam authoring

The eight bounded bundles in `src/content/exams/manifest.json` add276 original items to the frozen24-question pilot. Authors own evidence and draft content; independent agents own the matching `docs/phase7/exams/*-review.json` ledgers. Source URLs, answer choices, rationale and editorial changes invalidate exact-content fingerprints. Never regenerate an approval without rereading the change.

`node scripts/compile-exam-bank.mjs --write` first checks the unchanged study collection and frozen pilot, then validates every authorized identity, format count, canonical note link, primary source, exact selection count and independent approval before writing any combined bank output. It also requires a current manual decision for every similarity-scan flag. The scan assists review; distinct wording and concept IDs do not prove substantive distinctness.

The generated bank and manifest live under `src/content/published/`; generated approvals, quality metrics and exam-objective coverage live under `docs/phase7/exams/`. Preserve current source gaps and qualify mapped objectives as partial rather than claiming complete exam coverage. The300-question release passed those review gates and is active locally. Every build runs the exam compiler in --check mode through content:check, which also verifies the frozen study and pilot outputs. No study, scheduling, database or backup contracts change in7E.
