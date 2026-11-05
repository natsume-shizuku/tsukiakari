# Tsukiakari JSON format, version 2

Every file has format: "tsukiakari", version: 2, exportedAt (Unix milliseconds), and kind (full, deck, or settings). Unknown versions, fields, invalid identities and invalid relationships are rejected before writing. Both file import and export support up to 100 MB. JSON is not encrypted; full backups include private notes and learning history.

## Full

kind: "full" contains workspace with decks, copies, preferences, schedulerStates, reviewLogs, session (or null), testAttempts, and testExposures. This is a complete replacement, not a merge. IDs and saved scheduling/version metadata, undone audit entries, one-level undo, review session state, test questions/answers/sources, and deadlines are preserved.

Cross-record validation rejects duplicate IDs, duplicate deck/pack/card membership, dangling deck/copy references, inconsistent undo, conflicting review sequences, invalid recorded study days, and multiple unfinished tests. Historical study days must match their own saved timezone and day boundary, not the current collection preferences. Existing corrupt local data is never silently reset.

The UI requires a current safety download and acknowledgement before full replacement. A changed workspace invalidates that acknowledgement. All tables are replaced in one IndexedDB transaction; failure rolls back clears and writes. Restoring restarts the deadline monitor so expired imported exams finalize normally. The tab-local unfinished-card timing checkpoint is cleared rather than attributed to the imported session; committed review durations are retained.

Published Library packs, notes and sources are supplied by the website and are not embedded in full backups. Test snapshots are embedded because historic results must remain reviewable against their original answer keys. Missing published references are retained and excluded from study queues; other available cards remain usable.

## Deck selection

kind: "deck" contains deck: {name, settings, cards:[{packId, cardId, contentRevision}]}. Removed membership is excluded. No deck/copy learner IDs, personal notes, tags, schedules, logs, sessions or test records are exported. Import creates a new deck and new learning-copy IDs every time, with empty personal data and no schedule. Exported deck settings are retained. Existing decks are untouched, including a deck with the same name.

## Settings

kind: "settings" contains preferences and decks:[{id,name,settings}]. Preferences include theme, saved timezone and study-day boundary. Deck settings apply by permanent ID, never by name. Unknown deck IDs are listed as skipped in the preview and do not create decks.

Changed deck settings retain progress/history but end that deck's active review session and undo eligibility, matching ordinary settings edits. A timezone or study-day boundary change ends the active review session and undo eligibility globally. Existing schedule due dates, historical study days and tests are unchanged.

## Compatibility

Version 1 Tsukiakari JSON remains importable for full backups, deck selections, and settings. Validation runs against the strict original shape before migration. Legacy single-answer test snapshots become independent bank snapshots with a one-element correctOptionIds array; selectedOptionId becomes selectedOptionIds (empty when unanswered). Original question identities, answer keys, sources, results, deadlines, and learner annotations are retained. Legacy domains are explicitly unclassified and missing per-option explanations are identified rather than invented. No migration from the old website or Anki packages is supported. No online services, uploads or synchronization are involved.


## Version 2 test records

New tests snapshot independent question-bank identity/version, domain title, question revision, options, correctOptionIds, per-option explanations, and sources. Multiple-answer questions score one point only when the selected set exactly matches the frozen correct set; partial selections are wrong and empty selections are skipped. Historical snapshots are validated without requiring their content to remain installed.

Full backups retain testExposures, one latest timestamp per bank/question, including abandoned attempts. Abandonment removes the unfinished responses and records no score; exposure helps prioritize unseen and least-recent questions in subsequent tests. Version 1 migration derives exposures from its retained attempts; previously abandoned v1 questions cannot be recovered.

The browser database upgrades from schema 1 to 2 transactionally. Invalid legacy attempts or multiple unfinished tests reject the upgrade, leaving the original database version, records, and indexes intact. Full replacement includes the exposure table in the same rollback-protected transaction. Deck selection and settings exports do not contain test exposure.

Curated pack views resolve to permanent canonical packId/cardId references before export. Adding the same card from two curated views does not create duplicate membership. Neither curated views nor downloadable banks are embedded as installed content in a learner backup.
## Google Drive backup

Save to Drive writes the normal full backup to `tsukiakari-backup.json` in the hidden `appDataFolder`, using only the `drive.appdata` scope. Each save replaces that one file. Restore feeds the file through the same validation, preview and safety download as a local import, so a damaged or unsupported file changes nothing.

Each browser remembers in `localStorage` which Drive copy it last saved or restored. If Drive holds any other copy, Save warns before replacing it, which protects a good backup from a new or out-of-date device. There is no merging or automatic sync.
