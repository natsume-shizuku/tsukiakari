# 月明かり · Tsukiakari

A quiet place for daily learning. A fresh React/TypeScript study website for a small group.

For a complete project brief, user preferences, phase history and continuation instructions, read [AGENT_HANDOFF.md](AGENT_HANDOFF.md).

**Phase 7F is ready for review.** Statistics now summarizes flashcard topics, and completed tests show frozen domain results with links to current notes and cards. The accepted collection remains 235 cards, 78 notes and a separate 300-question original AB-250 bank. See the [7F walkthrough and report](docs/PHASE_7F.md), [exam coverage](docs/phase7/exams/coverage.json) and [authoring process](CONTENT_AUTHORING.md). Typecheck, 327 unit tests, 128 browser tests, build and Lighthouse pass. Phase 7G remains unstarted.

## Run locally

Requires Node.js 24+ and Microsoft Edge for the browser checks.

```powershell
npm ci
npm run dev
```

Open http://localhost:5186. A production preview uses `npm run build` then `npm run preview` at http://localhost:4186. These origins have separate browser data. E2E checks use isolated contexts on port 4187.

This repository is independent of all previous study applications. No old implementation, learning records, content, or design was imported.

## Study collection

Implementation selects 157 core recall cards; Certification Preparation selects all 235 cards; Advanced Scenarios selects the 78 application cards. These are views of the same canonical records, so adding overlapping packs to a deck preserves its existing learning copies and progress. Published notes and sources are available through Library; personal annotations remain independent per deck.

Sourced notes and useful cards map to 117 of 119 tracked objective rows. Health Agent enablement and a distinct supervisor app setup remain source-blocked. Three further depth gaps concern third-party CCaaS Copilot provisioning, autonomous transformation/environment migration, and the exact Dynamics CCaaS SDK API contract. See the [explicit gap register](docs/phase7/source-gaps.json) and [coverage explanation](docs/phase7/COVERAGE.md). Objective mappings show reviewed evidence, not mastery or complete certification preparation.

The user accepted 7E and authorized 7F. Study-content validation remains recorded in the [7D report](docs/PHASE_7D.md); bank validation is in the [7E report](docs/PHASE_7E.md). Current integration is documented in the [7F report](docs/PHASE_7F.md). Stop for 7F review before 7G.

The walkthroughs below record earlier phase inventories and UI. Current inventories are above; their original reports remain historical evidence.

## Review learning feedback

Open Statistics → Flashcard topics. Use Past 30 study days or All time, select a study pack, and apply the Deck filter above. Counts show Again, Right, reviews, Again rate and distinct canonical cards; untouched topics say Not studied. Topic titles open their Card browser filter. Grouping uses current content topics, while dates use each review's saved study day.

Complete a practice test or choose Review exam after submission to see Results by domain. These use saved domains and answer keys. Practice separates revealed answers and correct answers without reveal. Expand Study resources or a revealed question's Related study material to read current notes and inspect related cards; browser Back returns to the same recorded result. Missing references are explained. Test performance never changes flashcard Mistakes or scheduling.

## Review the original AB-250 bank

Open Tests → **AB-250 — Original Practice**, or follow the question-bank link from Certification Preparation or Advanced Scenarios. Practice defaults to100 questions; the minimum is50. Timed exams default to120 minutes and balance the six domains. Every answer includes Microsoft references and an explanation for every choice. Multiple-answer questions require the complete set for one point.

New tests prefer unseen questions, then least-recently seen; Retry keeps the recorded questions. Abandoning permits a fresh test without retaining a score, while exposure remains. Individual-domain practice requires at least50 available questions, and requested counts are never silently reduced. Test results remain separate from flashcard Mistakes and scheduling. The bank downloads on selection; failure offers Retry without changing saved learning data.

The [7E report](docs/PHASE_7E.md) retains its historical Lighthouse results. Current checks are documented in the [7F report](docs/PHASE_7F.md); nothing was deployed. Known source gaps remain explicit.

## Phase 7D batch 2 (historical review)

