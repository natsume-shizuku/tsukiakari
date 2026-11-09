# Phase 8: AB-250 exam simulator

Started 2026-11-05, when the user accepted Phase 7G and authorized this work. The owner authorized GitHub Pages deployment and the 108-question preview on 2026-11-09. Every push to main now deploys through `.github/workflows/deploy-pages.yml`; no commit, push or deployment was made during the Codex 8D continuation.

**Current stage: 8D.** All 128 original simulator questions are independently approved and compiled locally as a 1.0.0 release candidate. Final dump-similarity verification remains with the owner or Claude. Stage 8E is not authorized. See [the 8D quality report](phase8/QUALITY_REPORT_8D.md) and [continuation handoff](phase8/HANDOFF.md).

## Why

The accepted test covers single-answer and multiple-answer questions on one scrolling page. A real certification exam is mostly something else: drag-and-drop matching, ordered lists, dropdown answer areas, case studies and one-way sections. This phase adds those formats and a delivery experience that resembles sitting the exam.

## Accepted decisions

- A new, separate bank, `ab250-simulator`. Exams are assembled from it each time, never served as fixed forms.
- The bank starts with 128 new original questions. `ab250-original` is not copied into it and does not change. The bank grows later through new reviewed batches.
- Questions are original. The exam dump the user supplied was analyzed for format statistics only: see [the blueprint](phase8/EXAM_BLUEPRINT.md). It is not a source of truth, and its items are never reused or reworded.
- Banks that declare a `blueprint` are exempt from the 300-approved-questions rule. Every other bank keeps it. Exams keep their 50-question minimum. Practice can use any count from 1, and short practice tests leave out case studies and series.
- Real drag and drop, with a non-drag path for every interaction. This supersedes the Phase 7 note that preferred selects.
- Simulator scoring is per selection. `ab250-original` and all existing attempts keep one point per question and exact-set scoring.

## Stages and gates

| Stage | Deliverable | Gate |
|---|---|---|
| 8A | Gate records and exam blueprint | None |
| 8B | Formats, assembly and delivery, using a marked fixture bank | User tries every format and judges the drag and drop |
| 8C | Pilot: one case study and about 12 items through the review process | User judges difficulty, realism and usefulness |
| 8D | The rest of the 128 in domain batches | Agent-reviewed quality report and examples |
| 8E | Integrated acceptance | User acceptance; no deployment |

Stop at each gate. Approval of the plan is not approval to pass a gate.

## Base of this phase

Phase 8 started on a `main` that was missing two commits from `claude/laughing-jackson-096603`, including paged tests, retrying missed questions and hidden fixtures. The user authorized merging them on 2026-11-05, so `main` was fast-forwarded and Phase 8 was rebuilt on top. The first simulator navigation was replaced with that branch's design, and `questionOutcome` and retry-missed were moved onto the shared grader so they handle every format.

## 8A result

The dump's page images confirmed the layouts read from OCR: hotspot rows are true dropdowns, and the order answer area shows exactly the required number of empty positions. 7G acceptance is recorded, and the blueprint holds format statistics only.

## 8B result

**Historical 8B checkpoint.** Formats, assembly and delivery were built on the marked `simulator-test-fixture` bank of 128 generated questions. Real simulator content was added in 8C/8D; the current result appears below.

- Formats: match, order and hotspot, added as union members so the accepted 300 questions and all saved attempts validate unchanged.
- Dragging: mouse, a touch press-and-hold, and keyboard, through `@dnd-kit/core` 6.3.1, loaded only when a simulator test opens. Every drag also has a select-then-place path.
- Delivery: the same navigation as every other test, with five questions per page, a side panel of range tiles showing progress, Next unanswered, Next flagged, and Finish test in the sticky bar. Pages stay inside a section, case-study exhibits sit beside their questions, and a Yes/No series shows one question at a time. In Exam Mode only open questions in the current section can be reached, so the navigator cannot bypass a lock.
- Scoring: per selection on simulator attempts, with an approximate 1000-point figure labelled as an estimate.
- Backup format version 3, with versions 1 and 2 still importable.

Two problems were found by running it for real. dnd-kit's default auto-scroll moved the page 586px while a token was held still near the bottom edge, so drops landed on the wrong row; it is now slower and limited to a narrow edge zone, and a browser test holds that in place. A schema refactor also changed the field order of parsed questions, which the content gate reported as a stale `ab250-bank.json`; the original order was restored rather than regenerating accepted output, and a code comment now records why it matters.

