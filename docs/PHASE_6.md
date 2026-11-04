# Phase 6: design and hardening

Authorized 2026-10-27; resumed and verified 2026-10-28. Implementation and verification are complete and ready for user review. Phase 7 content is being drafted by the user and has not been installed or changed.

## Changes

- Retained the approved full-width main pages, sidebar/mobile navigation, Library panes, and compact centered review panels.
- Added consistent pointer hover states, field focus, legible metadata, tabular counters, themed scrollbars, robust long-text wrapping, and a matching crescent favicon. Reduced-motion preferences remain respected; selection feedback is immediate.
- Restored keyboard focus after cancelling a JSON import, clearing the final personal note, or removing the final deck card. Existing draft guards and save-failure behavior remain intact.
- Exposed note/deck metadata as accessible descriptions, corrected the brand's accessible name, and preserved the Notes heading hierarchy when mobile controls are hidden.
- Practice and completed tests no longer run their own once-per-second clocks. Active exams retain deadline updates and cross-route finalization; answer lookup uses a memoized map.
- Deferred footer rendering during storage initialization to avoid the initial mobile layout shift. Heatmap instructions now describe stronger color rather than assuming dark cells mean more activity.

No database, backup, scheduling policy, content-schema, or study-pack changes. No commit, push, hosting, authentication, or deployment work.

## Checks

The integrated suite covers failed saves/import rollback, deck isolation, deadlines/reload, Ctrl-selection, draft guards, focus restoration, 44px controls, reduced motion, and long content. Responsive checks include 320, 768, 1440, 1920 and 2560px in both themes.

Typecheck, all 216 unit tests (15 files), production build, and all 83 browser regressions passed. Screenshots of desktop/mobile readers, Statistics and long review answers were visually inspected.

All 16 final Lighthouse navigation audits completed successfully on the verified production bundle. Accessibility/best-practices/SEO columns show mobile / desktop.

| Route | Mobile performance | Desktop performance | Accessibility | Best practices | SEO |
|---|---:|---:|---:|---:|---:|
| study | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| packs | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| cards | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| notes | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| mistakes | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| tests | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| statistics | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |
| settings | 99 | 100 | 100 / 100 | 100 / 100 | 91 / 91 |

All eight populated snapshots (four screens in each tested theme/device combination) scored 100 for accessibility and best practices. Mobile cumulative layout shift was 0 on every final navigation audit, including Statistics and Settings, which improved from 0.149 in the first pass. Full reports: [desktop Study](../reports/lighthouse/study-desktop.report.html), [mobile Study](../reports/lighthouse/study-mobile.report.html), [populated dark](../reports/lighthouse/populated-dark.html), [populated light](../reports/lighthouse/populated-light.html).

These local lab scores are observations of this build, not guarantees for future hosting or real content.

## Lighthouse method and limits

Lighthouse 13.6.0 runs against the production build at isolated http://localhost:4187, using fresh temporary Edge profiles. Navigation audits cover Study, each of the four Library tabs, Tests setup, Statistics and Settings under the default simulated-mobile and desktop presets. Snapshot audits additionally exercise revealed flashcards, a personal-note editor, a published note document, and a 100-question practice test with a revealed response in desktop dark and mobile light themes. Snapshot audits measure accessibility/best practices, not load performance.

HTML/JSON reports are local artifacts in reports/lighthouse (gitignored). The CLI matrix uses scripts/lighthouse.ps1; populated snapshots use scripts/lighthouse-flows.mjs with the cached lighthouse package directory as its argument. Install/cache the pinned CLI with `npm exec --yes --package=lighthouse@13.6.0 -- lighthouse --version`, build, and run `npm run preview -- --port 4187` in another terminal before auditing. Do not run the E2E server concurrently on that port. Reports record scores without imposing a pass threshold.

SEO remains a hosting follow-up: the local SPA preview returns HTML for robots.txt. No crawler policy or public indexing decision has been made. The approximately 599 kB / 176 kB gzip JavaScript bundle retains an advisory about unused route code and source maps. Concise composite-row labels can also produce Lighthouse's unweighted label-content advisory; primary visible titles remain in names, with deck/status metadata available as descriptions. Review rating names remain Again/Right while visual intervals are supplementary. These advisories are retained in the reports rather than hidden or suppressed.

Lighthouse may warn about IndexedDB because the application initializes its database while the new profile is being audited. No user collection is imported into these runs. Localhost results do not validate future hosting access controls, HTTPS, cache headers or network latency. Real-content performance must be checked again after Phase 7 packs are available.

## Review gate

Review the working preview before approving Phase 7 implementation. The user can continue drafting content in parallel; this phase does not accept or publish it automatically. See DESIGN.md for the maintained interface conventions.
