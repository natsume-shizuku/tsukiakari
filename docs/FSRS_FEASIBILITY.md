# FSRS dependency feasibility — Phase 1

Reviewed 2026-10-20. This is a dependency probe, not a study scheduler.

## Pin, model, and license

- Installed and exactly pinned npm package: `ts-fsrs@5.4.2`.
- Runtime metadata: `v5.4.2 using FSRS-6.0`. The library version and FSRS model version are different identities.
- The shipped README identifies FSRS-6; the standard parameter vector contains 21 weights. Omitting custom weights uses those defaults.
- Upstream `main` now documents the v6 API and FSRS-7. Do not copy that API into the pinned v5 adapter or silently upgrade the model.
- The installed package has no runtime dependencies. Its ESM entry has no Node built-in imports, `process`, `Buffer`, or `require` dependency. Build tooling uses Node, while the probe itself needs only browser JavaScript.
- The installed MIT license is copyright © 2026 Open Spaced Repetition. Redistribution must retain its copyright and permission notice. Preserve the full license text with distributed third-party notices; no account, paid license, server, or addon is required to run this dependency.

Primary references: the installed package's `package.json`, `README.md`, `LICENSE`, and `dist/index.d.ts`; [official source repository](https://github.com/open-spaced-repetition/ts-fsrs). The installed release is authoritative for this implementation.

## Probe and evidence

`checkFsrsCompatibility()` imports the pinned ESM package, creates a synthetic new card at `2026-10-20T12:00:00.000Z`, and previews two outcomes without accessing storage. With 90% desired retention, standard weights, fuzz disabled, learning steps `1m, 10m, 1h`, and relearning steps `10m, 1h`:

- Again is due at `12:01:00Z`.
- Right maps to FSRS **Good** and is due at `12:10:00Z`.

The probe rejects non-finite, past, or unordered fixture dates. Unit coverage checks pin/model metadata, standard weights, deterministic outputs, unchanged input, distinct outcomes, finite memory state, and JSON round-tripping of cards and review logs. Serialized dates are explicitly rehydrated through the package's conversion helpers before reuse. The JSON test covers trusted fixtures, not untrusted import validation.

Run `npm test -- tests/unit/fsrs.test.ts` for these checks. A real-browser smoke check must additionally load this module through Vite and invoke it without Node shims; unit execution alone is not evidence of browser support. The lead's isolated IIFE build and Edge smoke check provide that evidence without product debug controls. The phase completion report records the browser/build checks actually run.

## Phase 2 boundary

This probe remains independent feasibility code. The approved Phase 2 implementation now lives in src/scheduling.ts, src/studyDay.ts, and src/reviewStorage.ts; see SCHEDULING.md for the application policy.

On Phase 2 approval, use a dedicated adapter to translate independent learning-copy state to/from FSRS cards. Save application review events, complete before/after states, library/model/parameter versions, and review timing so later optimization remains possible. Use standard parameters initially; parameter optimization is explicitly deferred.

The package's rollback helper cannot alone undo application counters, leech actions, session position, or statistics; application undo must restore the whole atomic review. The application must also validate imported numbers and timestamps before invoking FSRS. Version upgrades require a separate compatibility review and regression checks.