### Verification

8D continuation, 2026-11-09: `npm run lint` passed; `npm test` passed 410 tests in 33 files; `npm run build` passed, including all content approval gates. `npm run test:e2e -- --workers=4`: 193 Edge tests passed on isolated port 4187. Current machine-readable evidence: `reports/phase8/checks.json`. The build retains the existing large-chunk and ineffective dynamic-import advisories.

### Historical 8B preview instructions

Choose **Exam simulator preview** on the Tests page. It is listed on the development server on port 5186. Production builds hide it unless the `tsukiakari.showFixtures` developer setting is on. Try each format in Practice Mode, then Exam Mode for the section locks. The questions are everyday fixtures, so judge how the formats feel, not the content.


## 8D result and review decisions

The bank contains 128 original questions, 128 independent approvals and five whole groups. The continuation reviewed the 20 questions that were unpublished at handoff: five AI/distribution re-reviews, six representative-experience re-reviews and the nine-question Castlemere case study. Seventeen passed directly; three needed editorial corrections and independent re-review. No answer key changed during this continuation.

- `sim-d34-q03`: state classic orchestration, Application Insights logging and Copilot Studio transcript scope; avoid promising whole-call transcript masking; account for the documented first-question timing limitation.
- `sim-d34-q14`: count capacity-occupying conversations and qualify next-best fallback when no suitable alternative exists. The absolute “only if” wording was removed in a second re-review round.
- `sim-c-q07`: remove the exact metric label from the correct option so the exhibit and metric definition must decide the answer.

The previous lead decisions remain in force: analytics q04, q06 and q09 stay approved under check 12; case B q05 stays as written; pilot q01 is standalone; voice q01 changed from match to single. The earlier AI/distribution q14 conversion from multiple to single is retained. These decisions yield match 32, order 7, hotspot 34, multiple 26, single 21 and series 8. Domain counts are 22/41/15/15/22/13. The case studies contain **8, 9 and 9** questions, because pilot q01 moved out; both series contain four. The older three-times-nine test instruction was corrected without changing frozen content.

All original 108 approval entries and fingerprints were preserved. The accepted 235-card/78-note study collection and 300-question original bank remain byte-identical. The independent reviewers changed only their assigned ledgers; the lead editor applied exact findings to the three unpublished questions and integrated the generated outputs.

### Preview engine changes retained

The earlier preview work made `assembleBlueprintExam` try up to 12 fresh draws before refusing, without substituting questions. `maxBlueprintCount` tests 20 seeded draws for each offered maximum; that is a sampled reliability check, not proof that every possible draw succeeds. Partial preview batches use `approvedPart`, which cannot split a case study or series; a release refuses partial batches. The full local candidate has no partial batches. This continuation changes no runtime engine or storage contract.

### Open findings and acceptance boundary

- D6.1.05 may now be unblockable following the real-time streaming page noted in the prior handoff, dated 2026-11-02. This continuation did not reopen that coverage decision or change the source-gap register.
- Accepted `ab250-d6-q10` may need a separate re-review over a Quality Evaluator role conflict. It was not changed here.
- D2.2.07 remains partial-depth.
- The final 128-question dump-similarity check must be run locally by the owner or Claude and flag zero. Codex and the review agents did not access the dump; the earlier scan is historical evidence only.
- Stage 8E, fresh-clone installation, broad Lighthouse acceptance, real-device testing and screen-reader listening remain outside this continuation. New isolated browser coverage exercises the real bank at 320px and desktop, with reload snapshots and unchanged flashcard tables.

The current 1.0.0 artifacts are a **local release candidate**, not a declaration of 8E acceptance or deployment readiness. Stop for the 8D quality gate after the reserved similarity result is supplied.


## Publication authorization, 2026-11-09

After the pending similarity scan was disclosed, the owner requested publication of all 128 questions and a push to the repository. This authorizes committing the reviewed changes and pushing main, which triggers GitHub Pages deployment. The final owner/Claude similarity scan remains unrun and explicitly open; this publication request does not record a passing scan or advance Stage 8E. The preceding no-commit/no-deployment statements describe the completed review task before this subsequent authorization.
