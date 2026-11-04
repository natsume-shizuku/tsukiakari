# Phase 7D: sourced study collection

The user authorized finishing the remainder of 7D on 2026-11-02, replacing intermediate user batch stops with one final 7D review. Authoring and independent review continued on 2026-11-03. The sourced collection is ready for user review. This report records implementation and known limits; 7E remains unstarted.

## Learning material

The final inventory is **78 notes and 235 unique study cards**: 157 core recall and 78 application MCQs. The final work packages add 54 notes and 163 cards to the accepted 72-card/24-note collection. These counts follow teaching needs rather than the original rough volume estimates.

| Area | New notes/cards | Teaching focus |
|---|---:|---|
| Deployment |4/12| CRM synchronization, embedded desktop readiness, migration scope and target integration checks |
| Digital channels |7/22| Record routing, mobile/web/backend integration choices, conversation state, masking, messages, timeline/CIF and feedback |
| Voice |7/21| Telephony architecture, numbers, calling profiles, capture, transfers and migration boundaries |
| Outbound and workforce |7/21| Consent-aware engagement, campaigns/dialing, staffing plans, shifts, forecasts and external WFM |
| AI |8/24| Assistance, grounding, extensibility, custom smart assist, voice orchestration, security and language/input handling |
| Work distribution |7/21| Queue priorities, overflow/fallback, classification, skills, intent, preferences and diagnostics |
| Representative experience |8/24| Profiles, templates/inbox, productivity, APIs, knowledge governance, external search and portals |
| Analytics |6/18| Supervisor actions, quality evaluation, visual/model customization, embedding and telemetry authorization |

Implementation selects 157 core cards; Certification Preparation all 235; Advanced Scenarios 78 application cards. All three resolve to canonical contact-center-core identities. Adding overlapping curations preserves original learning copies. The collection version is 0.4.0. No installed pilot or earlier 7D card, note or source object was rewritten.

The original exam bank remains a separate 24-question read-only pilot. Normal certification tests still require the later 300-question bank in 7E. The study MCQs above are flashcards, not additions to that bank. No dump or copied exam items were used.

## Source and editorial review

The source registry contains 183 records representing 159 distinct Microsoft Learn URLs. Repeated source URLs retain independent batch provenance. Claims are mapped to specific source sections and applicable deployment/channel conditions; a working link or schema pass does not establish factual accuracy.

Authors and independent reviewers divided the work. The lead reviewed Deployment and Analytics; other agents reviewed foreign bundles. Approval applies to the exact current item, editorial evidence and referenced source objects. Source-reviewed author drafts alone cannot be published.

Review corrections include stronger adjacent alternatives, removal of disclosed diagnoses, varied correct-answer positions, explicit deployment/preview scope, secure-contact evidence, legacy ACS migration boundaries, and a routing-card replacement that avoids duplicating a pilot fact. Revision histories and source checks remain under [batch evidence](phase7/batches/); current decisions are indexed in [approved-content-index.json](phase7/approved-content-index.json).

These are foundational and application study materials. Independent agent review reduces error risk but is not human expert certification, and no actual-exam difficulty or passing guarantee is claimed.

## Coverage and unresolved documentation

The [machine-checked coverage audit](phase7/study-coverage.json) accounts for all 119 tracked objectives. **117 have scoped sourced notes and cards**; this is not a mastery percentage or proof that every subskill is exhaustively taught. Two setup procedures remain explicitly source-blocked:

- **D1.1.06 Health Agent:** the official guide and release notes name it, but sufficient current enablement instructions were not found. No rename, removal or substitute is inferred.
- **D6.1.05 supervisor app:** current workspace supervisor controls are documented; a distinct new app setup was not established from current product instructions. Archived roadmap descriptions do not establish an installation procedure.

Three further depth limits remain: current third-party CCaaS Copilot provisioning, autonomous transformation/environment migration, and an exact Dynamics-specific CCaaS SDK API contract. Related architecture/configuration/TPE material is taught only within its verified scope. See [source-gaps.json](phase7/source-gaps.json) and the author/reviewer reports for investigated sources.

