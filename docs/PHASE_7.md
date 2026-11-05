# Phase 7: sourced learning and certification practice

Started 2026-10-28 after Phase 6 acceptance. 7A through 7F are accepted. The user accepted [7F](PHASE_7F.md) and authorized 7G on 2026-11-04. [7G](PHASE_7G.md), the final integrated acceptance, is ready and stops for the user's final Phase 7 acceptance. The accepted 235-card/78-note study collection, 300-question original bank and frozen 24-question pilot objects are unchanged. Earlier reports retain historical inventories.

## Learner outcome

Choose a pack, assemble a personal deck, study sourced cards, understand difficult topics, practise with original exam questions, and return to explanatory notes. The owner maintains published content in this repository. Learners maintain independent progress and annotations in their browser.

## Accepted decisions

- Three curated packs: practical D365 Contact Center implementation; AB-250 certification preparation; AB-250 advanced scenarios.
- One canonical source/card/note registry, with pack-specific curation. Shared cards cannot be duplicated into the same deck through different pack views. Different decks retain independent learning copies.
- One separate AB-250 bank of at least 300 approved, substantively distinct questions, shared by both certification packs. This supersedes the earlier 300 embedded MCQs per pack requirement.
- Single-answer and explicitly counted multiple-answer questions; one point per question and exact-set scoring. Long scenarios supported. Requirement-to-answer matching is deferred; later implementation should offer accessible selects rather than require dragging.
- Microsoft study guide governs exam coverage; product documentation governs behavior; Learn modules provide teaching sequence; community material supplies independently checked ideas.
- Keep content in versioned repository files, distributed by the website. No CMS, cloud learner storage, accounts, telemetry, PWA, or deployment in this work.
- Personal JSON import/export remains supported. New persisted contracts require versioned compatibility with current Tsukiakari v1 exports, not migration from the old website.
- Test performance remains separate from FSRS, flashcard Mistakes, leeches, heatmap, and daily quotas. No attempt-history page is restored.

## Review responsibility

The user is learning this technology and is not the factual reviewer for hundreds of questions. Authors, independent reviewers, and the lead own source verification, ambiguity, duplicate detection, and answer validation. The user reviews educational usefulness, representative examples, and progression. See [review process](phase7/REVIEW_PROCESS.md).

## Stages and gates

| Stage | Deliverable | Gate |
|---|---|---|
| 7A | Source inventory, scope/coverage matrix, taxonomy, conflicts, proposed volumes | User reviews scope and learning direction |
| 7B | Canonical curation, independent banks, both answer formats, compatibility and loading using fixtures | Demonstrate deduplication, isolation, snapshots and import compatibility |
| 7C | Pilot: 12 notes, 36 cards, 24 questions spanning all six domains; 3 single + 1 multiple per domain | User reviews examples, depth, readability and difficulty |
| 7D | Source-first study material in topic/domain batches | Agent-reviewed quality report and representative examples per batch |
| 7E | At least 300 approved original exam items, reviewed by domain | Complete practice/exam walkthrough and coverage report |
| 7F | Flashcard topic summaries and separate test domain results linked to notes/cards | End-to-end learning walkthrough |
| 7G | Integrated content, migration, scoring, accessibility, browser and Lighthouse checks | Final Phase 7 review; no automatic deployment |

Stop at each gate; do not interpret approval of the overall plan as approval to skip intermediate reviews. New corrections remain in the current stage.

## Implementation boundaries for 7B onward

Preserve canonical ownership as existing pack/card identity tuples; introduce separate visible curation membership, resolving to canonical identity before deck actions, filtering and export. Do not rename existing fixture or learner identities. Material answer/meaning changes advance content revision; organizational changes do not.

Separate bank questions from PublishedCard and freeze question revision, domain/objective, answer, explanation and source information in historical test snapshots. Preserve old snapshot results. Retain question exposure after abandoning an attempt; do not retain an abandoned score. Use domain quotas with largest-remainder rounding (stable domain-order tie break), then unseen/least-recent questions within each quota. Default bank shares: 17 / 32 / 12 / 12 / 17 / 10 percent. This is an internal allocation, not a prediction of actual exam composition. Default 100/minimum 50 questions and adjustable 120-minute exams remain.

Practice domain filtering is available only with at least 50 eligible items; explain insufficient inventory. Do not silently reduce question count. Retry uses frozen questions. A finite bank cannot guarantee endless repeat-free attempts.

Published files are validated before distribution, with larger banks loaded on demand. A download failure offers Retry and preserves learner records; it is not treated as content deletion. Update backup format explicitly if serialized contracts change; retain v1 import fixtures and transactional rollback.

Flashcard topic summaries default to30 study days with an all-time option, showing Again/Right counts, Again rate and distinct reviewed cards. Untouched topics are Not studied. Exclude undone reviews/tests, show sample size, and label grouping by current content topics. Test results show correct/wrong/skipped by frozen domain, distinguish reveals, and link to reference notes and related cards.

## Current 7A artifacts

- [Coverage, taxonomy and proposed volumes](phase7/COVERAGE.md)
- [Source inventory and verification scope](phase7/SOURCES.md)
- [Community audit and unresolved claims](phase7/COMMUNITY_AUDIT.md)
- [Editorial review process and batch template](phase7/REVIEW_PROCESS.md)

## Acceptance and verification

7A changes documentation only. Validate local documentation links and allocation arithmetic; no application checks or Lighthouse reruns are warranted for documentation-only changes. Phase 6 results remain historical evidence, not a new test run.

7B/7G must run typecheck, unit tests, production build and browser regressions. Cover identity/deduplication, per-deck isolation, current v1 imports, failed writes/loads, snapshots, answer formats, exposure and domain quotas. Check 320/768/1440/1920/2560px in both themes, long questions/notes, keyboard/focus/drafts. Repeat desktop/mobile Lighthouse against populated Library, Notes, review and 100-question tests using isolated port 4187.

No new study pack is approved or installed by 7A. Full source-level review happens for every authored claim; an inventory or working link is not a factual approval.
