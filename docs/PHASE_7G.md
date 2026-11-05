# Phase 7G: final integrated acceptance

**Ready for final Phase 7 acceptance.** Run on 2026-11-04 after the user accepted 7F and authorized 7G. Stop here for the user's decision. Nothing is deployed, and hosting and access control remain undecided.

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

## Content and data

- **Counts:** 235 cards (157 recall, 78 application), 78 notes, 12 topics, 183 sources, and 300 questions (225 single, 75 multiple) across 51/96/36/36/51/30. Curations are 157/78, 235/78 and 78/75.
- **Integrity:** 1,307 references checked with none broken, and all 160 distinct source URLs use HTTPS on Microsoft Learn. All 613 authored items match their approval ledgers, with no fingerprint or revision mismatches and no self-review.
- **Preservation:** 12 accepted artifacts remain byte-identical to their baseline, including the study pack, bank, curations, pilot, gap register and frozen coverage CSV. See [preservation evidence](../reports/phase7g/preservation-result.json). No published content, revision, fingerprint or approval changed.
- **Gaps:** 117 of 119 objectives remain mapped, and the five recorded gaps are unchanged.
- **Live source check on 2026-11-04:** the official study guide's domains, weights and objective counts match the recorded inventory. All 12 sampled questions are still supported by their live Microsoft pages. 159 of 160 URLs returned 200, and one redirects (see below).
- **Storage:** no database, backup, scheduling-algorithm or content-schema changes.

## Validation

All checks below ran on the delivered code unless noted.

- `npm run lint` passed.
- `npm test` passed: **335 tests across 27 files**, up from 327. Process-local `TZ=UTC` covers this host's timezone gap.
- `npm run build` passed, including all content gates. JavaScript is 969.10 kB (256.57 kB gzip), and the bank remains a separate 701.12 kB asset (121.61 kB gzip). The existing large-chunk warning remains.
- `npm run test:e2e -- --workers=4` passed: **135 Edge browser tests** on port 4187, up from 128.
- With the main fixes temporarily reverted, 8 regression tests failed, and they passed again once restored. This covered the stuck card, quotas, expired abandon and the typed tag. The exam notice and read-only export are covered by browser tests, which were not part of that reversal.
- New layout sweeps load nine populated routes, including the longest real note and card, at **320, 768, 1440, 1920 and 2560 px in both themes**. They found no horizontal overflow and no control under 44px at 320 and 768 px.
- Lighthouse 13.6.0 completed **18 navigation audits**: performance **100 desktop / 96–98 mobile**, accessibility **100**, best practices **100**, SEO **91** throughout. All **58 populated snapshots** scored **100** for accessibility and best practices. See [structured checks](../reports/phase7g/checks.json).
- Lighthouse ran before the final one-string pluralization fix. Every other check ran after it.

Screenshots and full Lighthouse reports are in `reports/phase7g/` on this machine only.

## Known limits

Nothing here blocks acceptance, but each is a real limit.

- **Browsers:** testing used Edge with emulated sizes. No real iPhone, Android device, Safari or Firefox was used, so the phone flow should be tried on an actual phone.
- **Independent review:** the lead reviewed 104 items (`7d-final-deployment`, `7d-final-analytics`, `7e-ai`, `7e-routing`). None is a self-review, but [the review process](phase7/REVIEW_PROCESS.md) separates reviewer and lead. A fresh agent review of those 104 is possible if wanted.
- **Sampled facts:** the live check covered 12 of 300 questions in depth. The rest had only source status and update dates checked.
- **Moved source:** `cc-d5-final-s05` and `exam-d5-s05` redirect to a new notification-templates address, and the content still holds. Updating them changes fingerprints, so it needs re-review of `cc-d5-c12`, `cc-d5-n04` and `ab250-d5-q15` to `q17`. The old link still works.
- **Frozen CSV:** the question column in `objective-coverage.csv` lists only pilot questions because the file is part of the accepted baseline. `docs/phase7/exams/coverage.json` holds the complete mapping.
- **Possible rename:** Microsoft's agents overview says "Quality Assurance Agent" where the guide says "Quality Evaluation agent". Published text uses neither name. Whether this is a rename is unverified.
- **New notice:** the exam notice appears only for exams that end after this change, and it clears on reload. It has no populated Lighthouse snapshot, though browser tests cover its layout and controls.
- **No tenant testing:** content was checked against documentation, not a live Dynamics 365 environment.
- **Advisory scores:** SEO 91 is the local-preview `robots.txt` fallback, and the large-chunk warning remains.

## Review walkthrough

1. Create a deck, add **Implementation** and then **Certification Preparation**, and confirm the second adds only the 78 application cards.
2. Study a few cards, undo one, then open [Statistics](http://localhost:5186/#statistics).
3. Start a 1-minute exam at [the AB-250 bank](http://localhost:5186/#tests?bank=ab250-original), go to Library, wait for it to end, then use **See results**.
4. Take a practice test, reveal an answer, follow a study link and use Back.
5. In Settings, export a full backup. Open the site in another browser and restore it there.
6. Try the review flow on a real phone.

Stop for the user's final Phase 7 acceptance. Hosting is a separate decision, and nothing deploys automatically.