Feature differences matter throughout the material: standalone versus embedded; ACS-backed services versus Teams Phone extensibility; conversation consent versus capture suppression; chat versus asynchronous messaging; visual editing versus semantic modeling; ingestion versus telemetry read authorization. Conflicting older forecast limits and feature status descriptions were not converted into unsupported universal claims.

## Publishing and learner-data preservation

An exact allowlist covers the authorized identities and counts. The publisher verifies the frozen pilot, independent approvals, schema/references, domain mappings and the coverage audit before writing combined outputs. Missing teaching evidence must resolve to a registered research block; a different feature cannot silently fill the blocked objective.

No database, scheduling, test scoring, import/export or learner-data contracts changed. Preservation tests compare all prior published objects and exercise adding the expansion to decks with learned pilot, first-batch and second-batch cards. Notes, tags, schedules, logs, session state and another deck remain intact. Test results remain separate from flashcard mistakes and schedules.

## Validation

- Publication and coverage gates passed: 337 exact independent approvals; 117 objectives with sourced notes/cards and 2 explicit source blocks.
- npm run lint passed.
- npm test passed: 289 tests across 23 files, with process-local TZ=UTC because this execution host has no usable default Intl timezone. No learner timezone changed.
- npm run build passed. The pilot bank retains its prior asset hash. Existing Vite large-chunk and deferred-catalog import warnings remain.
- npm run test:e2e -- --workers=4 passed: 121 Edge browser tests on isolated localhost:4187, including every final domain at 320/768/1440/1920/2560px in both themes. Prior identity, annotations, schedules, sessions, backups, drafts, failures and keyboard behavior remain covered.
- Representative desktop/mobile screenshots were visually inspected. New browser checks verify note prose/references, application choices, no horizontal overflow and independent inspector scrolling.
- Lighthouse 13.6.0 completed 16 navigation audits: desktop performance 100, mobile 97-98; accessibility 100, best practices 100 and SEO 91 throughout.
- All 36 populated snapshots (dark 1440px and light 390px) scored 100 for accessibility and best practices, including notes from every final domain, revealed study, personal-note editing, 100-question practice, multiple-answer selection and the sourced pilot preview. Snapshots do not measure performance.
- Evidence: [navigation summary](../reports/phase7d-final/summary.json), [desktop populated report](../reports/phase7d-final/populated-dark.html), [mobile populated report](../reports/phase7d-final/populated-light.html), [desktop voice note](../reports/phase7d-final/7d-final-voice-note-dark-1440.png), [desktop AI scenario](../reports/phase7d-final/7d-final-ai-card-dark-1440.png), [mobile experience note](../reports/phase7d-final/7d-final-experience-note-light-320.png), [mobile analytics note](../reports/phase7d-final/7d-final-analytics-note-light-320.png).

The first populated audit encountered a writer-lock race caused by the harness navigating its newly opened page twice. Removed the redundant navigation and reran the full populated audit successfully; application behavior and learner data were unchanged. SEO 91 is the existing local-preview robots.txt fallback, with hosting/crawler configuration deferred. These are local laboratory measurements, not a guarantee for every device or network.

The application JavaScript is 951.80kB (252.29 kB gzip), compared with 725.96 kB (205.69 kB gzip) after batch 2. This content increase is measured in the final audits. Exam assets remain separate downloads. Earlier phase reports remain historical evidence; no deployment, commit or push was performed.

## Review walkthrough

1. Add Implementation and then Certification Preparation to one deck; only missing cards should be added.
2. In Notes, read one voice/migration note and one workforce or routing note, then open their related application cards.
3. Read a representative-experience note and the analytics note comparing visual and model customization. Assess teaching depth and whether references explain the answer.
4. Review the two source-blocked procedures and three depth limits above. The user reviews usefulness and learning experience; detailed factual review belongs to the author/reviewer process.

Stop for the full 7D review. Do not start 7E, 7F or 7G, commit, push or deploy automatically.
