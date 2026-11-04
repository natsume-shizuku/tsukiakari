# Phase 4: practice tests and timed exams

Authorized 2026-10-26. Implementation and verification are complete and ready for Phase 4 review. Phase 5 remains unstarted and requires separate approval.

## Scope

Tests provides explicit setup, practice answer reveal, absolute exam deadlines, scored completion, results review, same-question retries, and persisted attempt history. The setup defaults to 100 questions and 120 exam minutes, with a minimum of 50 questions and no duplicate questions within an attempt. New attempts prioritize unseen questions, then least recently used questions, using retained history for the selected pack.

The standalone Engineering test preview contains 300 arithmetic software fixtures. It is excluded from the Library catalog, remains fixture=true and examEnabled=false, and is accessible through an explicitly labelled preview path. No real study packs or exam preparation material were authored in this phase.

## Data and behavior

The existing testAttempts IndexedDB table stores all attempt snapshots and exposure history. No database version change or additional service is needed. Loading validates question identity, options, sources, responses, timestamps, and saved totals. Only one unfinished test is permitted. Test operations do not alter flashcard copies, schedules, logs, or review sessions.

Practice reveal freezes that question's saved response, including skipped responses. Completed attempts are immutable. Exam answers cannot be revealed until completion; expiry uses the stored absolute deadline and accepts only the previously saved responses. The writer finalizes expired attempts across routes and on reopen. Failed writes keep the previous data and allow explicit retry; secondary tabs remain read-only.

Results use every question in the percentage denominator and retain correct/wrong/skipped counts. Retry creates a new attempt from the same immutable snapshots, with responses and reveals reset. Historical review uses saved sources and answers even if the current catalog changes.

## Verification

Verified on 2026-10-26:

- Typecheck: npm run lint passed.
- Unit tests: npm test passed, 184 tests across 13 files.
- Production build: npm run build passed. Vite reports its bundle-size advisory for the approximately 572 kB JavaScript chunk (169 kB gzip); this does not block the build.
- Browser regressions: npm run test:e2e -- --workers=4 passed all 62 tests in isolated Edge contexts on port 4187.
- The preceding eight-worker run passed 61 tests and timed out in the existing closed-tab Web Lock release check. That check passed three isolated repeats before the complete four-worker run passed. No lock or persistence behavior was changed to hide the timeout.
- Responsive checks cover 320, 768, 1440, 1920, and 2560 pixels in both themes, with keyboard selection, touch targets, and no horizontal overflow. Screenshots of desktop/mobile question forms, setup, and the exam results dialog were visually reviewed.
- Failure checks cover answer drafts and navigation protection, failed reveal/submission, expired-exam finalization with explicit retry, reload/closed-site deadlines, secondary read-only tabs, immutable retry snapshots, unseen-question preference, and separation from flashcard data.

Failed answer saves retain the selected option and provide a Go to unsaved answer control that restores focus to its retry action, including questions far down the form. No learner data in the development preview or the original website was seeded or cleared by these checks.

## Next gate

Present Phase 4 for review and stop. Phase 5 (JSON portability and statistics) remains unstarted. No deployment, commit, or push is part of this phase.


## Review correction: question layout

Question numbers and prompts now sit inside the question panel with explicit spacing, instead of using a legend across its top border. The choices retain a labelled fieldset for keyboard and screen-reader access, and multiline prompts wrap within the panel.


## Review correction: abandon unfinished tests

Added confirmed Abandon test actions to the active attempt and resume panel. Successful abandonment deletes only the unfinished attempt and its answer/exposure records, records no score, and returns to setup. Completed history and flashcard data stay unchanged. Canceling or a failed deletion keeps saved data and unsaved answer drafts available; secondary tabs cannot abandon. Removed per-question Clear answer and the repeated reveal-lock message.

Verification for this correction on 2026-10-27: typecheck passed, 187 unit tests passed, production build passed (existing bundle-size advisory), and all 64 browser regressions passed with four workers.


## Review correction: stable saves and page layout
Answer saves no longer toggle native disabled styling on every test option. Transient saves retain focus and appearance while guarded handlers prevent overlapping writes; permanent read-only, revealed, completed, and expired states remain locked. Recovery controls appear only after a failed save, not during the save-to-state handoff. Mobile storage status reserves stable space.

Success confirmations are scoped to the originating navigation visit, including saves completing after navigation. The footer uses remaining space on short ordinary pages and follows long content. Attempt history UI is removed while saved attempts remain for question exposure. Tests and Library use the standard main-page heading style; Library retains its full-width layout and adaptive pane sizing.

Verification for these refinements on 2026-10-27: typecheck, 187 unit tests, production build, and all 69 browser regressions passed. Slow-save checks confirm stable option opacity, focus, and geometry at 320px and 1440px. Layout coverage includes both themes from 320px to 2560px; the updated Library and Tests headings were visually reviewed.
