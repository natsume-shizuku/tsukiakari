# 月明かり · Tsukiakari

A quiet place for daily learning. Tsukiakari is a small-group study website with Anki-style spaced repetition, sourced reference notes and certification practice tests. It runs entirely in the browser, on desktop or phone, and keeps each learner's data on their own device.

The first subject is **Dynamics 365 Contact Center** and the **AB-250** certification.

> **Status:** Phases 1–6 and 7A–7G are accepted. [Phase 8](docs/PHASE_8.md), the AB-250 exam simulator, is in progress. Nothing is deployed. [AGENTS.md](AGENTS.md) holds the current gate.

## What it does

- **Study:** build personal decks from whole packs or individual cards, then review with Again and Right. Scheduling uses FSRS-6 through ts-fsrs, and every setting and daily allowance is per deck.
- **Library:** browse packs and cards, read sourced notes, keep personal notes and tags per deck, and revisit flashcard Mistakes.
- **Tests:** take practice tests with optional answer reveal, or timed exams with a saved deadline, five questions at a time with page buttons and flags for review. Finished tests can be filtered to wrong or skipped questions, and Retry missed starts a practice test of just those. Results are broken down by domain and link to related notes and cards.
- **Statistics:** see daily reviews and active time, a yearly heatmap, streaks and per-topic flashcard feedback.
- **Settings:** set the theme and study-day start, and move data between browsers with JSON export and import or an optional Google Drive backup.

Test results never affect flashcard schedules, Mistakes, leeches or review statistics.

## Optional Google Drive backup

Learners can save their full backup to a hidden app folder in their own Google Drive and restore it on another device. The browser talks to Google directly, so there is no server, tokens stay in memory, and the site owner never sees the data. Saving only happens when someone clicks it. Until a client ID is configured, Settings shows this as a Coming soon placeholder and nothing contacts Google.