Read the chat rollout, proactive invitation, quick-reply, SMS integration, translation and customer-context notes in Library. Implementation selects 48 recall cards; Certification Preparation all 72; Advanced Scenarios 24 application cards. Adding overlapping packs preserves canonical cards and existing deck progress.

This bounded batch added six notes and 18 cards. Its independent factual review and integrated checks passed; those results are recorded in the [batch 2 report](docs/PHASE_7D_2.md). The user subsequently authorized completion of the remaining 7D work. These historical checks do not establish that the final expanded collection has passed integration. Normal AB-250 tests still require the later 300-question bank.

## Review Phase 7D batch 1 (accepted)

Read the new deployment rollout, simulation, Service Operations, onboarding, role/persona and capacity notes in Library. Implementation now selects 36 recall cards; Certification Preparation all 54; Advanced Scenarios 18 application cards. Adding overlapping packs does not duplicate cards or reset existing study progress.

This batch adds six notes and 18 cards, all independently reviewed against primary documentation. Coverage remains partial. This batch was accepted; the later 300-question bank remains Phase 7E.

## Review Phase 7C (accepted pilot)

1. Open Library and add **D365 Contact Center — Implementation** to a deck: 24 recall cards. Add **AB-250 — Certification Preparation** to the same deck: 12 additional scenario cards, with the original 24 preserved.
2. Read the linked published notes and sources. **AB-250 — Advanced Scenarios** is a focused view of those 12 application cards, not another set of duplicates.
3. Open **AB-250 original questions — pilot** from either certification pack, then choose **Preview pilot questions**. All 24 questions include answers, choice explanations and Microsoft references. Preview records no response, score or exposure.
4. Study the real cards normally with Again/Right, personal notes and tags. The pilot covers selected concepts across six domains; it is not full certification preparation yet.

The owner and agents handle item-level factual review. Feedback requested now concerns clarity, depth and learning usefulness. Phase 7C and the first 7D batch were accepted; current work completes the remaining 7D study collection with independent review.

## Review Phase 7B

1. In Library, add Foundation fixtures to a deck, then Shared foundations preview. Shared cards are recognized: the second view adds only two new cards. Cards and notes retain canonical identities; another deck still has independent progress and annotations.
2. Use either linked fixture pack to open the same Engineering test preview bank. Its 300 arithmetic fixtures include 225 single-answer and 75 multiple-answer questions. The bank downloads on demand; failed loads offer Retry without changing learner data.
3. Practice can target a domain when at least 50 questions are available. Timed exams use domain quotas and prioritize unseen/least-recent questions within each quota. Selection count is never silently reduced.
4. Multiple-answer questions state how many choices are required. All required answers, and no others, earn one point. Explanations and sources appear after reveal/completion. Abandoned tests keep only exposure records to reduce repetition; they do not create a score.
5. Existing Tsukiakari v1 JSON files remain importable. New exports use v2 and include exposure records in full backups. Frozen historical tests retain their original keys and results; flashcard scheduling is unchanged.

See [Phase 7B](docs/PHASE_7B.md) for checks and limitations and [backup format](docs/BACKUP_FORMAT.md) for compatibility. 7B is accepted; its fixtures remain available for software checks and are not AB-250 study material.

## Review Phase 6

The approved layouts now share more consistent focus/hover feedback, readable metadata, stable numeric widths, and a matching browser icon. Keyboard focus returns to a useful control after cancelling an import or removing the final note/card. Mobile Notes retains its heading hierarchy, and the footer no longer shifts during initial storage loading. Practice/completed tests avoid unnecessary timer renders.

Typecheck, 216 unit tests, build, and 83 browser tests pass. Lighthouse scores across eight routes are performance 100 desktop / 99 mobile, accessibility 100, best practices 100, and SEO 91. The eight additional populated-screen snapshots score 100 for accessibility/best practices. Hosting/crawler configuration remains deferred. See the [Phase 6 report](docs/PHASE_6.md) for scope, local HTML reports, limitations, and repeatable audit commands; [Design guide](docs/DESIGN.md) records the conventions. These are historical Phase 6 results. Phase 7A was subsequently accepted; see the Phase 7B report for current checks.

