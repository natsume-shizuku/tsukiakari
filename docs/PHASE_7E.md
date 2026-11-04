# Phase7E: original AB-250 practice bank

Implemented2026-11-03 after the user accepted7D. **7E was accepted; this report retains its validation evidence.** The user subsequently authorized7F; see the [7F report](PHASE_7F.md) for current integration and review status. No commit, push or deployment is authorized.

## Result

The shared **AB-250 — Original Practice** bank is available from both certification curations and Tests. It contains the frozen24-question pilot plus276 newly authored and independently reviewed questions. The study collection remains235 unique cards and78 notes; no installed study object or learner-data contract changed.

| Domain | Questions | Single | Multiple |
|---|---:|---:|---:|
| Deploy Contact Center |51|38|13|
| Implement channels |96|72|24|
| Configure agents and AI |36|27|9|
| Configure work distribution |36|27|9|
| Representative experience |51|38|13|
| Analytics |30|23|7|
| Total |300|225|75|

Practice defaults to100 questions, with a50-question minimum and optional domain selection. Deployment and representative experience each support up to51; Channels up to96. The three smaller domains explain why individual-domain practice cannot start. Counts are never silently reduced.

Timed exams default to120 minutes and100 questions. The existing17/32/12/12/17/10 quota allocation is now exercised with real content. A50-question exam uses9/16/6/6/8/5 after largest-remainder rounding. These are internal allocation choices, not predictions of actual exam composition. Each question earns one point; multiple-answer questions require the entire correct set.

Fresh tests prefer unseen questions, then least-recently seen. Tests verify that three100-question attempts can cover all300 without repeats, including weighted exams. A finite bank cannot promise unlimited repeat-free tests. Retry uses the same saved snapshots; abandoning removes the unfinished score/answers while retaining exposure.

## Sources, coverage and independent review

The source registry contains182 entries representing148 distinct Microsoft Learn URLs. The current [official study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) governs taxonomy; product documentation supports behavior and applicability. Learn modules support teaching order. The community repository informs scenario style and topic discovery, never an authoritative answer key. No exam dump or copied exam question was used.

All300 questions have an independent approval. New drafts include exact claim sections, applicability, original scenario decisions, explanations for every option and canonical related notes. Reviewers reopened primary sections, challenged alternatives and checked duplicates. Approval fingerprints bind each question revision, editorial evidence and referenced source objects. The frozen pilot retains its existing approvals.

Review corrections included missing outbound caller-ID profile dependencies, ACS-specific capture scope, secure settings across AI/overflow bridged transfers, topic-output contracts, voice authoring versus telephony connectivity, current preview boundaries, diagnosis leakage and weak distractors. Fourteen representative-experience questions received new operating conditions rather than reproducing existing study application scenarios. Related knowledge is intentionally shared between teaching and assessment.

The lexical similarity scan has0 unresolved flags, but manual semantic review caught duplicates it did not flag. Routing q17 was replaced to avoid digital q32 Pick-to-Push duplication; routing q31 now tests basic-rule criteria limits instead of repeating q19 rule ordering; an earlier routing q35 setup repeat became historical rule/state evidence; digital q24 and voice q61 were also replaced. Routing q10 membership diagnosis and digital q29 explicit-transfer outcome were retained after comparing their different operations and required reasoning.

Questions map to117 of119 tracked objective rows. This is scoped evidence, not a completeness percentage, learner mastery or an actual-exam difficulty guarantee. Health Agent enablement and a distinct supervisor-app setup remain source-blocked. Third-party CCaaS Copilot provisioning, autonomous transformation/migration and the exact Dynamics CCaaS SDK contract retain their existing partial-depth limits. The [gap register](phase7/source-gaps.json) is unchanged. See [exam coverage](phase7/exams/coverage.json), [quality metrics](phase7/exams/quality-scan.json), [approval index](phase7/exams/approved-index.json) and individual [review records](phase7/exams/).

## Publication and data preservation

Version1.0.0 retains bank identity ab250-original. Its question/source data is a separate701.12kB asset (121.61kB gzip size), downloaded only when selected. Failed loads offer Retry and do not change learner records. Historical attempts retain their saved question revisions, answers, explanations, domains and source titles/URLs.

