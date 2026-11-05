# 月明かり / Tsukiakari — comprehensive project and agent handoff

**Prepared: 2026-11-04 UTC.** This document consolidates the user's requests, approved decisions, implementation, phase history, design, content and operational constraints. It is not a verbatim transcript or a repository copy. It contains the important context needed to continue with another agent; implementation files and detailed evidence should accompany actual coding work.

## 1. Read first: correct project, authorization and status

- **Correct project: D:/Coding/tsukiakari**
- **Private GitHub repository: https://github.com/natsume-shizuku/tsukiakari**
- **D:/Coding/d365-pa-study-desk is the OLD application.** Do not work there, copy its code/design/content, or mutate its learner data.
- The environment sometimes starts in the old directory and supplies its AGENTS.md. Explicitly set the new repository as working directory and read **D:/Coding/tsukiakari/AGENTS.md**. The projects have different contracts and content.
- The user requested a fresh project, repository, design, theme and implementation. The old site was based on the user's brother's interview study site; that is background, not a template to reuse.
- **Phases 1–6 and 7A–7F are accepted. Phase 7G is implemented and awaiting the user's final Phase 7 acceptance.** See docs/PHASE_7G.md, which supersedes the 7F status and test counts below.
- This document does **not** accept Phase 7. Continue requested 7G corrections, then let the user decide.
- Each commit or push needs explicit user authorization, and no deployment is authorized. Keep the repository private.
- Git was resolved on 2026-11-04. Git for Windows is installed, and `main` tracks `origin/main`. The earlier “must be run in a work tree” error came from Git being absent, not from the repository. `.gitattributes` stores files byte for byte, and `reports/` tracks only compact per-phase results.
- The new repository is outside this session's default writable roots. Writes/builds/browser processes have used the execution tool's escalation mechanism. That is an environment permission boundary, not a reason to move the project into the old repository.

### Latest verified state

| Check | Phase 7F result |
|---|---|
| TypeScript no-emit | Passed |
| Unit/content tests | 327 tests across 27 files |
| Production build/content approval gates | Passed |
| Edge browser regression suite | 128 tests, isolated port 4187, four workers |
| Visual review | 20 topic/results screenshots; dark/light at 320, 768, 1440, 1920, 2560px |
| Lighthouse navigation | 18 audits; performance 100 desktop / 94–98 mobile |
| Navigation accessibility / best practices | 100 throughout |
| Navigation SEO | 91; existing local-preview robots.txt fallback |
| Populated Lighthouse | 58 snapshots, all 100 accessibility and best practices |
| Published material | 235 unique study cards, 78 notes, separate 300-question original bank preserved |

Evidence: docs/PHASE_7F.md and reports/phase7f/checks.json. These are results of the verified build, not later edits. No database, backup, scheduling or content-schema changes were made in 7F. No commit, push or deployment occurred.

The last implementation task left the user preview available on port 5186 and stopped its own isolated audit server. Process state is transient: verify listeners rather than assuming they remain running.

## 2. Overall goal and audience

This is a small-group internal learning platform, probably for fewer than ten people. Someone should be able to:

1. Pick a study pack for personal learning or a certification.
2. Build a personal deck from a whole pack or individual published cards.
3. Review with an Anki-like flow, including on a phone in bed at 4 a.m.
4. Read trustworthy explanations, notes and original references.
5. Identify difficult topics and practise certification-style questions.
6. Export settings/learner data and import them into another browser or phone.

The purpose is **reliable learning**, not simply generating hundreds of questions. Cards and test answers need sources; Notes is the teaching/reference layer that connects them.

The owner maintains published cards, notes, references and question banks in the repository. Learners assemble decks and add personal annotations/tags. “Create my own deck” does **not** mean arbitrary personal card authoring or a learner-facing CMS.

No accounts, authentication, cloud sync, telemetry, tenant integration, offline delivery, service worker or installable PWA is in scope. It is a normal mobile-responsive browser website. Local persistence is required; that does not imply offline/PWA support.

“Internal/small group” describes the audience, **not implemented access control**. Hosting was deferred, with GitHub Pages a likely option. A private repository does not by itself make a hosted website private. No hosting/deployment decision should be silently made.

## 3. How the user wants the work managed

- Work in phases; show the working result/report at each phase conclusion and wait for the user's decision before advancing.
- Phase 7 specifically needs smaller stages because research/content review is time-intensive.
- The user explicitly requested **multiple agents**. Use bounded tasks and separate file ownership; the lead integrates shared contracts and reports. A practical team is the lead plus up to three delegated agents, rotating through implementation, research/authoring, independent review and QA.
- Agree shared contracts before parallel edits. Authors should not approve their own facts.
- The user explicitly said, “you do not need to agree with me on everything.” Give honest judgments and explain tradeoffs.
- Complete authorized work without repeatedly asking about routine reversible choices; respect explicit phase gates.
- Treat CRUD and usability as core work: additions need saved feedback, removal/restoration must be discoverable, selection clear, details readable, errors recoverable and mobile usable.
- The user is still learning D365 Contact Center and cannot fact-check all 300 questions. Agents own source verification, ambiguity and duplication checks. The user reviews educational usefulness, readability and representative flows.
- **Lighthouse tests are explicitly required**, together with typecheck, unit, build and browser regressions.
- The user may revisit the Phase 3 layout later; preserve current accepted behavior unless asked to revise it.
- No automatic commit, push, publishing or deployment.

## 4. Identity, theme and visual direction

The selected name is **月明かり**, romanized **Tsukiakari**, meaning moonlight. The user liked an earlier name “hibi-no-shiori,” requested more Japanese names and chose this one. Naming is settled.

The visual identity is a quiet study workspace: crescent/moon icon, Japanese wordmark and small spaced TSUKIAKARI subtitle. A matching SVG favicon exists. Keep this fresh design independent of the old site's Clawpilot tokens/design.

