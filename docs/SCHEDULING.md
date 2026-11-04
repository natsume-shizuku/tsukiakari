# Scheduling behavior — Phase 2

## Day and queue

Each deck has its own daily allowances: 20 new introductions and 9999 Review-stage answers by default. Learning and relearning answers do not consume the review allowance. Unused allowances do not carry forward. Undo removes the undone answer from both counts.

A study day begins at 05:00 in the saved collection timezone. The timezone is captured on the first successful learner mutation; travel or a device timezone change does not silently change it. At 04:00 activity belongs to the preceding study day. No server or nightly job is needed: the queue is computed from saved records and the current time whenever viewed or advanced. Refreshing a page does not replenish a quota.

Due learning/relearning steps take priority, then due Review cards, then new cards. Steps already underway remain available with either daily limit set to zero. Overdue reviews remain due. Suspended cards are excluded. Each deck's copy of a published card is independent.

## FSRS policy

The exact dependency is ts-fsrs 5.4.2, implementing FSRS-6.0 with its standard 21 weights. Right maps to Good; Again maps to Again. Desired retention defaults to 90%. Fuzz is disabled for deterministic intervals in this version. No parameter optimizer is included.

The installed library measures elapsed days at UTC midnight. The adapter instead expresses saved study-day dates as synthetic UTC dates for that calculation. This keeps the standard memory calculations aligned with the user's 05:00 day boundary. Learning/relearning delays remain exact elapsed minutes; long-term Review due dates fall at 05:00 on the computed due day, including daylight-saving transitions. Persisted last-review and event timestamps are always the real instants.

Learning defaults to 1m, 10m, 1h. On a new card, Again schedules 1m and Right advances to 10m; further Right answers progress through 1h and then long-term Review. Relearning defaults to 10m, 1h after a Review-stage lapse. Configurable steps are strictly increasing whole minutes, 1–1439 per step, up to 20 steps. Shortening steps clamps an existing step index for the next answer rather than silently graduating an Again answer.

Changing settings affects future answers; it does not rewrite existing due dates or historical events. Saving changed deck settings ends that deck's active queue and clears its last-review undo eligibility. Other decks are unaffected.

## Reviews, undo, and suspension

An answer saves its schedule, learning copy, review event, and next session turn in one transaction. Duplicate or stale submissions cannot record an answer twice. Wrong multiple-choice responses must be rated Again; correct responses may be rated Again if uncertain. Revealing a card is saved separately and is not a review event.

Undo is one level, survives reload, and restores the previous card and its revealed answer, schedule, quota effects, and leech effects. The undone event remains as an audit record and is excluded from future activity calculations. A second undo cannot undo an earlier event. Starting another deck, changing scheduling settings in the reviewed deck, or manually changing suspension in that deck ends undo availability.

Only Again from the Review state increments the leech lapse count. Initial learning and relearning failures do not. At the default tenth review lapse, the copy receives the leech tag and is suspended. Tag-only keeps it in the queue. Manually unsuspending preserves memory state, lapse count, and the tag; another qualifying lapse at or above the threshold can suspend it again. This is visible in the interface.

The interface records active time only while the review is visible and focused, with a 30-second inactivity cutoff. A tab-local sessionStorage checkpoint retains the current card’s accumulated time through pause, navigation, and reload. Denied sessionStorage or a crash may lose unfinished timing; completed review records remain in IndexedDB. Hidden or paused time is excluded. Statistics are a later phase, but review data is retained now.

## Data retained

Every event retains the rating, actual timestamp, study-day label/timezone/boundary, active duration, content revision, deck settings, algorithm/library/model/parameter-policy versions via complete before/after states, learning-copy snapshots, and session snapshots. This supports later statistics, backup export, and parameter optimization without collecting new history from scratch.

Tests and exams will keep separate attempt records. They never alter these schedules, logs, quotas, leech counts, or flashcard Mistakes.

## Phase 3 collection changes

Scheduling settings are edited from each deck’s Manage page. Removed cards and archived decks are excluded from study without deleting their schedules or logs. Re-adding the same card restores the same learning copy, so removal cannot replenish daily allowances. Archive/removal expires that deck’s undo; removal closes the active session only when its current card is removed. Annotation changes expire only the edited copy’s undo and preserve the current revealed answer.
