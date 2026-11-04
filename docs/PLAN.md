# Approved plan: 月明かり / Tsukiakari

## Approval gate
Phase 6 was accepted on 2026-10-28. The user approved Phase 7 and its internal review gates. 7A and 7B were accepted; the user authorized 7C on 2026-10-30. The user accepted 7C and authorized 7D on 2026-10-31. The user accepted the first deployment/user-administration batch and authorized the next bounded batch on 2026-10-31. The user explicitly authorized finishing all remaining 7D on 2026-11-02, superseding intermediate user batch gates. The user accepted the final7D collection and authorized7E on2026-11-03. The user accepted 7E and authorized 7F on 2026-11-03. Topic summaries and separate frozen test-domain results with study-resource links are ready for review; typecheck, 327 unit tests, 128 browser tests, build and Lighthouse pass. See [the 7F report](PHASE_7F.md). Stop for 7F review before 7G. The detailed current decisions and stage boundaries are in [Phase 7](PHASE_7.md); they supersede historical per-pack exam-bank requirements below. Stop after each stage for review. The agents own item-level factual verification; user reviews representative samples and learning experience. No deployment is authorized.
## Product decisions
- Fresh implementation, content, learner state, and design. Copy nothing from the previous website.
- Private natsume-shizuku/tsukiakari repository. Hosting deferred (likely GitHub Pages); no deployment now.
- Regular responsive website; no offline/PWA support, accounts, sync, telemetry, or Anki package interoperability.
- Four areas: Study; Library (Study packs, Card browser, Notes, Mistakes); Tests; Statistics. Settings is a utility.
- Owner maintains published cards, references, and notes in the repository. Learners only assemble decks and add personal annotations/tags.
- Independent learning copy per deck. Same source card in different decks has separate progress/schedule/personal data. Prevent duplicate membership within one deck.
- Default per-deck settings:20 new/day,9999 reviews/day,learning 1m10m1h,relearning10m1h,90% desired retention,10 review lapses leech threshold,suspend action (tag-only alternative).
- Collection-wide study-day boundary5am and saved timezone (initial device zone). Quotas never accumulate. Overdue cards remain due. Due steps get priority and aren't blocked by review cap.
- Again and Right only. Right maps to FSRS Good. Standard FSRS parameters initially; preserve full logs/version metadata for future optimization (out of v1 scope).
- Atomic saves and Undo last review (including schedule,quota,leech effects). No advancing on failure.
- Mistakes tracks flashcard study only. Tests do not affect FSRS, mistakes, or leeches.
- Browser shows source material/scheduling history; browsing does not score. Distinguish curated notes and personal notes.
- Statistics based on supplied Anki screenshot: daily reviews/time/average, lifetime/week time, year heatmap, daily average, days-studied percentage, streaks. Exclude idle/background duration and distinguish test performance.

## Tests
- One pack per test; default100,minimum50 questions. Each future exam-enabled pack has >=300 original substantively distinct MCQs.
- Unique questions within attempt; unseen then least-recently-used across new attempts. Exposure history retained.
- Don't duplicate or silently reduce requested questions; packs with <50 eligible questions cannot generate tests.
- Practice: optional reveal freezes that response and records reveal status; completion shows all answers/references and correct/wrong/skipped.
- Exam: default120 minutes adjustable before explicit start. Persist absolute deadline, selections, and completion. Time continues through sleep/closing. Expiry finalizes when active or on reopen.
- Submission hides form and shows results dialog, then Review exam reveals frozen form. Percentage denominator includes all questions.
- Retry uses same questions in a new attempt; New test generates new set. Preserve historic question/answer/source snapshots.

## Portability
Full backup JSON includes learning state/settings/decks/logs/session/test snapshots/exposure; deck-selection JSON excludes private progress/annotations; settings JSON separately.
Full restore previews and replaces local collection after safety export. Deck-selection import makes a fresh deck. Website supplies published content; missing references remain identifiable but unstudyable. Validate before atomic writes. No cross-device merge or legacy migration.