### Exact current colors

Source: src/styles.css. Use existing variables in components, not unrelated hardcoded colors. Dark/light/system preferences exist.

| Token | Midnight/gold dark | Warm-paper light |
|---|---|---|
| --bg | #101722 | #f5f3ed |
| --sidebar | #131c29 | #ebe9e1 |
| --panel | #182231 | #fffefa |
| --panel-soft | #1c2939 | #efede6 |
| --text | #eeeee8 | #253044 |
| --muted | #a8b4c5 | #596579 |
| --subtle | #8394aa | #606c7e |
| --line | #2c394b | #d9dcd9 |
| --accent | #e1c790 | #806027 |
| --accent-ink | #17202d | #fffdf7 |
| --accent-soft | #2b2c2b | #eee5d4 |
| --success | #9ac7b4 | #326b56 |
| --danger | #ffc2b9 | #9b352d |
| --danger-bg | #37272c | #fae9e3 |
| --shadow | #080e1720 | #4e48300a |

System body fonts: Segoe UI, Yu Gothic UI, Hiragino Kaku Gothic ProN, sans-serif. Wordmark: Yu Mincho/Hiragino Mincho ProN/Georgia. No external font account is needed.

Gold signals actions/selection. Status colors supplement labels. Counts, intervals and time use tabular numerals. Keep visible keyboard focus, at least 44px touch controls, wrapping, reduced-motion support and no horizontal overflow from 320px to wide desktop. Hover effects are for pointer devices. Selection/saved options should not animate or flicker.

### Layout decisions, including later changes

- Desktop left sidebar; mobile top navigation.
- Main areas: **Study, Library, Tests, Statistics**. User prefers “Statistics” over “Progress.” Settings is a utility.
- Remove the global “Phase 3 · Study and Library” strip and its reserved height. Saving/read-only/error status lives with Settings.
- Ordinary pages use available width, generally 24px desktop / 16px narrow-screen horizontal padding.
- Entire Library is full-width. Extra width benefits the inspector, not large margins.
- The earlier compact list proposal was later widened. Current desktop Card browser/Mistakes split: **clamp(300px, 32%, 560px)** list + **16px gap** + flexible inspector.
- Use remaining viewport height, without arbitrary 800px pane caps.
- Library briefly had a compact title/tab heading and a target pane start of 200–250px. The user later requested Library's normal full heading style like the other pages. That supersedes the old vertical target; full width and adaptive panes remain.
- Personal decks: **at most three tiles per row**, fewer when narrow.
- Active review: compact and centered, **1200px width cap / 740px desktop height cap**. Center short cards; scroll long content clear of actions. Waiting/paused panels use natural height.
- Test attempts: centered, **1120px width cap**, following the later request to center the oversized test area.
- Ordinary footers stay at the bottom through normal layout flow, without covering long content. Desktop browser/Mistakes prioritize their workspace over an unnecessary footer.

See docs/DESIGN.md and component CSS for current breakpoints and overrides.

## 5. Pages and user interactions

### Study and deck management

Study is the personal deck overview. Reviewing is on its **own route**, separate from deck creation and management. Decks show card/queue counts; Study/Continue opens review.

Create deck is a dialog. **Manage opens a modal over the overview**, initially Settings. It does not redirect to a different management page. Dialog dismissal restores focus; supported outside/backdrop clicks still protect unsaved drafts.

Manage header: deck name/count, Close and Settings/Cards navigation. **No Study/Continue or Add cards buttons** in Manage. Those workflows stay in Study and Library.

- Settings: rename, per-deck scheduling, archive/restore and confirmed permanent deletion.
- Cards: search, selection, removal and suspension.
- Settings has one scrolling area. Cards uses stationary controls and independently scrolling list/inspector, not an additional outer scrolling dialog body.
- On mobile, list or inspector; Back preserves filters, selection and list position.
- Deleting/editing one deck must not affect another deck's data.

### Library → Study packs

Published curated packs with descriptions/counts/references and a destination deck. Add a whole pack or browse cards. Overlapping packs must not duplicate canonical cards in the same deck. Show success only after persistence; counts and “already added” state should be clear.

Engineering fixtures are labelled previews and separate from real content.

### Library → Card browser

Search is always visible. Advanced pack/topic/type/deck/status/tag filters collapse initially, show active-filter count and Reset filters, and consume layout space when expanded.

A compact toolbar holds search/filter/count/destination as applicable, followed by a stable selection/action row. **Clear selection belongs beside the selection/actions**, not far away at the top. Controls never overlay text. Success feedback stays within existing toolbar space rather than stacking banners.
Type, status and tags appear as compact bubbles/badges; membership is visible. Lists use bounded scrolling, **not pagination**.

Final selection rule, shared by Card browser, Manage Cards and Mistakes:

- Normal click selects/highlights only that card.
- Clicking another replaces selection.
- **Ctrl-click** toggles membership in a multiple selection.
- Clicking the sole selected card preserves selection, inspector and draft.
- **No row checkboxes.**
- Select all / Clear selection remain explicit.
- One selection opens details; several show summary/bulk actions.

Add/remove must provide saved feedback. Removing a card preserves that deck copy's progress, notes, tags and history. Re-adding restores the same copy rather than fresh progress or quota.

### Shared inspector

Reused across browser, Manage, Mistakes and related-card dialogs.

- Stationary compact header: deck-copy selector or fixed deck, status, Card actions and Close/Back.
- Stationary tabs: **Answer / My notes / History**.
- Only the active tab content scrolls.

Answer defaults open: question, MCQ choices, answer, explanation and sources. Pack/topic/revision/fixture metadata is compact. Reference notes begin as individually collapsed titles.