The bounded compiler checks the frozen pilot and study collection, every authorized identity/count, app schema, canonical references, selection instructions, independent source reviews and current fingerprints before writing combined outputs. Every production build now runs this exam check transitively through content:check. Stale or manually edited generated bank artifacts cannot pass the prebuild gate.

No database, scheduling, daily allowance, personal annotation or JSON-backup contract changed. Tests remain separate from flashcard Mistakes, leeches, heatmap and FSRS. No attempt-history page, account, cloud service or deployment was added. Byte-level checks confirm ten accepted study/pilot/coverage artifacts are unchanged; see [preservation evidence](../reports/phase7e/preservation-result.json).

## Validation

- All publication gates passed:300 independent bank approvals, canonical references and frozen-content preservation.
- npm run lint passed; [log](../reports/phase7e/lint.log).
- npm test passed:307 tests across25 files. Process-local TZ=UTC addresses this execution host’s missing default Intl timezone; learner timezone/settings were not changed. [Log](../reports/phase7e/unit.log).
- npm run build passed with the exam approval gate enabled. JavaScript951.83kB (252.28kB gzip); bank asset stays separate. Existing Vite large-chunk and deferred-catalog warnings remain. [Log](../reports/phase7e/build.log).
- npm run test:e2e -- --workers=4 passed:123 Edge browser tests on isolated port4187. Includes real-bank failed download/retry, minimum/domain gates, six exam quotas, hidden answers, result review, snapshot retries, source links, exact-set selections, keyboard access, reload and320/768/1440/1920/2560px in both themes. Existing failed-write, draft, readonly, backup, deck-isolation and deadline regressions remain passing. [Log](../reports/phase7e/browser.log).
- Desktop/mobile screenshots were visually inspected, including long explanations and sources. [Desktop](../reports/phase7e/phase7e-dark-1440.png), [320px mobile](../reports/phase7e/phase7e-light-320.png), [wide desktop](../reports/phase7e/phase7e-light-2560.png).
- Lighthouse13.6.0 completed18 navigation audits: performance100 desktop /96–98 mobile; accessibility100, best practices100 and SEO91 throughout. The real-bank cold-loading route scored100 desktop /96 mobile. [Summary](../reports/phase7e/summary.json), [desktop bank report](../reports/phase7e/ab250-desktop.report.html), [mobile bank report](../reports/phase7e/ab250-mobile.report.html).
- All44 populated snapshots scored100 for accessibility and best practices, including sourced practice, multiple-answer explanations,100-question timed exams, results dialogs and exam review. [Desktop flow](../reports/phase7e/populated-dark.html), [mobile flow](../reports/phase7e/populated-light.html), [complete checks](../reports/phase7e/checks.json).

The first populated audit stopped because its unrevealed-question locator moved to another question after reveal. The harness now pins the original question by its stable heading ID; the full44-snapshot rerun passed. Application code and learner data were unchanged. SEO91 remains the existing local-preview robots.txt fallback; hosting/crawler configuration is deferred. Snapshots do not measure performance, and laboratory scores are not guarantees for every device/network. No checks remain blocked; no deployment, commit or push occurred.

## Review walkthrough

1. Open [Tests with the original bank](http://localhost:5186/#tests?bank=ab250-original), or use either certification pack’s bank link.
2. Start100 questions in Practice Mode. Reveal an answer and read every choice explanation and Microsoft reference. Finish and retry the same frozen questions.
3. Start a timed100-question exam. Check the120-minute default, hidden answers until submission, results dialog and Review exam. Abandon an unfinished test to start a fresh one.
4. Try a sufficiently populated practice domain and inspect the explicit limit for a smaller one. Review a representative-experience scenario and an AI/voice or routing scenario against their linked teaching notes.
5. Review the known source gaps above. The user reviews usefulness and learning experience; agents own detailed source-level checking. Independent agent review is not human expert certification or a passing guarantee.

7E was subsequently accepted and 7F authorized. The [7F report](PHASE_7F.md) records topic summaries and test-domain study links. Stop for 7F review before 7G.