## Review Phase 5

1. Open Statistics for daily reviews and active time, the past seven study days, lifetime totals, the annual heatmap, yearly averages, and streaks. Choose a deck or inspect a date. Undone reviews and tests do not count.
2. In Settings → Data and transfer, export a full backup, settings, or a deck selection as JSON.
3. To move to another browser, open the same website there and choose the full backup file. Review the import preview, download that browser's current backup, confirm it was saved, then choose Replace collection. This replaces local data; it does not merge devices.
4. Deck-selection imports create a fresh deck, with the same card references and scheduling settings but no private progress or annotations. Settings imports update collection preferences and matching deck identities only.
5. Missing published card references remain identifiable and preserved. Available cards in the same deck remain studyable; an imported active session with unavailable content offers Continue with available cards.

Supported JSON files use the Tsukiakari format/version and are limited to 100 MB for both export and import. Full backups include saved sessions and test snapshots; elapsed time on an unfinished review card is a tab-local checkpoint and is not transferred. Exam deadlines keep their original time. There is no automatic sync or cross-device merge.

See the [Phase 5 report](docs/PHASE_5.md) and [backup format](docs/BACKUP_FORMAT.md). Phase 6 was subsequently approved; see the [Phase 6 report](docs/PHASE_6.md).

## Review Phase 4

1. Open Tests and explicitly choose Engineering test preview. Its 300 arithmetic fixtures exercise the software; they are not certification material. Library fixture curations link to this separate shared bank.
2. Choose Practice Mode or Exam Mode, then a question count (default 100, minimum 50). Exams start with a 120-minute time limit, adjustable before starting.
3. Each selection saves to this browser. In practice, Reveal answer locks that response and shows the answer, explanation, and sources. Revealing an unanswered question leaves it skipped.
4. Show answers finishes the attempt and counts correct, wrong, and skipped questions. Exams display a results dialog before Review exam opens the read-only answers.
5. Retry same questions creates fresh responses using the original question snapshots. New test prioritizes unseen questions, then those used least recently. Attempt history is not shown; saved attempts are retained internally to avoid repeating recently used questions.
6. Reload during an attempt to resume saved answers. The exam deadline continues while away; expiry locks responses and scores saved answers on return, even when another page is open. Failed saves retain a visible draft for retry or discard; an expired attempt offers Retry finalization if saving failed.

Only one unfinished test exists at a time. Abandon test is available in the active test and its resume panel. After confirmation it discards that unfinished attempt and its answers without recording a score, allowing a new test. Completed attempts remain unchanged. It is independent of the flashcard review session and never changes schedules, Mistakes, leeches, or review counts. All questions, answer keys, explanations, and sources are saved as snapshots so later content changes cannot regrade old attempts. Phase 7 supersedes the embedded per-pack exam model with a shared bank requiring at least 300 approved, substantively distinct questions; preview fixtures do not meet or replace that authoring requirement.

See the [Phase 4 review report](docs/PHASE_4.md) for implementation and checks. Phase 5 was subsequently approved on 2026-10-27.

## Review Phase 3

1. Open Study and use Create a deck.
2. Open Library → Study packs, choose the destination deck, and add a fixture pack. Use Card browser to select individual cards.
3. Start studying from the deck overview. Review opens on its own page; reveal an answer, then choose Again or Right.
4. Use Personal notes and tags while reviewing, or open a card's details in Library. Save or discard edits before rating.
5. Use Manage on a deck to open its dialog. Settings contains its name, scheduling, archive, and permanent deletion controls; Cards contains membership and suspension controls.
6. Search Library's Card browser, Notes, and Mistakes tabs. Card lists scroll within a bounded height. Click a row to select it exclusively; Ctrl-click toggles individual cards in a multiple selection; one selected card shows details beside the list, while multiple selections enable bulk actions. The shared card inspector has Answer, My notes, and History tabs. Notes uses a page-scrolling document with a hideable title index, inline personal editing, sources, collapsed related cards, and previous/next controls. Related-card dialogs close on outside click, with confirmation if annotations are unsaved. Browsing never records a review.
7. Remove and re-add the same card to restore its progress; restore archived decks from Study. Each deck's copy stays independent.
8. Undo the last review to restore its schedule and daily allowance. An undone Again no longer contributes to Mistakes.
9. Open a second tab to check read-only behavior; close the writer and reload the second tab to take over.