My notes: personal note/tags with Save/Discard beside editor. Preserve drafts across tabs. Warn before changing cards, deck copies, filters or pages would discard edits. Failed writes retain drafts.

History: scheduling summary and retained review logs. Undone events stay identifiable but excluded from totals.

Card actions: Suspend/Resume and confirmed Remove. Removing the current copy must **not silently select another deck's copy**. Without a learning copy, show the published answer and explain unavailable personal notes/history.

### Library → Notes

A **document reader**, not a card browser/grid of repeated body previews.

- Hideable desktop title index, about 260–320px.
- Titles plus published/personal indicator and personal note's deck name; no repeated body snippets.
- Visible search; collapsed pack/deck/type filters and active count.
- Normal document/page scrolling, without artificial fixed/minimum height.
- Order: title/compact metadata → prose → sources → collapsed Related cards.
- Compact Previous/Next and Show/Hide index controls.
- Published notes read-only.
- Personal annotation editing inline; Save returns to reading, Discard restores saved text.
- Mobile index or document; Back restores focus and position.
- Related cards open the shared inspector in a dialog.
- Deep links open exact canonical notes. Missing notes show unavailable state, never another note as a silent substitute.

### Library → Mistakes

**Flashcard study only.** Same layout and selection conventions as Card browser. Selecting a card shows details with suspension available. Historical Again is retained; a later Right does not erase it. Removed/archived copies are omitted from the current list.

Practice/exam errors **never enter Mistakes**, FSRS or leeches.

### Tests

See section 7. **No visible Attempt history page/panel.** Internal saved attempts support snapshots, exposure, backups and return navigation; this is not permission to restore a history UI.

### Statistics

Daily reviews/time/average, lifetime/week time, yearly heatmap, days-studied percentage, daily average and streaks, with deck/date/year inspection. Date inspection controls were requested centered.

The supplied Anki screenshot inspired the heatmap/metrics. Its numbers (368 reviews, 26.85 minutes, 533.35 lifetime hours and a 1392-day streak, among others) are reference-image data, **not seed values or goals**.

Only committed non-undone flashcard reviews count. Exclude browsing, tests and idle/background time.

**7F Flashcard topics:** default past 30 saved study days inclusive today; All time; study-pack scope; existing Deck scope; optional higher-Again-rate ordering. Show Reviews, Again, Right, Again rate and distinct canonical cards. Untouched topics say Not studied, without fabricated rates. Keep sample sizes visible.

Current content determines grouping; saved study-day labels determine dates. Repeated reviews count separately; one canonical card in two decks counts once in Distinct cards. Removed-copy history counts; unavailable content has an explicit bucket. Topic titles open filtered Card browser results.

### Settings

Dark/light/system appearance, saved study-day configuration and JSON transfer. Deck scheduling is in each deck's Manage dialog. Preserve saving/read-only/error indicators.

## 6. Scheduling and learning ownership

| Setting | Default | Scope |
|---|---|---|
| New cards/day | 20 | Per deck |
| Maximum Review-stage answers/day | 9999 | Per deck |
| Learning steps | 1m, 10m, 1h | Per deck |
| Relearning steps | 10m, 1h | Per deck |
| Desired retention | 90% | Per deck |
| Leech threshold | 10 Review-stage lapses | Per deck |
| Leech action | Suspend; tag-only alternative | Per deck |
| Study-day start | 05:00 | Collection |
| Timezone | Saved initial device zone, then explicit preference | Collection |

No nightly server job. Browser computes due queues from saved state/current time. At 4 a.m., activity belongs to the previous study day. Unused quota does not carry over. Overdue cards remain due. Due learning/relearning steps have priority and bypass review limits.

Only **Again** and **Right** ratings. Right maps to FSRS Good. Exact pin: **ts-fsrs 5.4.2 / FSRS-6.0 / standard 21 weights**, fuzz disabled. Ship standard parameters first and retain complete logs for later optimization; no optimizer is implemented or approved.

Learning/relearning steps use elapsed minutes. Long-term review dates align to saved day boundaries, including DST. Adapter expresses study days as synthetic UTC dates for FSRS elapsed-day math while retaining real timestamps. Read docs/SCHEDULING.md and docs/PHASE_2.md before changes.
Only Again from Review increments leech lapses; initial learning/relearning failures do not. At threshold tag/suspend the copy. Resume retains memory/lapses/tag; another qualifying lapse can suspend again.

Rating atomically saves schedule/copy/log/next turn. No advance on failure, no duplicate stale-turn submissions. Wrong flashcard MCQs must rate Again. Reveal saves separately and is not a review.

Undo is one-level, survives reload and reverses schedule/quota/leech effects. Retain undone audit events but exclude them. Later settings, membership, suspension or annotation edits can expire undo; never overwrite newer notes/tags with an old snapshot.

Active time counts only while visible/focused with a **30-second inactivity cutoff**. Tab-local unfinished-card timing handles pause/reload; hidden/paused time is excluded. Unfinished timing is not transferred in backups; restore clears that checkpoint while preserving committed durations. Preserve complete before/after states, real timestamps, study-day labels, version/settings/content revision metadata.

Review keyboard shortcuts: Space/Enter reveals, then rates Right; a wrong MCQ instead rates Again. Before flashcard MCQ reveal, 1–4/A–D selects and G toggles guessed. Correct guessed answers may still be rated Right or Again; no Hard rating. Ignore shortcuts in editable controls, buttons/links and dialogs, and ignore modifiers/repeated key events. Restore review focus after advancing. These flashcard shortcuts do not limit test-bank options to four.

Changed deck settings affect future answers without rewriting saved due dates, end that deck’s active review and expire its undo. Changed timezone/day boundary ends review/undo globally but leaves historical saved study days unchanged. Settings imports follow the same rules; tests/deadlines are unaffected.

