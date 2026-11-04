# Phase 5: portability and statistics

Authorized 2026-10-27. Implementation and verification are complete and ready for user review. Stop for user review before Phase 6.

## Delivered

- Settings → Data and transfer provides full, settings and deck-selection JSON exports and validated import previews.
- Full restore requires a current safety backup and confirmation, replaces atomically, preserves saved identities/history, and never merges collections.
- Deck selection creates independent fresh copies without personal notes or progress. Settings apply only to matching deck IDs and preserve learning records.
- Failed or invalid imports leave existing data unchanged. Missing published material is retained and identified; valid cards in mixed decks remain studyable.
- Statistics provides daily review count/time and average time per review, lifetime and seven-study-day totals, yearly heatmap, date inspection, deck filter, daily average, days-studied percentage, and current/longest streaks.
- Historical activity uses the saved study-day label. Current-day boundaries use the configured timezone/hour. Undone reviews, tests and browsing are excluded; active time comes from committed review durations, which exclude idle/background/paused time.

## Definitions and limits

Yearly averages divide by every elapsed calendar day from January 1 through today, or the full past year. Current streak remains active if yesterday was studied and today has not yet been studied. Longest streak uses all retained history. Removed and archived card history counts until permanently deleted.

JSON export/import supports files up to 100 MB. Full restore replaces this browser's state; there is no automatic sync or cross-device merge. Published content is provided by the website. Full backups retain saved review/test sessions but do not transfer the tab-local elapsed-time checkpoint for an unfinished card. Imported exams keep their original deadlines. Files from the old site or Anki are unsupported.

## Verification

Typecheck, 216 unit tests across 15 files, and production build passed. All 77 integrated browser regressions passed in isolated Edge contexts on port 4187 with four workers. New coverage verifies full replacement and failed-write rollback, fresh deck import privacy, settings matching, read-only access, statistics/undo, safety-backup invalidation, and expired-exam restore. Responsive checks cover 320, 768, 1440, 1920 and 2560 pixels in both themes; desktop Statistics and mobile Settings/Statistics screenshots were visually inspected. Build emits the existing bundle-size advisory (approximately 598 kB JavaScript / 176 kB gzip).

## Review

Open http://localhost:5186/#statistics and http://localhost:5186/#settings. Test exports and imports in a separate browser profile if you want to preserve your current preview collection. No learner records were seeded or cleared on development port 5186 or the original website during automated testing. Browser tests use isolated port 4187.

Phase 6 was subsequently approved and delivered for review; see PHASE_6.md. No commit, push or deployment is included.


## Review refinement: consistent page width
All main pages now fill the available workspace width, with the same 24px desktop and 16px narrow-screen horizontal padding as Library. The Statistics date controls and daily summary are centered as a group; the summary is centered when stacked on mobile.
