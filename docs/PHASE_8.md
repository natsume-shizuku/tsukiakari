# Phase 8: AB-250 exam simulator

Started 2026-11-05, when the user accepted Phase 7G and authorized this work. Nothing is committed or deployed without a further explicit request.

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

**Waiting at the gate.** Formats, assembly and delivery are built and running on the marked `simulator-test-fixture` bank of 128 generated questions. No real simulator content exists yet.

- Formats: match, order and hotspot, added as union members so the accepted 300 questions and all saved attempts validate unchanged.
- Dragging: mouse, a touch press-and-hold, and keyboard, through `@dnd-kit/core` 6.3.1, loaded only when a simulator test opens. Every drag also has a select-then-place path.
- Delivery: the same navigation as every other test, with five questions per page, a side panel of range tiles showing progress, Next unanswered, Next flagged, and Finish test in the sticky bar. Pages stay inside a section, case-study exhibits sit beside their questions, and a Yes/No series shows one question at a time. In Exam Mode only open questions in the current section can be reached, so the navigator cannot bypass a lock.
- Scoring: per selection on simulator attempts, with an approximate 1000-point figure labelled as an estimate.
- Backup format version 3, with versions 1 and 2 still importable.

Two problems were found by running it for real. dnd-kit's default auto-scroll moved the page 586px while a token was held still near the bottom edge, so drops landed on the wrong row; it is now slower and limited to a narrow edge zone, and a browser test holds that in place. A schema refactor also changed the field order of parsed questions, which the content gate reported as a stale `ab250-bank.json`; the original order was restored rather than regenerating accepted output, and a code comment now records why it matters.

### Verification

VERIFICATION_PLACEHOLDER

### At the gate

Choose **Exam simulator preview** on the Tests page. It is listed on the development server on port 5186. Production builds hide it unless the `tsukiakari.showFixtures` developer setting is on. Try each format in Practice Mode, then Exam Mode for the section locks. The questions are everyday fixtures, so judge how the formats feel, not the content.