### Permanent identities

- Canonical card/note: packId + cardId/noteId.
- Learning membership: **deckId + packId + cardId**.
- Same card in different decks: independent annotations, progress, suspension and schedules.
- Same card through two curations in one deck: one copy.
- Never recycle/rename stable IDs merely for cleaner naming.
- Answer/tested-meaning changes require revision and independent rereview.
- Personal annotations are unverified, unlike sourced teaching notes.
- One active flashcard session globally, independent of the one allowed unfinished test.

## 7. Practice and exam rules

### Selection

- Select one **bank** per attempt.
- Default 100 questions, minimum 50.
- No duplicate questions within an attempt.
- Fresh attempts prefer unseen, then least recently seen.
- Do not silently reduce count or pad by repetition.
- Finite banks cannot promise endless non-repetition.
- Retry uses the same frozen questions with fresh responses.
- Practice domain filtering requires at least 50 eligible questions.
- Current individual-domain maxima: Deployment 51, Channels 96, Representative experience 51. Smaller domains cannot independently start a 50-question attempt.
- Exam allocation: approved internal **17/32/12/12/17/10**, largest-remainder rounding, stable domain-order ties. A 50-question exam uses **9/16/6/6/8/5**. Internal shares are not exact-real-exam predictions.

### Formats

Single-answer and explicitly counted multiple-answer questions. Exact-set scoring: one point only for all correct options and no others. Nonempty partial/wrong sets are wrong; empty is skipped. Visible labels use A, B, C, … from displayed option order, never internal IDs. The current bank includes both four-option and five-option questions. Explanations teach every option.

The user supplied a drag/drop requirements-to-actions example with reusable choices and multiple target rows. Matching remains **deferred**. If implemented later, include accessible selects/keyboard/touch alternatives; do not require dragging or claim it exists now.

### Practice Mode

Question list with optional reveal. Reveal freezes the response; unanswered reveal stays skipped. Show answer/explanation/source. Completion shows all answers and correct/wrong/skipped, with retry.

User removed unnecessary “Revealing locks your response.” copy and Clear answer buttons. Preserve lock behavior without restoring clutter.

### Exam Mode

Default **120 minutes**, adjustable before explicit start. No per-question reveal. Save selections and an absolute deadline. Time continues through sleep/navigation/browser closure. Expiry finalizes while active or on reopen, including from another page.

Show answers submits/hides form and displays results dialog (e.g. 0/100, 0%). Review exam shows frozen read-only answers. Denominator includes skipped. Failed finalization remains locked and offers retry; no late answers. An exam ending away from its attempt shows a transient “Exam time ended” notice with See results on every page; it stores nothing and is not an attempt history.

### Lifecycle, failures and results

Only one unfinished test globally. Abandon exists both inside attempt and resume panel, with confirmation. Success discards unfinished answers/no score but **retains exposure**. Failed writes remain non-destructive.

Selections save without flicker/focus loss. Unsaved failed responses remain recoverable and guard navigation. Test confirmation messages must not bleed onto other pages.

Freeze bank/version, question/revision, domain/title, options, key, explanation and sources. Never regrade history from live content.

7F results show correct/wrong/skipped by **frozen domain**. Practice separates revealed and correct-without-reveal counts. Resource links resolve current notes/cards from saved canonical refs, while recorded answers/sources remain unchanged. Missing refs are explicit. Active exams expose neither domain outcomes nor resource answers.

Browser Back/Forward returns to the same attempt. Completed exam review retains review=1, without reopening the score dialog. Automatically restored plain-Tests attempts normalize to a stable attempt URL. No history page.

## 8. Storage, portability and accounts

Published material is versioned repository content shipped with the site. Learner data is browser **IndexedDB**, through **Dexie**, not a hosted database service. No IndexedDB/Dexie account signup is part of the app. Preserve dependency notices in public/third-party-notices.txt.

IndexedDB holds structured indexed/transactional records. localStorage assists initial theme; sessionStorage holds unfinished-card timing. Do not replace the database with a single localStorage blob.

Web Lock allows one writer. Secondary tabs stay read-only until writer closes and they reload. Never silently clear/reset corrupt/unavailable data. Post-commit read failures must block stale retries that could duplicate writes.

### JSON transfer

The user asked whether JSON/ZIP could handle export despite IndexedDB internals. **JSON is the accepted implemented format; ZIP and Anki .apkg are not required.**

Envelope: format “tsukiakari”, version 2, exportedAt, kind. Strict original Tsukiakari v1 remains importable. No migration from old site or Anki.

| Kind | Data | Import behavior |
|---|---|---|
| full | Decks/copies/preferences/schedules/logs/session, frozen test attempts/exposures | Replace all learner state after preview + current safety export/acknowledgement; no merge |
| deck | Deck name/settings/canonical card refs | Fresh deck/copy identities, no personal history/notes/tags/schedules/tests |
| settings | Preferences and settings keyed by permanent deck ID | Apply matching IDs; unknown IDs reported/skipped, never matched by name |

A deck-selection file is **not** a full progress backup. To move history/notes to a phone, use full JSON. No automatic device sync/merge.

100 MB import/export limit. Full JSON is unencrypted and contains private notes/history. Published cards/notes/sources are not embedded as installed content; historical test snapshots are embedded. Missing published IDs are preserved/identified and excluded from queues, not erased.

Validate complete shapes/relationships before writes. Full restore replaces all tables in one transaction with rollback; changed workspace invalidates safety acknowledgement. Preserve schema 1→2 migration rollback and v1 fixtures. Restart deadline monitoring after restore.

See docs/BACKUP_FORMAT.md.

## 9. Current study packs and test bank

### Canonical registry and curations

Canonical owner **contact-center-core**, version **0.4.0**, title Dynamics 365 Contact Center.