See the [Phase 3 review report](docs/PHASE_3.md) for screenshots, validation results, and the approval gate.

Two fixture packs are available: Foundation fixtures (4 cards / 2 notes) and Collection fixtures (120 cards / 40 notes). The latter exercises larger scrolling collections. Neither is automatically added to your decks.

Personal decks are shown in up to three columns and can be searched by name. Manage opens over the deck overview, defaulting to Settings. Its Cards tab uses independently scrolling list and inspector panes; on mobile, Back to cards returns to the preserved list. Study and adding cards remain in Study and Library. Adding and removing cards shows confirmation and destination-deck membership indicators. Select all matching cards includes matches below the visible area. Permanent deletion removes only that deck’s learner records, including removed cards, and cannot be undone. Archive preserves them.

Fixture material exercises application contracts. It is not an approved learning pack, is not exam-enabled, and will not be included in real published packs.

## Data and privacy

IndexedDB via Dexie stores learner records on the device. A tab-local sessionStorage checkpoint preserves active timing for an unfinished card; its final duration is saved with the review. There is no account, cloud sync, telemetry, service worker, offline support, or PWA installation. Clearing browser site data removes that browser's records. Use Settings → Data and transfer for JSON backups. Published study material is supplied by the website. Real study content and clearly marked engineering fixtures remain separate; fixture banks are not certification material.

The initial write model holds a Web Lock for one tab. Failed or corrupt storage is reported, never silently reset. A card in two decks has separate personal history and notes in each deck. Published source identities remain shared; the membership identity is deck + pack + card.

## Checks

```powershell
npm run lint
npm test
npm run build
npm run test:e2e
npm run check:browser
```

The extra browser check bundles the pinned FSRS probe separately into a temporary directory, executes it in Edge, and removes only that temporary directory. It is independent of the application scheduler and does not touch learner data.

## Project references

- [Approved specification and phase gates](docs/PLAN.md)
- [Phase 1 report](docs/PHASE_1.md)
- [Phase 2 review report](docs/PHASE_2.md)
- [Phase 3 review report](docs/PHASE_3.md)
- [Phase 2 scheduling behavior](docs/SCHEDULING.md)
- [FSRS feasibility](docs/FSRS_FEASIBILITY.md)
- [Development instructions](AGENTS.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

No hosting or publishing workflow is configured. GitHub Pages remains a possible later destination. A private source repository does not itself restrict access to a deployed website.

Card browser rows use pill-shaped badges for type, learning state, suspension, and tags. Counts reflect the selected deck scope; a card in several decks may show several learning states. Cards without a deck copy are labelled Not in a deck.

Card browser keeps Search visible and groups advanced dropdowns behind a Filters toggle, initially collapsed. Active filters are counted on the toggle and survive collapsing. All Library tabs fill the available desktop width with 24px outer padding. Card browser gives about one-third of the content width to the card list (300–560px) and the remainder to the inspector. Its panes use the remaining viewport height. Selection controls occupy their own row without covering content. Settings/Cards in Manage use a horizontal tab bar.


Library uses one compact title and tab bar across Study packs, Card browser, Notes, and Mistakes, with 20px desktop / 16px mobile top padding. The global phase header is removed; saving, read-only, and error status stays with Settings in the navigation. Cards and Mistakes place search, filters, counts, and the destination selector (where applicable) in a compact toolbar above a stable selection row. Success confirmations stay within the controls, while storage errors and read-only notices remain prominent. Reading panes use the remaining viewport height; Notes retains normal document scrolling. This is the default Library layout, without a separate focus mode.


Card selection follows the same rule in Card browser, Manage → Cards, and Mistakes: a normal click selects only that card, while Ctrl-click toggles membership in a multiple selection. Re-clicking the sole selected card preserves its inspector and unsaved draft. Clear selection and Select all remain explicit toolbar commands.