To turn it on:

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project and enable the Google Drive API.
2. Set up the consent screen and add the `https://www.googleapis.com/auth/drive.appdata` scope.
3. Create an OAuth client of type **Web application**, and add the site's origin under **Authorized JavaScript origins**, such as `https://natsume-shizuku.github.io`.
4. Copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID`. The client ID is public, not a secret.

To try a client ID without rebuilding, set `localStorage['tsukiakari.driveClientId']` and reload.

## Run it locally

Requires Node.js 24 or later.

```powershell
npm ci
npm run dev
```

Open http://localhost:5186.

| Port | Used for | Command |
|---|---|---|
| 5186 | Development and user preview | `npm run dev` |
| 4186 | Production preview | `npm run build`, then `npm run preview` |
| 4187 | Isolated browser tests and Lighthouse | Started by `npm run test:e2e` |

Each port is a separate browser origin with its own learner data. Ports 4173, 4174 and 5173 belong to an older, unrelated application, so leave them alone.

## Checks

Run these in order. The browser tests use the existing `dist` output and need Microsoft Edge.

```powershell
npm run lint
npm test
npm run build
npm run test:e2e -- --workers=4
```

- `npm run lint` is a TypeScript no-emit check. There is no separate ESLint step.
- `npm run build` runs `npm run content:check` first, so stale or unapproved content blocks the build.
- `npm run check:browser` is a separate FSRS probe in Edge. It doesn't replace the browser tests.

Lighthouse is also required for changes. See the [Phase 6 report](docs/PHASE_6.md) for the audit commands.

## Content

All published material is maintained in this repository. Learners assemble decks and add personal notes and tags, but they don't author cards.

| Study pack | Cards | Notes | Purpose |
|---|---:|---:|---|
| D365 Contact Center — Implementation | 157 | 78 | Core practical recall |
| AB-250 — Certification Preparation | 235 | 78 | Every card, organized by exam domain |
| AB-250 — Advanced Scenarios | 78 | 75 | Application and troubleshooting |

These packs are views of one canonical collection of 235 cards and 78 notes, so adding overlapping packs to a deck never duplicates a card or resets its progress.

**AB-250 — Original Practice** is a separate bank of 300 original questions (225 single-answer, 75 multiple-answer) covering all six exam domains. Every answer has Microsoft references and an explanation for each choice. These are original practice questions, not real exam items.

The material maps to 117 of 119 tracked objectives. That shows reviewed evidence, not mastery or a passing guarantee. The remaining gaps are listed in the [gap register](docs/phase7/source-gaps.json) and explained in the [coverage notes](docs/phase7/COVERAGE.md).

To add or change content, follow [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md) and the [review process](docs/phase7/REVIEW_PROCESS.md). Published files under `src/content/published/` are generated, so don't edit them by hand. Changes to tested meaning need a new revision and independent re-review.

Engineering fixtures, such as the arithmetic test bank, exist to exercise the software and aren't study material. Learners don't see them: to browse them, set `localStorage['tsukiakari.showFixtures'] = 'on'` and reload. Browser tests set this for you, and fixture cards already saved in a deck keep working without it.

## Data and privacy

Learner records live in the browser's IndexedDB, through Dexie. There are no accounts, cloud sync, telemetry, service worker or offline/PWA features.

- **Clearing site data deletes that browser's records.** Use Settings → Data and transfer to keep a backup.
- **To move to another browser or phone,** export a full backup and import it there. A full import replaces that browser's collection after a preview and a safety export. There is no merge or automatic sync.
- **Full backups are unencrypted** and include private notes and history. Treat them as personal files, and keep them out of this repository.
- **Deck exports aren't backups.** They carry the deck's name, settings and card references, but no progress or notes.
- **Only one tab can write at a time.** Other tabs stay read-only until the writer closes and they reload.
- **Failed or corrupt storage is reported** and never silently reset.

See [BACKUP_FORMAT.md](docs/BACKUP_FORMAT.md) for the file format.

## Hosting

No hosting is set up, and access control is undecided. GitHub Pages is one possible destination, but a private repository doesn't make a deployed site private.

## Project layout

| Path | Contents |
|---|---|
| `src/` | React app, storage, scheduling and test engine |
| `src/content/` | Authored bundles and generated published content |
| `tests/unit/`, `tests/e2e/` | Vitest and Playwright (Edge) suites |
| `scripts/` | Content compilers and audit tooling |
| `docs/` | Design, scheduling, data format and phase reports |
| `reports/` | Local audit output, with only compact per-phase results tracked |

Git stores every file byte for byte (see [.gitattributes](.gitattributes)), because accepted content must stay byte-identical. Screenshots, logs and Lighthouse reports under `reports/` are local only, so links to them from the phase reports work only on the machine that produced them.

## Documentation

| Document | Covers |
|---|---|
| [AGENTS.md](AGENTS.md) | Project rules, invariants and the current approval gate |
| [AGENT_HANDOFF.md](AGENT_HANDOFF.md) | Full project brief, decisions and continuation notes |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual design and interaction conventions |
| [docs/SCHEDULING.md](docs/SCHEDULING.md) | Review and scheduling rules |
| [docs/BACKUP_FORMAT.md](docs/BACKUP_FORMAT.md) | JSON backup formats and compatibility |
| [CONTENT_AUTHORING.md](CONTENT_AUTHORING.md) | Authoring and publishing content |
| [docs/PHASE_8.md](docs/PHASE_8.md), [docs/phase8/EXAM_BLUEPRINT.md](docs/phase8/EXAM_BLUEPRINT.md) | Current phase and exam blueprint |
| [docs/PHASE_7.md](docs/PHASE_7.md), [docs/PHASE_7G.md](docs/PHASE_7G.md) | Phase 7 plan and final report |
| [docs/PLAN.md](docs/PLAN.md) | Original specification, partly superseded by later decisions |
| [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) | Dependency notices |

Earlier phase reports in `docs/` keep their walkthroughs and test counts as historical records.