Unique study inventory: **235 cards (157 recall + 78 application/MCQ), 78 notes, 12 practical topics, 183 source records**. Curation memberships are not new unique objects.

| Visible curation | Permanent ID | Cards | Notes | Purpose |
|---|---|---:|---:|---|
| D365 Contact Center — Implementation | d365-contact-center | 157 | 78 | Core practical recall |
| AB-250 — Certification Preparation | ab250-preparation | 235 | 78 | All cards organized by official domains |
| AB-250 — Advanced Scenarios | ab250-advanced | 78 | 75 | Application/troubleshooting |

These are views, not duplicated registries. Provenance is not a reason for another card. Advanced Scenarios is not simply a copied community-source pack.

Practical topic IDs: architecture-deployment, users-security, lifecycle-management, routing-capacity, chat-digital, voice-telephony, copilot-ai, representative-workspace, knowledge-management, supervision-analytics, workforce-management, proactive-engagement.

Tags should convey topic/feature/task (design/configure/operate/troubleshoot), exam domain/objective and applicable channel/deployment where useful. Source/review metadata is editorial, not personal tags. Do not imply previews are GA.

### Independent question bank

**ab250-original**, version **1.0.0**, title AB-250 — Original Practice; shared by both certification curations.

**300 independently approved original questions: 225 single / 75 multiple.** Includes unchanged 24-question pilot + 276 new 7E items. Registry: 182 source records / 148 distinct Microsoft Learn URLs.

| Domain | Questions | Single | Multiple | Recorded official range |
|---|---:|---:|---:|---|
| Deploy Contact Center | 51 | 38 | 13 | 15–20% |
| Implement channels | 96 | 72 | 24 | 30–35% |
| Configure agents and AI | 36 | 27 | 9 | 10–15% |
| Configure work distribution | 36 | 27 | 9 | 10–15% |
| Representative experience | 51 | 38 | 13 | 15–20% |
| Analytics | 30 | 23 | 7 | 10–15% |

Ranges are the recorded guide inventory, not a new live verification. Recheck official guide before coverage edits. Community midpoint percentages total 105%; do not naively use that graphic as a normalized sampling model.

Bank loads on demand; failed download offers Retry without learner mutation. Verified asset: 701.12 kB / 121.61 kB gzip. Arithmetic fixtures do not count as real cards or certification content.

## 10. Research and content standards

### Original user-supplied source direction

These are research inputs, not newly reverified claims. Browse current primary docs before changing content.

- Product docs: https://learn.microsoft.com/en-us/dynamics365/contact-center/
- Implementation overview: https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/overview-contact-center
- Certification: https://learn.microsoft.com/en-us/credentials/certifications/d365-contact-center-ai-engineer-associate/?practice-assessment-type=certification
- Official guide: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250
- AB-250T00 course: https://learn.microsoft.com/en-us/training/courses/ab-250t00
- Implement path: https://learn.microsoft.com/en-us/training/paths/implement-dynamics-365-contact-center/
- Channels path: https://learn.microsoft.com/en-us/training/paths/configure-channels-dynamics-365-contact-center/
- Empower path: https://learn.microsoft.com/en-us/training/paths/empower-service-representatives-contact-center/
- Monitor path: https://learn.microsoft.com/en-us/training/paths/monitor-optimize-dynamics-365-contact-center/
- Community repo: https://github.com/MicrosoftLearnHub/AB-250---Transforming-Contact-Center-Experiences-with-AI-in-Dynamics-365
- Test interaction inspiration: https://ten-jlpt-site.vercel.app/ and https://ten-jlpt-site.vercel.app/N1/12_2024

User highlighted community Exam Blueprint & Skills Measured, In-Depth Complex Topics Breakdown and ten example questions, initially asking exam style to lean toward it. Research established it is community-driven, not authoritative Microsoft product documentation. Use independently checked scenario ideas, not its answer key, ownership claims or copied questions.

Authority order:
1. Official certification guide: taxonomy and coverage.
2. Microsoft product documentation: actual behavior/applicability.
3. Learn modules: teaching sequence.
4. Community: independently validated discovery/scenario leads.

The four paths contain 16 module landing pages in the recorded inventory. Four teaching paths are not the six exam domains.
User mentioned possessing an exam dump for possible later analysis and supplied one watermarked drag/drop format screenshot. **No dump was used in the current bank.** No dump-import/copied-question workflow is implemented. Current questions are original practice, not actual exam items.

### Accuracy, duplication, review

Every card/note/test answer cites registered HTTPS sources. IDs/revisions are permanent. Verification dates mean actual review; never mass-update them.

Claims need exact source sections/applicability. Explain correct and incorrect choices. Do not invent licensing, region support, preview/retirement claims or prerequisites.

Check semantic duplicates, not only wording. Reuse teaching references, but do not pad questions with renamed copies. Similarity scans assist, not prove, distinctness.

Independent approval fingerprints bind item revision, evidence and source objects. Changes invalidate approvals and need actual independent rereview. Never regenerate signatures merely to make build pass.

Current material maps to **117/119 tracked objective rows**: scoped evidence, not full blueprint coverage, mastery or a passing guarantee.

### Remaining gaps

| Objective | Status | Missing detail |
|---|---|---|
| D1.1.06 | Source-blocked | Health Agent enablement procedure |
| D6.1.05 | Source-blocked | Distinct supervisor-app setup |
| D1.1.04 | Partial depth | Exact third-party CCaaS Copilot provisioning |
| D1.1.07 | Partial depth | Autonomous transformation/environment migration |
| D2.2.07 | Partial depth | Exact Dynamics CCaaS SDK API contract |

Do not fill gaps from similarly named features. Preserve docs/phase7/source-gaps.json and coverage qualifications.

