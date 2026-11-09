# Phase 8D quality report

Reviewed 2026-11-09. All **128 questions are independently approved** and compiled locally as version 1.0.0. The final similarity scan is pending with the owner or Claude. No commit, push or deployment occurred; Stage 8E is not authorized.

## Review scope and result

| Batch | Pending at handoff | Direct approval | Corrected then approved | Final batch approvals |
|---|---:|---:|---:|---:|
| AI/distribution | 5 | 3 | 2 | 16/16 |
| Representative experience | 6 | 6 | 0 | 18/18 |
| Case C | 9 | 8 | 1 | 9/9 |
| Total newly reviewed | 20 | 17 | 3 | 20/20 |

Reviewer agents `codex-ai-distribution-reviewer`, `codex-experience-reviewer` and `codex-case-c-reviewer` opened every cited Microsoft Learn page, reviewed editorial evidence, challenged the strongest alternatives and applied all 32 authoring checks. Match questions were checked across every row/token pairing; case questions were evaluated for dependence on the exhibits and order questions for documented dependencies. The lead acted as editor and integrator, without writing reviewer ledgers.

The three substantive corrections were sensitive-data scope/first-question limitations in `sim-d34-q03`, capacity and fallback qualifications in `sim-d34-q14`, and a metric-name clue in `sim-c-q07`. q14 needed a second correction after re-review found that “only if” still overstated fallback behavior. All three returned to their independent reviewers and passed. Tested meanings were clarified without changing the answer keys; unpublished revisions remain 1. These reviews are evidence-based judgments, not a guarantee of exam coverage or factual perfection.

## Final bank

- Formats: match 32; order 7; hotspot 34; multiple 26; single 21; series 8.
- Domains in manifest order: 22, 41, 15, 15, 22, 13.
- Case studies: 8, 9 and 9 questions; two series of four. Pilot q01 remains standalone.
- All 108 previously published questions, original approvals and fingerprints are preserved. Accepted study and original-question-bank files remain byte-identical.
- Compiler: 128 questions, 128 independent approvals, five groups; no unresolved automated near-duplicate pairs.
- Release mix gates pass and no partial batch remains. Generated publication artifacts were produced by the compiler.

## Representative learning examples

| Format | Example | Decision tested |
|---|---|---|
| Match | `sim-d5-q02`, Ferrow Valley Water | Choose macro actions using save behavior and record identity, rather than action names alone. |
| Order | `sim-c-q02`, Castlemere | Resolve the case's voice-resource issue using the documented dependency sequence. |
| Hotspot | `sim-d34-q03`, Marlow Credit Union | Distinguish sensitive context variables, topic input/output handling and test-panel tracing within explicit masking limits. |
| Multiple | `sim-d5-q13`, Tarrant Marine Insurance | Apply the knowledge-search control's recipient-configuration restrictions to a custom claim table. |
| Single | `sim-c-q07`, Castlemere | Explain a Copilot analytics conversation count by reading the case and distinguishing ended from active conversations. |
| Yes/No series | `sim-p-q10`–`sim-p-q13`, Bramwell Pet Insurance | Judge alternative approaches to timed queue expansion without splitting the reporting queue. |

## Verification

- `node scripts/compile-simulator-bank.mjs --write` and `--check`: passed.
- Draft structure checks for all three reviewed batches: passed.
- Original-approval and accepted-file preservation: passed; see `reports/phase8/preservation-result.json`.
- `npm run lint`: passed.
- `npm test`: 410 tests in 33 files passed. New coverage pins allocation and groups, exercises 50/75/100/maximum assembly across seeds, and creates sourced timed attempts.
- `npm run build`: passed with existing bundle-size and dynamic-import advisories.
- `npm run test:e2e -- --workers=4`: 193 Edge tests passed on isolated port 4187.

The new real-bank browser checks use isolated port 4187 and fresh test storage with fixtures hidden. They exercise 50 questions at 320px and 100 at desktop width, whole groups, source snapshots, hidden exam answers, flags, reload preservation and flashcard isolation. They do not use the learner's preview collection.

## Remaining owner/Claude check and gate

The final dump-similarity scan has **not been run on this 128-question candidate**. The handoff reserves it for the owner or Claude, requires zero flags and prohibits other agents from accessing the dump. This is a remaining release check, not an approval inferred from the historical scan.

Broad Lighthouse/fresh-clone acceptance, real-device and screen-reader checks remain deferred to 8E. Open source/depth findings for D6.1.05, accepted `ab250-d6-q10` and D2.2.07 remain recorded in `docs/PHASE_8.md`; no frozen content or coverage status was changed to resolve them.

The next decision is the owner's 8D quality review after the reserved check. No automatic commit, push, deployment or advance to 8E is authorized.


## Publication authorization, 2026-11-09

After the pending similarity scan was disclosed, the owner requested publication of all 128 questions and a push to the repository. This authorizes committing the reviewed changes and pushing main, which triggers GitHub Pages deployment. The final owner/Claude similarity scan remains unrun and explicitly open; this publication request does not record a passing scan or advance Stage 8E. The preceding no-commit/no-deployment statements describe the completed review task before this subsequent authorization.
