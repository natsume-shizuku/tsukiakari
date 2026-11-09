# Phase 8D handoff: finishing the AB-250 simulator bank

Written 2026-11-09 for an agent that picks up this work, such as Codex running on this folder. Read `AGENTS.md` first. It is binding.

## Where it stands

The target is 128 original questions. The owner chose to keep all 128 rather than ship fewer.

- **Live preview: 108.** On 2026-11-09 the owner asked to publish the approved questions early. The site at https://natsume-shizuku.github.io/tsukiakari/ now offers **AB-250 — Exam Simulator** as preview version 0.9.0, with exams of 50 to 81 questions.
  - Complete batches: 8c-pilot, 8d-analytics, 8d-case-b, 8d-deployment, 8d-channels-voice and 8d-channels-digital, 85 questions in all.
  - Approved part of each unfinished batch: 12 from 8d-experience and 11 from 8d-ai-distribution. Both carry `"partial": true` in `src/content/simulator/manifest.json`, so the compiler publishes only their approved questions and the sources those cite. A partial batch may never split a case study or series.
- **Not published: 20.** That is the 11 questions sent back for fixes and the 9 in case study C. Every one is written and passes the draft structure check.

| Batch file (`src/content/simulator/`) | Questions | State at handoff (2026-11-09) | Next step |
|---|---|---|---|
| `8d-ai-distribution.json` | 16 | 11 approved and stamped. q03, q07, q09, q11 and q14 have been fixed to the ledger and need re-review. q07 was fully rewritten, and q14 is now a single-answer question. | Re-review the five |
| `8d-experience.json` | 18 | 12 approved and stamped. q01, q02, q03, q04, q06 and q13 have been fixed to the ledger and need re-review. The editor also added one sentence of its own to q01's evidence claim. | Re-review the six |
| `8d-case-c.json` | 9 | Written. Its first review was stopped before any ledger was written, so there is no review file yet. | Full first review, then the loop |

Each review ledger is `docs/phase8/reviews/<batch>-review.json`. Every approved fingerprint matches its bundle. All Claude agents were stopped at handoff, so nothing else is writing these files.

When you re-review a fixed question, update only its entry: write a new reviewer name, reviewedAt, decision, rationale, findings and sourceChecks, and remove the old fingerprint before you stamp.

**Format mix:** two conversions moved the bank off the plan. Voice q01 went from match to single, and AI distribution q14 from multiple to single. The experience batch took an extra match to make up for q01. The expected release mix is match 32, order 7, hotspot 34, multiple 26, single 21, series 8, which is inside the compiler's 3-point tolerance. Use those counts in the unit test below.

## Rules that cannot bend

1. **Never touch the exam dump.** Do not open, search for or ask for it. Never use brain dumps, practice-exam sites or community answer keys. Evidence comes from `learn.microsoft.com` only, and only from pages you actually opened.
2. **Separate the roles.** Author, editor and reviewer must be separate agents or sessions. A reviewer never edits a bundle, and an editor never edits a ledger.
3. **Approval is tied to exact content.** Any change to an approved question, including its editorial entry or the sources it cites, voids its fingerprint, and the compiler then rejects the batch. Do not touch approved questions.
4. **Bounded files.** Edit only the file your task names. Never edit `src/content/published/` by hand, or `dist/`.
5. **Repository rules.** Do not commit, push or deploy without the owner's explicit say-so. Leave ports 4173, 4174 and 5173 alone.
6. **Live questions are frozen.** The 108 published questions are live, so treat them like the accepted banks: do not edit them. If one really must change, raise its `revision`, have it re-reviewed, and record why in `docs/PHASE_8.md`. Questions not yet published stay at revision 1.
7. **Every push to `main` deploys the site.** `.github/workflows/deploy-pages.yml` runs the tests and the build, then publishes. Only push when the owner asks, and only with all checks green.

## The loop for each batch

1. **Review**, by an independent reviewer. Read `docs/phase8/AUTHORING_BRIEF.md`, including all 32 numbered checks, then `docs/phase7/REVIEW_PROCESS.md` and `src/domain.ts`. Open every cited page. For each question, try to break it: argue for the strongest alternative, test every match row against every token, and look for leaks (checks 11, 16–19 and 21–32). Write one ledger entry per question in the format the existing ledgers use, with a reviewer name different from the author's. Use `"approved"` or `"needs-revision"`, and give an exact, apply-without-judgment fix for each finding. Then run:
   `node scripts/compile-simulator-bank.mjs --stamp <batchId>`
2. **Fix**, by an editor. Apply each `needs-revision` fix exactly as written. Keep explanations, option explanations and evidence notes in step with the new text, and leave no source unused. Then run:
   `node scripts/compile-simulator-bank.mjs --draft-check src/content/simulator/<batch>.json`
   Confirm that no approved fingerprint changed.