Important reviewed distinctions: Teams Phone Extensibility vs specified standalone ACS retirement; Direct Routing applicability; native bot context vs SIP UUI/X-headers; secure-transfer override scope; capacity units vs profiles; manual/supervisor vs automatic assignment. Reopen exact primary sources before changes; no blanket generalizations.

### Publication pipeline

- Author bundles: src/content/pilot/, batches/, exams/.
- Independent ledgers: docs/phase7/pilot/, batches/, exams/.
- Manifests bound authorized identities/counts; adding a file alone does not approve publishing.
- Generated runtime: src/content/published/study-pack.json, curations.json, ab250-bank.json, bank-manifest.json.
- Generated evidence: study approval/coverage index and exam approval/coverage/quality scans under docs/phase7/.
- Never hand-edit generated artifacts.
- node scripts/compile-content.mjs --write validates pilot/reviews and generates study outputs.
- node scripts/compile-exam-bank.mjs --write verifies frozen study/pilot and exam approvals before output.
- **npm run content:check** runs exam compiler --check, transitively checking study/pilot.
- Production prebuild runs content:check. Stale/unapproved output must block publication.

Read CONTENT_AUTHORING.md and docs/phase7/REVIEW_PROCESS.md.

## 11. Full phase history and remaining work

| Phase | Scope | Status / report |
|---|---|---|
| 1 Foundation | Fresh private project/repo, contracts, fixtures, Dexie, navigation, writer lock, FSRS probe | Accepted; docs/PHASE_1.md |
| 2 Scheduling | FSRS, per-deck limits, steps, day adapter, atomic reviews, undo, leeches | Accepted; docs/PHASE_2.md |
| 3 Study/Library | Deck CRUD, dedicated review, Manage modal, browser/inspector/Notes/Mistakes, many usability revisions | Accepted to continue; may revisit; docs/PHASE_3.md |
| 4 Tests | Practice/exam, deadline/selections, results/review/retry, abandonment/failures; history UI removed | Accepted; docs/PHASE_4.md |
| 5 Portability/statistics | JSON safety restore, activity/heatmap/streaks, test isolation | Accepted; docs/PHASE_5.md |
| 6 Design/hardening | Identity/favicon, responsive/focus/motion polish, stable test rendering, browser/Lighthouse | Accepted 2026-10-28; docs/PHASE_6.md |
| 7 Content/integration | Stages below | In progress; docs/PHASE_7.md |

### Phase 7 stages

| Stage | Result | Gate/status |
|---|---|---|
| 7A | Source inventory, objective taxonomy/course mapping, community audit, dedup/storage decisions | Accepted; docs/phase7/SOURCES.md, COVERAGE.md, COMMUNITY_AUDIT.md |
| 7B | Canonical curations, separate banks/formats, v1/schema migration, loading/exposure/quotas with fixtures | Accepted; docs/PHASE_7B.md |
| 7C | Pilot: 12 notes, 36 study cards, 24 test questions, six domains, independent review | Accepted; docs/PHASE_7C.md |
| 7D | Source-first topic batches; final 235 cards/78 notes, v0.4.0 | Accepted; docs/PHASE_7D.md |
| 7E | 300 independently approved original questions, bank v1.0.0 | Accepted 2026-11-03; docs/PHASE_7E.md |
| 7F | Topic feedback, frozen domain results, exact note/card resources and return navigation | Accepted 2026-11-04; docs/PHASE_7F.md |
| 7G | Final integrated content/migration/scoring/accessibility/browser/Lighthouse acceptance | **Ready for final acceptance**; docs/PHASE_7G.md |

7D included early deployment/user administration and chat/digital batches, then eight remaining bundles. User authorized completing all remaining 7D on 2026-11-02, overriding intermediate 7D batch gates only. It did not waive 7F/7G reviews. Old batch/pilot counts are historical.

### Specific 7F implementation

- New: src/topicInsights.ts, TopicStatistics.tsx, topic-statistics.css.
- New: src/testResults.ts, TestDomainResults.tsx, test-results.css.
- Integrated in App.tsx, StatisticsPage.tsx, LibraryPage.tsx, NotesReader.tsx, TestsPage.tsx.
- Focused units: tests/unit/topicStatistics.test.ts and testResults.test.ts.
- Browser: tests/e2e/phase7f-insights.spec.ts.
- Extended populated Lighthouse: scripts/lighthouse-flows.mjs.
- Final fixes: tablet filter overflow; inspector/notice focus before mount; restored plain-Tests attempt losing completed return address.
- Focus now follows committed selection/mounted notice. Attempt URL preserves review state. No new persistent contract.
- Current user feedback belongs to 7F until accepted.

### If 7G is authorized

1. Audit choose pack → assemble deck → review/notes → topic feedback → practice/exam → resources end to end.
2. Verify canonical dedup/deck isolation, annotation/removal/restoration, undo/quotas.
3. Verify manifests/fingerprints/references, gap labels, frozen study/pilot/bank.
4. Recheck v1/v2 imports, migration rollback, snapshots/exposure, failed writes/loads/imports, read-only tabs.
5. Recheck exact-set scoring, quotas, deadlines, abandonment/retry, frozen results and hidden exam answers.
6. Exercise long/missing content, keyboard/focus/drafts, 320/768/1440/1920/2560px in both themes.
7. Run required checks and desktop/mobile Lighthouse with real populated flows; record actual evidence/limits.
8. Fix concrete findings, present final Phase 7 report/working result.
9. Stop for final acceptance. **No automatic deployment.**

The broad 7F checks are evidence, not a declaration that 7G already happened.

## 12. Technology and architecture

Node requirement: **24+**. Declared package versions: React/React DOM **19.3.1**, TypeScript **7.0.2**, Vite **8.3.4**, Dexie **4.4.6**, Zod **4.6.7**, ts-fsrs **5.4.2**, Vitest **5.0.5**, Playwright **1.64.1**. Inspect package.json/lockfile before changing; avoid dependency churn.

