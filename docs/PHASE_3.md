# Phase 3 review: full-width browser and content-first readers

Updated 2026-10-26. Phase 3 awaits user review. Phase 4 has not started.

## What changed

All Library tabs fill the desktop workspace with 24px side padding. The wider Card browser list is clamp(300px, 32%, 560px), with a 16px gap and an inspector taking the remaining width. Both panes use the viewport space below navigation and controls. Search remains visible; advanced filters start collapsed and show an active count. Selection controls occupy their own row and never overlay the reader. Checkbox-free selection and bulk add/remove remain available.

The shared inspector in Card browser, Manage, Mistakes, and related-card dialogs now has a compact deck/status/actions header and Answer, My notes, and History tabs. Only the active content area scrolls. Answer contains the question, choices, answer, explanation, sources, and collapsed reference notes. My notes holds the editor and Save/Discard controls. History combines schedule and saved reviews without a second nested scroller. Tab changes retain drafts; changing cards, copies, or routes protects unsaved edits. Failed writes retain the editor. Removed copies never silently switch to another deck.

Manage contains only management workflows. Study/Continue and Add cards were removed. The compact heading shows deck name, count, Close, and Settings/Cards navigation. Settings scrolls independently. Cards keeps its search and selection controls above independently scrolling panes. Below 900px it shows the list or inspector; Back to cards restores selection, list position, and focus. View selected card reopens the preserved inspector.

Notes is a document with a hideable 260–320px title index. Search stays visible and counted filters collapse. Index entries show title/type and personal-note deck name, without repeated body previews. Documents use page scrolling and show title/metadata, text, sources, and collapsed Related cards. Personal annotations edit inline; Save returns to reading and Discard restores saved text. Published notes remain read-only. Mobile Back restores the index position and focus.

The desktop sidebar and mobile top navigation remain. Existing deck creation, scheduling, undo, archive/deletion, removed-card restoration, and Mistakes behavior are preserved. No database, scheduling, backup, or content schema changed. The two fixture packs still contain 124 cards and 42 reference notes; no real packs or exam pool were added.

## Verification

- `npm run lint`: passed.
- `npm test`: 136 tests passed across 10 files, including catalog/schema and stable identity checks.
- `npm run build`: passed. Existing bundle-size advisory remains (approximately 549 kB minified / 163 kB gzip JavaScript).
- `npm run test:e2e -- --workers=6`: all 52 browser regressions passed on isolated port 4187.
- Coverage includes persistent drafts across tabs, failed-write retry, confirmed copy changes, no-copy states, no fallback after removal, deck isolation, add/remove/restore, keyboard navigation, focus restoration, mobile Manage and Notes Back behavior, and existing scheduler/storage safeguards.
- Layout checks cover 320, 768, 1440, 1920, and 2560px in dark and light themes. Wide-screen growth benefits the inspector; controls do not overlap panes. Long answer text is injected only into an isolated test DOM to stress scrolling; source content and learner records are unchanged. Long personal notes use the normal editor.
- Visual inspection covered desktop/mobile card readers, MCQ choices, long answer/notes layouts, Notes documents, and management. Empty search and unavailable personal-data states are covered by browser assertions.
- Fixed hidden badge labels escaping their scroll container, which had produced excess document height. A regression checks document scroll bounds as well as horizontal overflow.

## Review the result

Open [Card browser](http://localhost:5186/#library/cards). Select a card and try Answer, My notes, History, and Card actions. Compare it on a wide screen. In Study, open Manage and try Cards. In Library → Notes, hide the index, expand Related cards, and edit a personal annotation inline.

Three agents implemented the inspector, Notes, and management with separate file ownership. The lead integrated draft handling, width/scroll behavior, and regressions. No commit, push, deployment, or Phase 4 work was performed.


Library uses one compact title and tab bar across Study packs, Card browser, Notes, and Mistakes, with 20px desktop / 16px mobile top padding. The global phase header is removed; saving, read-only, and error status stays with Settings in the navigation. Cards and Mistakes place search, filters, counts, and the destination selector (where applicable) in a compact toolbar above a stable selection row. Success confirmations stay within the controls, while storage errors and read-only notices remain prominent. Reading panes use the remaining viewport height; Notes retains normal document scrolling. This is the default Library layout, without a separate focus mode.


Card selection follows the same rule in Card browser, Manage → Cards, and Mistakes: a normal click selects only that card, while Ctrl-click toggles membership in a multiple selection. Re-clicking the sole selected card preserves its inspector and unsaved draft. Clear selection and Select all remain explicit toolbar commands.


## Compact Library verification — 2026-10-26

Typecheck, all 136 unit tests, production build, and all 52 browser regressions pass. The compact layout was checked at 320, 768, 1440, 1920, and 2560px in both themes. Desktop Card browser and Mistakes panes begin within 250px of the viewport top and remain stationary through zero, single, and Ctrl-multiple selections and add confirmations. Expanded filters occupy normal layout space. Long deck names, sidebar storage error/read-only states, failed note saves, draft protection, and existing review workflows pass. Screenshots were visually inspected for mobile, tablet, and wide desktop Cards, Notes, and Mistakes. An older mobile assertion was updated to allow main to begin directly after navigation now that the global bar is removed.

Three delegated agents handled Library controls, Notes alignment, and targeted layout regressions; the lead integrated navigation/status placement and verification. The local review server responds on port 5186. No database/content/backup changes, commit, push, deployment, or Phase 4 work.
