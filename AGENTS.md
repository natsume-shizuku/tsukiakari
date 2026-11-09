# Tsukiakari project instructions

This is a fresh, independent project. Never copy code, content, designs, or learner data from d365-pa-study-desk.

## Approval gates
Phases 6 and 7A through 7G are accepted. The user accepted 7G and authorized Phase 8, the AB-250 exam simulator, on 2026-11-05: see docs/PHASE_8.md and docs/phase8/EXAM_BLUEPRINT.md. Phase 8 stops for the user at each gate (8B engine, 8C pilot, 8D authoring, 8E acceptance). New corrections stay in the current stage; do not deploy. The accepted 235 cards, 78 notes, 300 original questions and frozen pilot objects are preserved; `ab250-d4-q06` and `cc-d6-n08` moved to revision 2 with the user's authorization on 2026-11-05. Do not commit, push or deploy without explicit authorization. Preserve content and persistence contracts, published identities/revisions and exact review fingerprints. The exam dump used for Phase 8 is a format reference only: never store its text, OCR output, watermark or personal details in this repository, never reword its items, and never give it to authoring agents. Known source gaps remain explicit in docs/phase7/source-gaps.json. Agents own detailed factual verification; the user reviews learning usefulness and experience.
Use delegated agents with bounded file ownership. The lead integrates shared contracts and reviews changes.

## Product invariants
- User manages published content through this repository.
- Learning copies are independent per deck. Unique membership is deckId + packId + cardId.
- All scheduling settings and daily allowances are per deck.
- No site accounts, servers holding learner data, automatic cloud sync, telemetry, offline/PWA features, or Anki interoperability. The one exception is the optional, learner-started Google Drive backup, limited to the `drive.appdata` scope.
- Test results never affect flashcard schedules, Mistakes, or leeches.
- Future exports use JSON. Historical test answers need snapshots.
- Keep fixture content clearly marked and out of future real packs.
- Never alter the existing website or browser storage on ports 4173, 4174, or 5173.
- Use ports 5186 (development), 4186 (preview), and 4187 (isolated browser tests).
- Never silently reset failed or corrupt storage. Writes must be transactional and single-writer.
- Do not deploy or advance phases without approval. Keep the repository private until the owner chooses to make it public.
- Maintain responsive 320px layouts, keyboard access, focus, reduced motion, and 44px targets.

## Checks
Run npm run lint, npm test, npm run build, then npm run test:e2e. content:check/prebuild must run scripts/compile-exam-bank.mjs --check, which transitively verifies the study collection and frozen pilot.
Disclose checks that could not run. Do not edit generated dist output.

## Review implementation
- Read docs/SCHEDULING.md and docs/PHASE_2.md before changing review behavior.
- Keep exact ts-fsrs5.4.2 / FSRS-6.0 pin and standard weights until an explicit compatibility review.
- New Phase 3 personal-copy edits must expire matching undo; never restore over later notes or tags.
- Retain real timestamps and the versioned saved-study-day adapter policy.
- Do not count undone events, browsing, or test attempts toward flashcard quotas/statistics.
