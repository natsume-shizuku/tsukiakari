# Phase 7D, batch 1: deployment operations and user administration

Authorized by the user on 2026-10-31 after pilot review. This is the first bounded study-content expansion, not completion of all Phase 7D. Stop for batch review before further expansion.

## Installed material

Added six notes and 18 cards: 12 core recall cards and six application MCQs. All 24 new items have independent source reviews. They extend the existing canonical collection without replacing any pilot card, note, source or learner identity.

| Note | Study focus | Related new cards |
|---|---|---:|
| Control rollout separately from agent configuration | Agent hub prerequisites, scheduling and agent-specific lifecycle effects | 3 |
| Design a simulation that the preview can actually run | Inbound voice preview scope, destination number and inspection evidence | 3 |
| Use conversational setup within its supported boundaries | Service Operations Agent roles, connections, language and tool limits | 3 |
| Prepare a representative account for real work | Account readiness, routing resource and initial presence | 3 |
| Separate role privileges, personas and application access | Cumulative grants and separate application authorization | 3 |
| Change capacity settings without surprising existing work | Custom limits, reset-frequency changes and current assignments | 3 |

The published collection is now **54 unique cards and 18 notes**. Implementation selects 36 core recall cards; Certification Preparation selects all 54; Advanced Scenarios selects 18 application cards. All three views share canonical identities, so overlapping additions preserve existing copies and progress. The source registry contains 52 records representing 51 distinct Microsoft Learn URLs; this batch reviewed 13 source records.

The separate original exam bank remains the unchanged 24-question read-only pilot. No new exam items, scoring features, storage migration, scheduler changes or backup-format changes were introduced. Exam-bank expansion remains Phase 7E.

## Factual review and corrections

Two authors researched separate topics and independently reviewed each other's material. The lead applied findings, and the reviewers rechecked exact revised text and fingerprints. Three operations items needed changes: one note omitted the documented English-language scope; two MCQs needed more plausible alternatives. Two user-administration stems disclosed their diagnoses and were rewritten; one explanation then received a consistency correction. All findings and final decisions remain recorded:

- [Operations review and evidence](phase7/batches/7d1-operations-review.md)
- [User administration review and evidence](phase7/batches/7d1-users-review.md)
- [Combined approval index](phase7/approved-content-index.json)

The current roles article supports direct or team-based assignment. A stale search excerpt implied otherwise; authors and reviewers used the opened primary article body. Persona mapping and application access remain distinct in the material. Simulation is explicitly labelled preview, with its inbound-voice, English and DTMF boundaries. Service Operations tool support is not inferred from broad product descriptions when a detailed table states a limit.

Independent agent review reduces error risk but is not human expert certification. These application cards are introductory to moderate; they are not presented as actual exam difficulty. No exam dump or copied exam items were used.

## Coverage and remaining gaps

Five previously empty objective rows now have reviewed material: D1.1.05, D1.1.07, D1.2.01, D1.3.01 and D1.3.02. The batch also deepens D1.3.03 and D1.3.04. Across the collection, **34 of 119 objective rows have some material**; none of those counts establishes complete objective mastery. The [coverage CSV](phase7/objective-coverage.csv) retains explicit partial statuses and maps each claim to item evidence.

Health Agent (D1.1.06) remains a source gap. The official outline names it, but this research did not find configuration guidance sufficient for reliable enablement cards. No rename, removal or replacement is inferred. Supported Service Operations configuration is mapped to the configuration portion of D1.1.07; transformation and environment migration are not claimed as covered by that note.

D1 still needs deeper connector/third-party CCaaS and deployment coverage, alongside the Health Agent gap. The wider channel, telephony, knowledge, workforce and analytics material remains incomplete. No certification-readiness percentage is claimed.

## Publishing safeguards

The original pilot files and its compiler remain frozen. A new allowlisted batch manifest and compiler validate the new material, then produce the combined catalog under src/content/published/. Unknown IDs/objectives, collisions, invalid references, exam additions, stale or self-approved reviews and changes outside the authorized batch are rejected. Build runs this review check automatically. See [authoring instructions](../CONTENT_AUTHORING.md).

The canonical owner remains contact-center-core, now collection version 0.2.0. The display title is Dynamics 365 Contact Center. The existing exam asset is unchanged. New tests compare original objects directly and verify that adding the expansion preserves learned copies, annotations, scheduling records, review logs and another deck.

## Checks

- Typecheck passed.
- All 278 unit tests passed across 22 files, including 13 publication-gate tests and three expansion/isolation tests.
- Production build passed, including review validation for all 96 published items.
- All 100 Edge browser tests passed with four workers on isolated localhost:4187.
- New browser tests read sourced notes and application cards at 320, 768, 1440, 1920 and 2560px in both themes. They verify independent inspector scrolling and add/review a new canonical card with the keyboard. Representative desktop/mobile screenshots were visually inspected.
- Lighthouse 13.6.0 completed 16 navigation audits across eight routes. Desktop performance: 100; mobile: 98-99 (Statistics 98, other routes 99). Accessibility and best practices: 100 throughout. SEO: 91 throughout.
- Sixteen populated snapshots in dark desktop and light mobile scored 100 for accessibility and best practices. They include revealed review, personal notes, published notes, both new rollout/roles notes, a 100-question practice test, multiple-answer selection and the sourced question preview. Snapshots do not measure performance.
- Saved local evidence: [navigation summary](../reports/phase7d1/summary.json), [populated desktop report](../reports/phase7d1/populated-dark.html), [populated mobile report](../reports/phase7d1/populated-light.html), [desktop note](../reports/phase7d1/phase7d-note-dark-1440.png) and [mobile note](../reports/phase7d1/phase7d-note-light-320.png).

SEO 91 reflects the existing local-preview robots.txt fallback; hosting/crawler configuration remains deferred. These are local laboratory measurements, not a guarantee for every device or network.

The application JavaScript is 703.78 kB (201.11 kB gzip). Vite retains its large-chunk warning and the existing deferred-catalog import warning; the question bank remains a separate download. These warnings do not prevent the build. Larger later batches should continue monitoring initial-load costs. No production deployment, commit or push was performed; tests use isolated browser data.

## User review walkthrough

1. In Library, add Implementation and then Certification Preparation to a deck. Existing cards should be recognized, with only missing cards added.
2. In Notes, search for “Control rollout separately” and read how stopping a rollout differs from changing an agent setting. Open its related scenario card.
3. Read “Separate role privileges” and try its application-access scenario. Judge whether the note teaches enough to explain the decision.
4. Read the simulation note and inspect its preview limitations. These restrictions should be clear before the learner attempts to apply the guidance.

Review requested: educational clarity, note depth and usefulness of the application cards. Item-level factual checking has been handled by the author/reviewer process. The next batch is not started automatically. After acceptance, continue closing study-content gaps in bounded batches; the 300-question expansion and weakness summaries remain later stages.