## Phases
1. Foundation: fresh project/repo,domain contracts,validated fixture pack,normalized local storage,basic navigation,browser feasibility.
2. Scheduling: FSRS,per-deck limits,learning/relearning,undo,leeches.
3. Study and Library: full deck management/review/browser/notes/mistakes.
4. Tests: selection,practice/exam,timers,results/retry/history.
5. Portability and statistics:JSON imports/exports,heatmap/activity.
6. Design and hardening:complete identity,responsive polish,accessibility,regressions.
7. Fresh content:agree subjects/coverage,author/review sources,>=300 MCQs per exam-enabled pack.

Foundation previews can exercise minimal create/add persistence operations without implementing the complete later workflows. Fixtures stay visibly marked and out of real study packs. Functional structure first; final visual direction in Phase6.

## Team
Lead owns shared contracts/integration/phase reports. Up to3 delegated agents alongside lead, rotating through storage,FSRS,interface,tests,and independent QA. Agree contracts before parallel work. Use separate file ownership and review integration.

## Approved navigation refinement
Desktop sidebar and mobile top navigation retain Study, Library, Tests, Statistics; Settings is a utility. Study is a deck overview with Continue studying and a Create deck dialog. Review uses a dedicated page. Each deck has a Manage dialog with Settings and Cards tabs, opening on Settings. It retains the overview underneath. Library has Study packs/Card browser/Notes/Mistakes tabs. Card browser, deck membership, and Mistakes use checkbox-free row selection: one selection shows inline details, multiple selections show bulk actions. Notes uses a page-scrolling document and hideable title index, with inline personal editing and collapsed related cards. Related-card dialogs are full-screen on small devices. Card browser fills the available desktop width: a 300–560px list and flexible inspector use the remaining viewport height. The shared inspector has Answer/My notes/History tabs, each with one scrolling content area. Manage removes Study/Add actions and uses independent list/inspector panes; mobile Back preserves its list position and selection. Card lists and the notes index use bounded scrolling instead of pagination. Mobile Notes uses a separate reading view with Back to notes. Global Settings holds appearance, study-day preferences and future JSON transfer.


Card selection follows the same rule in Card browser, Manage → Cards, and Mistakes: a normal click selects only that card, while Ctrl-click toggles membership in a multiple selection. Re-clicking the sole selected card preserves its inspector and unsaved draft. Clear selection and Select all remain explicit toolbar commands.


## Compact Library workspace
Library uses one compact title and tab bar across Study packs, Card browser, Notes, and Mistakes, with 20px desktop / 16px mobile top padding. The global phase header is removed; saving, read-only, and error status stays with Settings in the navigation. Cards and Mistakes place search, filters, counts, and the destination selector (where applicable) in a compact toolbar above a stable selection row. Success confirmations stay within the controls, while storage errors and read-only notices remain prominent. Reading panes use the remaining viewport height; Notes retains normal document scrolling. This is the default Library layout, without a separate focus mode. Desktop Cards and Mistakes panes should begin within approximately 200–250px of the viewport top with advanced filters collapsed and no blocking notices. Preserve Ctrl-selection, draft protection, keyboard access, and 44px touch targets. Phase 4 was subsequently authorized on 2026-10-26.


Phase 4 uses a separate, clearly labelled engineering test preview to exercise full-size practice/exam flows before real content authoring. It is not installed in the Library or accepted as an exam-enabled study pack. Real exam-enabled packs still require at least 300 substantive MCQs. One unfinished test is retained independently of any flashcard review; finish or explicitly abandon it before starting another. Abandonment discards the unfinished attempt and its exposure records without recording a score; completed history is preserved. Starting a retry retains the same question snapshots and creates fresh responses; new tests prioritize unseen questions then the least recently used.


## Phase 4 review refinements (2026-10-27)
The Tests setup no longer displays Attempt history. Saved attempts remain available internally for question exposure and future data transfer. Tests and Library now use the full main-page heading style; the taller Library heading is a requested visual comparison and supersedes the earlier 200–250px pane-start target. Full-width Library and adaptive pane heights are preserved. Success confirmations stay on their originating page. Footers on ordinary pages use remaining viewport space without overlaying long content.