3. **Re-review**, by a reviewer. Check only the revised questions, as new text, because fixes often create new leaks (check 32). Stamp what passes.
4. Repeat until every question in the batch is approved.

The experience so far: no review has found a wrong answer key. 30–70% of each batch came back for leaks, ambiguity or unsupported sentences, usually needing one or two fix rounds.

## Publishing more as batches finish

When a partial batch has every question approved, remove its `"partial": true`. For case study C, add a new manifest entry once all 9 are approved: a case study can't be published in part. Then run `node scripts/compile-simulator-bank.mjs --write` and `--check`, and `npm test`. The app picks up the new count from `src/content/published/simulator-manifest.json`, because the bank is already registered in `src/content/questionBanks.ts`.

## Final release, once all 128 are approved

1. Make sure no batch in the manifest is still marked `"partial"`.
2. Set `"release": true` and `"releaseVersion": "1.0.0"` in that manifest. The compiler then refuses partial batches and holds the format and domain mix within 3 points of the blueprint.
3. Run `node scripts/compile-simulator-bank.mjs --write`, then `--check`.
4. The bank is already registered in the app. Nothing changes in `src/content/questionBanks.ts`.
5. Extend `tests/unit/simulatorBank.test.ts`, which already checks the published bank, assembly at 50 and at the largest size, and partial batches. Pin the release counts:
   - 128 approved questions
   - formats: match 32, order 7, hotspot 34, multiple 26, single 21, series 8 (check against the compiled bank)
   - domains, in manifest order: 22, 41, 15, 15, 22, 13
   - three case studies of 9 questions, and two series of 4
   - assembly at 50, 75 and 100 questions across many seeds: unique questions, domains within one of quota, groups kept whole
   - `maxBlueprintCount` is at least 100
   - an exam attempt can be created
6. **The owner or Claude runs the dump similarity check locally.** No other agent runs it: `node scripts/check-dump-similarity.mjs "<path to dump pdf>"`. It must flag 0. It reports IDs and scores only.
7. Update `docs/PHASE_8.md`:
   - Replace `VERIFICATION_PLACEHOLDER` with real results.
   - Record the lead decisions: analytics q04, q06 and q09 stay approved under check 12; case B q05 stays as written; pilot q01 moved to standalone; voice q01 changed from match to single.
   - Record the open findings: objective D6.1.05 may now be unblockable (a new real-time streaming page dated 2026-11-02); accepted `ab250-d6-q10` may need re-review over a Quality Evaluator role conflict; D2.2.07 stays partial-depth.
8. Update `reports/phase8/checks.json`. Then run `npm run lint`, `npm test`, `npm run build` and `npm run test:e2e` (port 4187), and record any check that could not run.
9. Write the 8D quality report for the owner, with representative examples of each format. **Stop there.** Stage 8E is not authorized.

## Checks at handoff

- `node scripts/compile-simulator-bank.mjs --check`: 108 questions, 108 independent approvals, 4 groups.
- `npm run lint` passed. `npm test`: 406 tests passed. `npm run build` passed. `npm run test:e2e`: 191 passed.
- Last dump similarity run (2026-11-08): 123 items, 0 flagged. Highest scores: phrase 0.125, stem words 0.155, options 0.111. It must be rerun on the final bank.
- `docs/phase8/AUTHORING_BRIEF.md` now has 32 numbered checks, added as reviews turned up new leak patterns. Add new ones there.

## Engine changes made for the preview

- `assembleBlueprintExam` now tries up to 12 fresh draws before refusing. With a smaller pool, a single draw could fail when the chosen case study left a domain short, about 1 in 9 times at 50 questions. Nothing is substituted.
- `maxBlueprintCount` now reports a count only if 20 seeded draws all succeed, so setup never offers a size that fails at random. It reports 81 for the 108-question preview.
- The compiler and `scripts/simulator-review-utils.mjs` support `"partial": true` batches through `approvedPart`. A release refuses them.
- Record these in `docs/PHASE_8.md` with the final results, along with the q14 change from multiple to single and the owner's 2026-11-09 decisions to deploy and to publish the preview.

## Reference

- Blueprint and format mechanics: `docs/phase8/EXAM_BLUEPRINT.md`
- Phase plan and gates: `docs/PHASE_8.md`
- Fingerprint check for one batch: `scratchpad/fp_check.mjs <batchId>` in the Claude session's scratchpad. It is not in the repo, so to repeat it, compare `simulatorFingerprint` from `scripts/simulator-review-utils.mjs` against each approved ledger entry.
