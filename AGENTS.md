# Tsukiakari project instructions

This is a fresh, independent project. Never copy code, content, designs, or learner data from d365-pa-study-desk.

## Approval gates
Phase 6 and 7A through 7F were accepted; the user accepted 7F and authorized 7G on 2026-11-04. Phase 7G is implemented and ready for the user's final Phase 7 acceptance: see docs/PHASE_7G.md and reports/phase7g/checks.json. New corrections stay in 7G; stop for that acceptance and do not deploy. The accepted 235 cards, 78 notes, 300 original questions and frozen pilot objects are preserved. Do not commit, push or deploy without explicit authorization. Preserve content and persistence contracts, published identities/revisions and exact review fingerprints. Known source gaps remain explicit in docs/phase7/source-gaps.json. Agents own detailed factual verification; the user reviews learning usefulness and experience.
Use delegated agents with bounded file ownership. The lead integrates shared contracts and reviews changes.

## Product invariants
- User manages published content through this repository.
- Learning copies are independent per deck. Unique membership is deckId + packId + cardId.
- All scheduling settings and daily allowances are per deck.
- No accounts, cloud sync, telemetry, offline/PWA features, or Anki interoperability.
- Test results never affect flashcard schedules, Mistakes, or leeches.
- Future exports use JSON. Historical test answers need snapshots.
- Keep fixture content clearly marked and out of future real packs.
- Never alter the existing website or browser storage on ports 4173, 4174, or 5173.
- Use ports 5186 (development), 4186 (preview), and 4187 (isolated browser tests).
- Never silently reset failed or corrupt storage. Writes must be transactional and single-writer.
- Do not deploy or advance phases without approval. Keep repository private.
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
