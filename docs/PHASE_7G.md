# Phase 7G: final integrated acceptance

**Accepted by the user on 2026-11-05.** First run on 2026-11-04 after the user accepted 7F and authorized 7G, then updated on 2026-11-05 with the [changes below](#changes-since-the-first-7g-run). Later work continues in [Phase 8](PHASE_8.md). Nothing is deployed. Hosting is expected to be GitHub Pages, but it isn't set up.

## Result

The whole product now works as one journey. A learner can choose packs, build decks, study, see topic feedback, take practice tests and exams, follow study links, and move everything to another browser. A new browser test walks that journey in a single session.

Three independent audits covered learner data, the test engine and feedback, and content integrity. They found no data loss, no deck-isolation failure, no hidden-answer leak and no broken content references. They did find eight defects, and visual review found one more. All nine are fixed below. Six have new regression tests: the stuck card, the exam notice, read-only export, quota ties, expired abandon and the typed tag. The lock-flag fix relies on the existing post-commit failure test, and the other two are a documentation correction and a wording fix.

## Defects fixed

| Severity | Defect | Fix |
|---|---|---|
| High | **A card could get stuck.** On a deck's last allowance, such as the 20th new card of the day, re-adding or unsuspending an older card made the card on screen impossible to rate until the next study day. | Limits are now checked as allowances, not queue positions. The card on screen stays ratable, and limits are never exceeded. |
| High | **An exam score could become unreachable.** If time ran out while the learner was on another page, the exam was scored but nothing linked to its result. | A one-off "Exam time ended" notice with **See results** appears on every page until used or dismissed. It is transient and stores nothing, so it is not an attempt history. |
| Medium | **Stale backups from a read-only tab.** A second tab exported what it loaded when opened, stamped as current, so a later restore could lose reviews. | Read-only tabs now read saved data at export time, and report an error if they cannot. |
| Medium | **Domain quota ties broke at nine question counts** because of floating-point remainders, against the approved rule that ties follow domain order. Counts of 50 and 100 were never affected. | Whole-number arithmetic. Saved attempts are unaffected. |
| Low | **An expired exam could be abandoned** after failed finalization, deleting its score. | Abandon is refused after the deadline and disabled while locked. |
| Low | **A typed `leech` tag became a permanent system tag.** | Only review history can create the tag. Typed `leech` is ignored. |
| Low | **A tiny window after a post-commit read failure** could allow a stale retry. | The write lock flag now clears immediately. |
| Low | **`COVERAGE.md` still said 7E had not started.** | Corrected, and it now explains why the frozen CSV lists only pilot questions. |
| Cosmetic | **"1 notes · 3 related cards"**, found in visual review. | Singular and plural are now correct. |

Existing learners may already hold a `leech` tag they typed themselves. It can't be told apart from a real one, so it stays until removed from the data.

## Changes since the first 7G run

The user reviewed the site and asked for these changes. All of them are covered by the checks below.

| Area | Change |
|---|---|
| Tests | Tests in progress show five questions a page, with range buttons, flags, Next unanswered, Next flagged and Finish in a sticky bar. At the user's request, practice can use any count from 1 and defaults to 20, which replaces the plan's minimum of 50 for practice. Exams keep their minimum of 50. |
| Test results | Finished tests can be filtered to wrong or skipped questions. Retry missed starts a practice test of just those, and a missed exam set becomes untimed practice. Test results still never affect flashcards. |
| Saving | Browsers that can't name their time zone fall back to the reported offset instead of failing every save. |
| Study day | Settings can change the start hour and time zone. This ends the active review and clears undo, without rewriting history or due dates. |
| Engineering fixtures | Hidden from learners unless a developer flag is on. Decks that already hold them keep working. |
| Navigation | Links open a page at its top, and Back keeps your place. |
| Library and study | Several cards can be selected without a Ctrl key, cards show readable labels rather than filter tags, dates stay in the site's language, and deck search appears only when there are enough decks to search. |
| Statistics | The activity grid no longer has weekday or month labels. Hovering over or tapping a day shows its date and totals. |
| Google Drive backup | **Placeholder only.** Without a client ID the section says "Coming soon" and never contacts Google. Backups would go to a hidden app folder in the learner's own Drive, only when they ask, under the `drive.appdata` scope. This is a new, narrow exception to the no-cloud rule in `AGENTS.md`. |

## Content and data

- **Counts:** 235 cards (157 recall, 78 application), 78 notes, 12 topics, 183 sources, and 300 questions (225 single, 75 multiple) across 51/96/36/36/51/30. Curations are 157/78, 235/78 and 78/75.
- **Integrity:** 1,307 references checked with none broken, and all 160 distinct source URLs use HTTPS on Microsoft Learn. All 613 authored items match their approval ledgers, with no fingerprint or revision mismatches and no self-review.
- **Re-review:** a separate agent rechecked the 104 lead-reviewed items. 102 were supported, and the other two were revised with the user's authorization. See [the re-review](phase7/7g-independent-rereview.md).
- **Revisions:** `ab250-d4-q06` and `cc-d6-n08` are now at revision 2. A separate agent approved the exact final text of each, after requiring corrections. Saved test attempts keep their own frozen copy of the old question.
- **Preservation:** an item-by-item comparison with the accepted baseline found only those two items, their approval records and the coverage review date. The other 8 of the 12 tracked artifacts are byte-identical, including the curations, pilot, gap register and frozen coverage CSV. See [preservation evidence](../reports/phase7g/preservation-result.json).
- **Gaps:** 117 of 119 objectives remain mapped, and the five recorded gaps are unchanged.
- **Live source check on 2026-11-04:** the official study guide's domains, weights and objective counts match the recorded inventory. All 12 sampled questions are still supported by their live Microsoft pages. 159 of 160 URLs returned 200, and one redirects (see below).
- **Storage:** no database version, backup format, scheduling-algorithm or content-schema changes. Test position and flags stay in the browser, outside the saved attempt.

## Validation

All checks below ran on the delivered code unless noted.

- `npm run lint` passed.
- `npm test` passed: **361 tests across 29 files**, up from 335 at the first 7G run. The earlier `TZ=UTC` workaround is no longer needed.
- `npm run build` passed, including all content gates. JavaScript is 986.91 kB (261.97 kB gzip), and the bank remains a separate 701.15 kB asset (121.63 kB gzip). The existing large-chunk warning remains.
- `npm run test:e2e -- --workers=4` passed: **166 Edge browser tests** on port 4187, up from 135 at the first 7G run.
- At the first 7G run, with the main fixes temporarily reverted, 8 regression tests failed, and they passed again once restored. This covered the stuck card, quotas, expired abandon and the typed tag. The exam notice and read-only export are covered by browser tests, which were not part of that reversal.
- New layout sweeps load nine populated routes, including the longest real note and card, at **320, 768, 1440, 1920 and 2560 px in both themes**. They found no horizontal overflow and no control under 44px at 320 and 768 px.
- Lighthouse 13.6.0 completed **18 navigation audits**: performance **100 desktop / 95–100 mobile**, accessibility **100**, best practices **100**, SEO **91** throughout. All **58 populated snapshots** scored **100** for accessibility and best practices. See [structured checks](../reports/phase7g/checks.json).
- A clean export of the commit passed a fresh `npm ci`, lint, unit tests, build and browser tests. Only this line and its entry in the structured checks were added afterwards.
- Lighthouse ran on the final build. Its journey script was first updated for paged tests, hidden fixtures and the renamed Finish test button, which it had fallen behind.

Screenshots and full Lighthouse reports are in `reports/phase7g/` on this machine only.

## Known limits

Nothing here blocks acceptance, but each is a real limit.

- **Browsers:** testing used Edge with emulated sizes. No real iPhone, Android device, Safari or Firefox was used, so the phone flow should be tried on an actual phone.
- **Independent review:** the 104 lead-reviewed items now have the [separate re-review](phase7/7g-independent-rereview.md), which is an agent pass and not a human expert certification. It lists a few watch items that need no revision. The session that authored the two revisions also integrated them, so they had no separate lead.
- **Sampled facts:** the 2026-11-04 live check covered 12 of 300 questions in depth, and the re-review covered its 104 items. The rest had only source status and update dates checked.
- **Moved source:** `cc-d5-final-s05` and `exam-d5-s05` redirect to a new notification-templates address, and the content still holds. Updating them changes fingerprints, so it needs re-review of `cc-d5-c12`, `cc-d5-n04` and `ab250-d5-q15` to `q17`. The old link still works.
- **Frozen CSV:** the question column in `objective-coverage.csv` lists only pilot questions because the file is part of the accepted baseline. `docs/phase7/exams/coverage.json` holds the complete mapping.
- **Possible rename:** Microsoft's agents overview says "Quality Assurance Agent" where the guide says "Quality Evaluation agent". Published text uses neither name. Whether this is a rename is unverified.
- **New notice:** the exam notice appears only for exams that end after this change, and it clears on reload. It has no populated Lighthouse snapshot, though browser tests cover its layout and controls.
- **No tenant testing:** content was checked against documentation, not a live Dynamics 365 environment.
- **Google Drive backup:** tested only against a simulated Google. Real sign-in needs a Google client ID, which the owner has to create.
- **Release numbers:** the pack stays at 0.4.0 and the bank at 1.0.0 because nothing has been released. Item revisions record the change.
- **Advisory scores:** SEO 91 is the local-preview `robots.txt` fallback, and the large-chunk warning remains.

## Review walkthrough

1. Create a deck, add **Implementation** and then **Certification Preparation**, and confirm the second adds only the 78 application cards.
2. Study a few cards, undo one, then open [Statistics](http://localhost:5186/#statistics).
3. Start a 1-minute exam at [the AB-250 bank](http://localhost:5186/#tests?bank=ab250-original), go to Library, wait for it to end, then use **See results**.
4. Take a practice test, reveal an answer, follow a study link and use Back.
5. In Settings, export a full backup. Open the site in another browser and restore it there.
6. Finish a short practice test, filter its results to wrong answers, then use **Retry missed**.
7. Hover over the activity grid on Statistics.
8. Try the review flow on a real phone.

The user gave final Phase 7 acceptance on 2026-11-05. Hosting is a separate decision, and nothing deploys automatically.
