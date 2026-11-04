# Phase 7F: learning feedback and reference links

**Ready for Phase 7F review.** Implemented 2026-11-04 after the user accepted 7E. This stage connects flashcard topic feedback and separate test-domain results to the current teaching material. Phase 7G remains unstarted; stop for 7F review. No commit, push or deployment is authorized.

## Learner experience

Statistics now includes **Flashcard topics**. The default is the past 30 saved study days, including today; All time is available. Choose a study-pack view, use the existing Deck filter, or sort by higher Again rate. Every topic shows review count, Again, Right, Again rate and distinct reviewed cards. Untouched topics say Not studied and show no fabricated rate. The sample size stays visible so a single difficult review is not presented as a mastery judgment.

All-material totals group once by current canonical topics; selecting a study pack uses its current topic mapping. Repeated reviews count separately, while the same canonical card reviewed in two decks counts once in Distinct cards. Logs retain their saved study-day labels across timezone changes. Undone, future and invalid-day logs and all tests are excluded. Retained history for removed cards counts; unavailable published cards have an explicit bucket. Topic titles open the corresponding Card browser filter.

Completed practice and exam reviews now show **Results by domain** using the domain IDs, titles and question keys saved with that attempt. Each domain shows correct, wrong and skipped counts and a denominator. Practice also separates answers revealed during practice and correct answers without reveal. Multiple-answer grading remains exact-set, one point per question. Active exams reveal neither domain outcomes nor study links; completed exams show them after Review exam.

Expand a domain's Study resources or a revealed question's Related study material to open current reference notes and their related cards. Canonical owner plus note/card ID determines the destination; a missing reference is explained rather than replaced with an unrelated item. The question's original answer, explanation and source snapshot stays unchanged. Current learning material is labelled separately from that snapshot.

Resource navigation opens the exact note document or the card's Answer tab with keyboard focus. Browser Back returns to the same saved attempt; completed exam review stays open without repeating its results dialog. Automatically resumed tests receive a stable attempt URL. Existing unsaved-edit guards remain in force when moving among notes, cards, deck copies and pages.

## Scope and preservation

There are no database, backup, scheduling or content-schema changes. All calculations derive from existing saved logs and attempts. Tests remain separate from flashcard Mistakes, leeches, daily allowances, heatmap and FSRS. No attempt-history page was added.

The accepted collection remains **235 cards and 78 notes**, with the separate **300-question original bank**. The 24 pilot question objects and ten study/pilot/coverage artifacts remain byte-identical to their accepted baseline. The compiler verifies all bank approvals and publication fingerprints. See [preservation evidence](../reports/phase7f/preservation-result.json). Known source gaps remain recorded in [the existing register](phase7/source-gaps.json).

Work was delegated across topic aggregation/UI, test-domain aggregation/resources, browser regression coverage and independent integration review. The lead owned routing, draft/focus integration and final validation. Independent review caught a restored-test return-route gap; browser checks caught tablet filter overflow and inspector focus timing, all corrected before completion.

## Validation

- `npm run lint` passed. [Log](../reports/phase7f/lint.log).
- `npm test` passed: **327 tests across 27 files**. Process-local `TZ=UTC` handles this host's missing default Intl timezone; learner preferences were unchanged. [Log](../reports/phase7f/unit.log).
- `npm run build` passed, including all content approval/publication gates. JavaScript is 968.15 kB (256.31 kB gzip); the unchanged bank remains a separate 701.12 kB asset (121.61 kB gzip). Existing Vite large-chunk and deferred-catalog warnings remain. [Log](../reports/phase7f/build.log).
- `npm run test:e2e -- --workers=4` passed: **128 Edge browser tests** on isolated port 4187. New cases cover saved-day windows, deck scope, canonical distinct counts, undo, reveal assistance, partial multiple-answer sets, frozen domain titles, missing references, exact resource destinations, focus and draft guards. Restored plain-Tests URLs and browser Back/Forward retain the correct completed attempt; exam review stays open after returning from a reference. Existing import/export, failed-write, read-only, deadline and scheduling regressions also pass. [Log](../reports/phase7f/browser.log).
- All 20 topic/results screenshots were reviewed at **320, 768, 1440, 1920 and 2560 px in both themes**. No clipping or overlap defects were found. Examples: [desktop topics](../reports/phase7f/phase7f-topics-dark-1440.png), [tablet filters](../reports/phase7f/phase7f-topics-light-768.png), [320 px topics](../reports/phase7f/phase7f-topics-light-320.png), [320 px results/resources](../reports/phase7f/phase7f-results-light-320.png), [wide results](../reports/phase7f/phase7f-results-dark-2560.png).
- Lighthouse 13.6.0 completed **18 navigation audits**: performance **100 desktop / 94–98 mobile**, accessibility **100**, best practices **100**, SEO **91** throughout. The Statistics route scored 100 desktop / 97 mobile; the real-bank cold-loading route scored 100 / 96. [Summary](../reports/phase7f/summary.json), [desktop Statistics](../reports/phase7f/statistics-desktop.report.html), [mobile Statistics](../reports/phase7f/statistics-mobile.report.html).
- All **58 populated snapshots** scored **100 for accessibility and best practices**. These include an actual saved flashcard topic review, revealed questions, expanded study resources, exact note/card destinations, 100-question exams, frozen domain results and returning to exam review. [Desktop flow](../reports/phase7f/populated-dark.html), [mobile flow](../reports/phase7f/populated-light.html), [complete structured checks](../reports/phase7f/checks.json).

Browser failures during development identified tablet filter overflow and focus scheduled before new inspector/notice content mounted. Both were fixed and the complete suite rerun successfully. An additional focus assertion initially targeted a non-focusable child rather than its status paragraph; that test now checks the actual focused notice. Independent review also caught and fixed the restored-attempt URL gap. No checks remain blocked.

SEO 91 remains the existing local-preview robots.txt fallback; hosting/crawler configuration is deferred. Populated snapshots assess accessibility and best practices, not performance; laboratory scores vary by device and run. No scheduling, storage, backup or published content changed. No commit, push or deployment occurred. The isolated audit server was stopped; the development preview remains available on port 5186.

## Review walkthrough

1. Open [Statistics](http://localhost:5186/#statistics). Study a card with Again and another with Right, then compare the Deck filter and Past 30 study days/All time. Open a topic title to inspect its cards.
2. Open [the original AB-250 bank](http://localhost:5186/#tests?bank=ab250-original), start practice, reveal an explanation and follow Related study material. Back returns to the saved practice.
3. Complete the attempt and inspect Results by domain, including skipped and revealed samples. Expand the resources for a domain, read a note, open a related card and return.
4. Complete an exam, choose Review exam, follow a study reference and use Back. The recorded answers, domains and score remain unchanged. Test outcomes never enter flashcard Mistakes.
5. Try the flows on mobile and in both themes. Existing personal-note drafts must still require Save/Discard before leaving.

Stop for Phase 7F review. Phase 7G remains the final integrated acceptance stage and requires separate authorization.