Client-side React SPA with hash routing, not a server-rendered framework. No routing/state service framework is required.

| File/area | Responsibility |
|---|---|
| src/domain.ts; validation.ts; questionBankValidation.ts | Contracts, strict schemas/relationships |
| src/storage.ts | Dexie tables, validated loads, transactional schema upgrades |
| src/useWorkspace.ts | Writer Web Lock, persistence coordination, access/busy/error/snapshot |
| src/collectionStorage.ts | Deck/membership/annotation CRUD |
| src/scheduling.ts; studyDay.ts | FSRS adapter, queue/day logic |
| src/reviewStorage.ts | Atomic review/undo/suspension/settings/session mutations |
| src/activeTime.ts; StudyReview.tsx | Active timing/tab checkpoint/review UI |
| src/testEngine.ts; testStorage.ts | Sampling/scoring/snapshots/exposure/test lifecycle |
| src/testMigration.ts; legacyTestValidation.ts | Strict legacy test migration |
| src/portability.ts; portabilityStorage.ts; DataTransfer.tsx | JSON contracts/preview/atomic restore |
| src/App.tsx | Hash routes, nav/status, focus/draft guards, global deadline monitor |
| Study.tsx; DeckManage.tsx; DeckSettings.tsx | Deck overview/manage/settings UI |
| LibraryPage.tsx; CardDetails.tsx; CopyAnnotations.tsx; CardBadges.tsx; library.ts | Library, inspector, personal annotations, Mistakes/metadata |
| src/NotesReader.tsx | Reference/personal documents and exact links |
| src/TestsPage.tsx | Setup/attempt/review/restored routing/deadlines |
| statistics.ts; StatisticsPage.tsx | Activity/heatmap/streaks |
| topicInsights.ts; TopicStatistics.tsx | Current-topic aggregation of saved reviews |
| testResults.ts; TestDomainResults.tsx | Frozen domain outcomes/current canonical resources |
| src/content/catalog.ts; curations.ts | Canonical registry/curated resolution |
| src/content/questionBanks.ts | Manifests/on-demand bank assets |
| src/styles.css + component CSS | Theme/shell/responsive interaction |
| tests/unit/; tests/e2e/ | Unit/content and isolated Edge regressions |
| scripts/; public/ | Compilers/audit tooling; favicon/notices |
| dist/ | Generated production output; never hand-edit |

Database name: tsukiakari. Tables: decks, copies, preferences, schedulerStates, reviewLogs, reviewSessions, testAttempts, testExposures. Schema 2 upgrades old attempts transactionally; invalid upgrades leave prior DB intact. Web Lock name: tsukiakari-writer.

### Hash routes

- #study; #study/review; #study/deck/<encoded-deck-id>
- #library/packs; #library/cards; #library/notes; #library/mistakes
- #tests?bank=ab250-original
- #tests?attempt=<id>; &review=1 for completed exam review
- #library/cards?owner=<canonical-pack>&card=<card-id>
- #library/notes?owner=<canonical-pack>&note=<note-id>
- #library/cards?curation=<curation-id>&topic=<topic-id>
- #library/cards?owner=<canonical-pack>&topic=<canonical-topic-id>
- #statistics; #settings

Never substitute a visible curation ID for canonical owner in stored copies/resources.

## 13. Run/test operations and learner-data protection

### Ports

| Port | Purpose |
|---|---|
| 5186 | Tsukiakari development/user preview |
| 4186 | Tsukiakari production preview |
| 4187 | Isolated browser tests/Lighthouse |
| 4173, 4174, 5173 | Old application; do not touch |

Origins have separate storage. Never seed/clear/import test fixtures into the user's preview collection. Preserve 5186 processes/data; use fresh test contexts on 4187.

### Commands from the correct repository

~~~powershell
Set-Location -LiteralPath 'D:/Coding/tsukiakari'
npm ci
npm run dev
~~~

Preview: http://localhost:5186/. For built preview: npm run build, then npm run preview at http://localhost:4186/.

Behavioral/shared-contract changes require this sequence:

~~~powershell
npm run lint
npm test
npm run build
npm run test:e2e -- --workers=4
~~~

Lint is TypeScript no-emit, not separate ESLint. Edge must be installed. E2E tests use existing dist, so build first. Playwright refuses reuse of an occupied 4187 server.

This host sometimes has no valid default Intl timezone. Verified unit runs used this **process-local** workaround:

~~~powershell
$env:TZ = 'UTC'
~~~

Do not change learner preferences to fix a host test environment.

npm run content:check verifies generated study/pilot/bank. npm run check:browser is a separate foundation FSRS probe, not replacement for regressions.

### Lighthouse

Audit the production build on isolated 4187, without concurrent Playwright/CPU-heavy checks:

~~~powershell
npm run build
npm run preview -- --port 4187
~~~

In another terminal:

~~~powershell
./scripts/lighthouse.ps1
node scripts/lighthouse-flows.mjs '<cached-lighthouse-package-directory>'
~~~
Pinned audit version: **13.6.0**. Observed cache: C:/Users/Kevin/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse (machine-specific). Audit tooling is not an app runtime dependency. Scripts/report docs describe caching the pinned CLI.

Nine navigation routes × mobile/desktop, including real-bank loading. Populated desktop dark 1440px / mobile light 390px flows cover notes/review/practice/exam/topic resources/return navigation. Snapshots measure accessibility/best practices, **not performance**.

Archive per-phase reports because reports/lighthouse is overwritten. Include keyboard and visual checks. Automated scores do not prove all accessibility or content accuracy.

