# Phase 7D batch 2: chat and digital channels

Implemented 2026-11-02 after the user accepted batch 1 and authorized this bounded expansion. Ready for review after the checks recorded below. Stop before another study batch or Phase 7E.

## Learning material

Added six notes and 18 cards: 12 core recall cards and six application MCQs. All 24 additions have independent source checks and current approval fingerprints. The authors reviewed 12 source records; the independent reviewer reopened all 12 cited pages and the official AB-250 guide.

| Note | Learner decision |
|---|---|
| Separate chat routing from widget rollout | Share routing deliberately and test a chosen widget version before activation |
| Plan proactive invitations around customer choice | Separate the trigger, invitation wording, survey and acceptance |
| Publish quick replies for the right audience | Check locale, workstream association and administrator/personal ownership |
| Connect the SMS account, workstream and provider callback | Distinguish credential validation from actual inbound delivery |
| Prepare translation logic before enabling the conversation setting | Prepare the service and published JavaScript integration before enabling the documented workflow |
| Check the dependencies behind customer location and self-service history | Check feature eligibility, browser permission and developer-supplied portal history separately |

The catalog now contains **72 unique cards and 24 notes**, with 120 independently approved items including the unchanged 24-question pilot. Implementation selects 48 core cards; Certification Preparation all 72; Advanced Scenarios 24 application cards. The source registry has 64 records representing 62 distinct Microsoft Learn URLs. Duplicate source records preserve independently reviewed batch provenance; overlapping pack views still resolve to one canonical card identity.

The separate exam bank remains the read-only 24-question pilot. Normal tests still require the later approved 300-question bank. No exam items or matching-question features were added here.

## Review findings and scope

The chat bundle passed without revisions. Independent digital review identified two teaching weaknesses: c22 had an implausible alternative, and c24 disclosed its diagnosis. Both were revised to revision 2 and rechecked before approval. c22 now scopes the decision to provider ingress and includes a real routing alternative; c24 supplies observable symptoms and asks which dependency to verify.

- [Chat review and source checks](phase7/batches/7d2-chat-review.md)
- [Digital review and source checks](phase7/batches/7d2-digital-review.md)
- [Digital revision history](phase7/batches/7d2-digital-revisions.json)
- [Current approval index](phase7/approved-content-index.json)

Proactive-chat and self-service examples preserve the documented standalone scope. Translation describes the published web-resource procedure without treating archived roadmap dates as delivery evidence. Visitor location explains the documented legacy Bing Maps eligibility restriction rather than suggesting every new deployment can enable it. Source checks apply to the precise scoped claims; they are not product-wide verification. Independent agent review is not human expert certification. The application cards are introductory to moderate, not a claim of actual exam difficulty. No dump or copied exam items were used.

## Coverage and preservation

Six previously empty objective rows now have material: D2.1.01, .03, .05, .07, .12 and .13. D2.1.04 gains additional widget-rollout material. The [coverage matrix](phase7/objective-coverage.csv) now maps some material to **40 of 119 rows**: 14 study-partial and 26 pilot-partial, with 79 still scope-inventoried. This is not a readiness percentage. Voice, broader digital integrations and SDKs, record channels, and later-domain depth remain incomplete; the earlier Health Agent source gap remains unresolved.

The collection version is 0.3.0 and its owner remains contact-center-core. Tests compare every original pilot and 7D1 card, note and source against the expanded catalog. Learned pilot and 7D1 copies retain notes, schedules, logs, sessions and another deck's state when additions are made. No database, scheduler, persisted contract or backup changes were made.

The explicit batch allowlist now contains the two accepted 7D1 bundles and two new 7D2 bundles. It rejects unknown IDs, invalid references, unapproved or stale/self reviews, and out-of-domain objective mappings. New negative tests cover both domain mismatch and spoofed prefixes.

## Checks

- Typecheck passed.
- All **281 unit tests** passed across 22 files.
- Production build and content checks passed: 24 notes, 72 cards, 120 approvals; pilot bank asset unchanged.
- All **105 Edge browser tests** passed with four workers on isolated localhost:4187.
- Both new bundles have reader/inspector checks at 320, 768, 1440, 1920 and 2560px in both themes, including source visibility, choices, independent scrolling, no horizontal overflow and canonical keyboard study.
- Lighthouse 13.6.0: all16 route audits passed, performance100 desktop /99 mobile; accessibility100, best practices100 and SEO91 throughout.
- All20 populated snapshots (dark1440px/light390px) scored100 accessibility and best practices, including the new chat and translation notes. Snapshots do not measure performance.
- Saved evidence: [navigation summary](../reports/phase7d2/summary.json), [desktop populated report](../reports/phase7d2/populated-dark.html), [mobile populated report](../reports/phase7d2/populated-light.html), [desktop scenario](../reports/phase7d2/phase7d2-chat-card-dark-1440.png), [mobile translation note](../reports/phase7d2/phase7d2-digital-note-light-320.png). Representative screenshots were visually inspected.

SEO91 reflects the existing local-preview robots.txt fallback. Hosting/crawler configuration remains deferred. These are local laboratory scores, not device-wide performance guarantees.

The first unit run failed because this execution host's Intl timezone resolved to undefined. Rerunning the complete check sequence with process-local TZ=UTC passed; no application or learner preference was changed to accommodate the host. Browser tests use isolated contexts.

The application JavaScript is 725.96 kB (205.69 kB gzip). Existing Vite large-chunk and catalog-import warnings remain. The separate question bank retains its prior asset hash. No deployment, commit or push was performed.

## Review walkthrough

1. Open Library → Notes and read “Separate chat routing from widget rollout.” Open its related application card and assess whether the distinction is useful.
2. Read the translation note, then the customer-context note. Check whether prerequisites and deployment limitations are easy to understand.
3. Add Implementation and then Certification Preparation to a personal deck. Shared cards should be recognized and only missing cards added.
4. Try the revised SMS and self-service scenarios in Card browser. Feedback requested is clarity, teaching depth and usefulness; agents have handled the detailed factual checks.

The next batch remains unstarted pending user review. The rest of 7D, exam-bank expansion in 7E and weakness summaries in 7F still require their own work and review gates.
