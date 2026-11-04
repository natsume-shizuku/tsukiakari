# Phase 1 review — 月明かり / Tsukiakari

Status: accepted by the user. This report records the Phase 1 handoff; Phase 2 was subsequently approved and is documented in PHASE_2.md.

## Delivered
- Independent project at D:\Coding\tsukiakari with a private natsume-shizuku/tsukiakari GitHub repository connected as origin.
- Fresh React/TypeScript/Vite application and new foundation theme; nothing copied from the old website.
- Four-area hash navigation (Study, Library, Tests, Statistics), Settings utility, responsive 320px-to-desktop layouts, dark/light/system preference.
- Normalized Dexie database with strict Zod contracts and separate published identities versus per-deck learning copies.
- A deliberately small persistence exercise: create a named deck and add four engineering fixture cards; repeated adds are idempotent and different decks receive independent copies.
- Browse fixture questions, explanations, sources, and reference notes. No review results are recorded by browsing.
- Single-writer Web Lock, read-only secondary tabs, transactional saves, persistent timezone/preferences, visible non-destructive failure states.
- An isolated FSRS dependency probe, never connected to learner state. Pinned ts-fsrs 5.4.2 / FSRS-6.0 with standard parameters; future Right maps to Good.
- Production dependency licenses retained in public/third-party-notices.txt and included in built output.

## Checks actually run
| Check | Result |
|---|---|
| npm run lint | Passed (TypeScript no-emit) |
| npm test | Passed: 41 unit/content tests in 3 files |
| npm run build | Passed, production dist generated |
| npm run test:e2e | Passed: 11 Microsoft Edge browser tests |
| npm run check:browser | Passed: separate bundled FSRS probe executed in Edge |
| Local preview readiness | HTTP 200 at http://localhost:5186 |
| Visual review | Desktop 1440px and mobile 390px screenshots inspected |

Browser coverage: persistent decks/copies, no accidental review history, routes/sections, appearance, read-only tab takeover after browser lock release, failed-write retry, post-commit read failure blocking, corrupt-state preservation, and overflow checks on all main pages at 320/390/768/1440px.

The independent agent review identified two issues that were repaired: initial timezone had not been saved until changing appearance, and post-commit read failure allowed further writes against stale state. Targeted regressions now cover both. Initial browser-test failures were resolved by waiting for the browser's actual lock release on tab close and installing fault injection before Dexie captures the native transaction method.

## Review instructions
1. Open http://localhost:5186 (development preview). The preview starts with no seeded personal decks.
2. Create a deck on Study.
3. Open Library and add the clearly marked fixtures.
4. Create a second deck and add the same fixtures. Each deck contains its own 4 copies.
5. Refresh and verify the saved deck contents.
6. Explore Cards/Notes and Settings; change appearance.
7. A second tab is read-only until the writer closes and the second tab reloads.

The in-app preview tab is left open. Opening another tab in the same browser profile will correctly show read-only access until the first writer is closed.

## Boundaries and limitations
- This is a foundation preview, not a working spaced-review/exam release.
- No actual scheduling, undo, leech processing, tests, heatmap, statistics, JSON transfer, or approved study packs are implemented yet.
- Fixture content is only for exercising contracts and cannot enable exams.
- Mobile tests resize Edge; physical Android/iPhone and Safari/Firefox have not been tested.
- No hosting, deployment, accounts, telemetry, offline/PWA, old-content migration, or cross-device synchronization.
- Repository was created private and connected, but source remains local and uncommitted; no push was performed.
- This preview's browser data is not important study data and has no backup UI until Phase 5.

## Next phase — only after explicit approval
Phase 2 implements per-deck FSRS review state transitions, learning/relearning steps, daily allowances and 5 a.m. rollover, atomic review saves, undo, and leech/suspension behavior. Stop here for the user's review and decision.

## Agent contributions
- Data agent: validation, fixtures, normalized storage, and 37 focused tests.
- Interface agent: navigation, responsive CSS, local UI state, tab locking, error handling, and visual review.
- Feasibility/review agent: FSRS probe, 4 focused tests, and independent integration findings.
- Lead: project/repository setup, contracts, documentation, licenses, 11 browser tests, browser probe integration, final build, and review handoff.