Current advisory limits: large JS chunk/deferred-catalog warning; JS 968.15 kB / 256.31 kB gzip. Local SPA robots.txt fallback yields SEO 91; hosting/crawler policy deferred. Do not suppress warnings or cherry-pick audits to claim perfection.

## 14. Superseded instructions and stale-document traps

| Historical request/prose | Current accepted decision |
|---|---|
| Prior-site background | Fresh implementation; copy nothing from old project |
| Source-specific community pack | Purposeful shared curations; source is provenance |
| 300 questions per exam-enabled pack | One independent 300-question bank shared by certification curations |
| Always additive click selection | Normal replaces; Ctrl-click toggles/extends |
| Checkboxes in card lists | Checkbox-free row selection |
| Pagination/notes as card browser | Scrolling lists; document-oriented Notes |
| Fixed 1/3–2/3 or small 260–360px list | Wider 300–560px adaptive list, flexible inspector, full-width Library |
| Compact heading/200–250px start mandatory | Later requested normal full heading supersedes that target |
| Study/Add in Manage | Removed; use Study/Library |
| Visible Attempt history | Removed; internal records retained |
| Abandon removes exposure | Current v2 retains exposure, discards unfinished answers/no score |
| Anki .apkg | Not needed |
| ZIP transfer required | JSON accepted/implemented; ZIP unnecessary |
| Local persistence means localStorage-only | IndexedDB/Dexie plus JSON portability |
| Nightly server scheduling | Client computes queues/quotas on demand |
| Personalized FSRS optimizer now | Standard parameters; retain logs for later |
| Combine test mistakes with flashcard Mistakes | Separate test-domain vs flashcard feedback |
| “Stats/tests future” in early scheduling docs | Both implemented later |
| “No legacy migration” | No old-site migration; Tsukiakari v1 migration required |
| Earlier phase ready/unstarted/counts | Historical checkpoint, not current gate/inventory |

docs/PLAN.md retains historical per-pack banks, old exposure deletion and height targets. docs/PHASE_7.md, BACKUP_FORMAT.md, later user decisions and current implementation supersede those sections. SCHEDULING/DESIGN/early reports have historical future-tense references. Do not treat them as missing work or erase baseline history.

## 15. Documentation/evidence to consult

Recommended order:

1. Root AGENTS.md — current rules and gate.
2. This handoff — consolidated user intent/current state.
3. README.md — running and user-facing workflows.
4. docs/PHASE_7.md and PHASE_7F.md — current stages/delivered review.
5. docs/DESIGN.md — maintained style/interactions.
6. docs/SCHEDULING.md — exact adapter/review rules.
7. docs/BACKUP_FORMAT.md — v1/v2 data/migration contracts.
8. CONTENT_AUTHORING.md, docs/phase7/REVIEW_PROCESS.md — independent evidence/publication.
9. docs/phase7/COVERAGE.md, SOURCES.md, COMMUNITY_AUDIT.md, objective-coverage.csv, source-gaps.json.

Latest evidence: reports/phase7f/checks.json, lint.log, unit.log, build.log, browser.log, preservation-result.json, summary.json, navigation reports, populated-dark/light HTML/JSON and 20 screenshots.

Historical: docs/PHASE_1.md through PHASE_6.md; PHASE_7B.md, PHASE_7C.md, PHASE_7D_1.md, PHASE_7D_2.md, PHASE_7D.md, PHASE_7E.md. Independent ledgers/generated coverage under docs/phase7/. Never report historical test counts as new runs.

Original chat screenshots were clipboard PNGs under C:/Users/Kevin/AppData/Local/Temp/. Those paths may expire and are not runtime assets. This document records their design/format intent, not the original images. Repository screenshots show current implementation.

## 16. Open decisions and exclusions

- **Now pending:** the user's final Phase 7 acceptance of 7G, then any hosting decision.
- Hosting, deployment, crawler policy and actual small-group access controls remain undecided.
- No auth/account/cloud-sync/CMS project authorized.
- Matching/drag-drop and FSRS optimization deferred.
- Five explicit source/depth gaps remain; no completeness/passing claim.
- Additional subjects/packs need scoped approval, not automatic generation.
- Mentioned dump not incorporated; current bank is original sourced practice.
- ZIP/Anki interoperability not required.
- Do not ask user to personally fact-check every question.
- Known 7G limits are listed in docs/PHASE_7G.md, including no real-device testing and 104 items reviewed by the lead.
- This documentation request changes no app behavior or phase approval.

## 17. Next-agent checklist and continuation prompt

Before editing:

- Confirm correct repository, read its AGENTS.md, inspect current implementation and local instructions.
- Establish what user is approving now; handoff is not Phase 7 acceptance.
- Preserve learner data, IDs/revisions, source gaps, snapshots and approval evidence.
- Read owning implementation and a nearby meaningful test.
- Delegate bounded ownership; lead integrates.
- Use isolated ports and protect user preview.
- Make compatible focused changes, not unrelated refactors.
- Run required checks/Lighthouse for changes; state exactly what ran or was blocked.
- Present working result for review. No unapproved phase advance/commit/push/deploy.

Suggested message to paste with this file:

> Read the attached Tsukiakari handoff and D:/Coding/tsukiakari/AGENTS.md. The correct project is D:/Coding/tsukiakari, not d365-pa-study-desk. Preserve the fresh design, learner data and approved content. Phases 1–6 and 7A–7F are accepted; 7G is implemented and awaiting my final acceptance. Use multiple agents with bounded ownership, protect my preview and run required tests/Lighthouse for changes. Do not commit, push or deploy. First summarize the current gate and continue only the work I authorize next.

If the other agent cannot access this local repository, provide source/project files as well as this handoff. The Markdown is context, not implementation. Learner data is not in Git: transfer personal study history only through a deliberate full JSON export/import. Do not send private backups merely to provide coding context.
