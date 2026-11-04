# Coverage and taxonomy — Phase 7

Initial taxonomy inventory: 2026-10-28; pilot review: 2026-10-30. Final 7D inventory: 78 unique notes and 235 unique study cards (157 core recall / 78 application), plus the unchanged, separate 24-question pilot. Implementation selects 157 core cards, Certification Preparation all 235, and Advanced Scenarios 78 application cards. These are shared curations, not duplicate learning identities.

Sourced notes and useful cards map to 117 of the 119 tracked objectives. Health Agent enablement and a distinct supervisor app setup remain source-blocked; three further partial-depth gaps remain visible in [source-gaps.json](source-gaps.json). These counts establish scoped evidence, not mastery, exhaustive skill coverage or complete certification preparation.

Final independent approval, publication, typecheck, 289 unit tests, build, 121 browser regressions and Lighthouse passed. Results are recorded in the [full Phase 7D report](../PHASE_7D.md). The compiler generates the [item-level study coverage audit](study-coverage.json) from exact approved records. The [batch 2](../PHASE_7D_2.md) and [batch 1](../PHASE_7D_1.md) reports retain their historical inventories and checks.

## Three purposeful packs

| Visible pack | Learning purpose | Content policy |
|---|---|---|
| D365 Contact Center — Implementation | Configure and operate a contact center; understand prerequisites and implementation choices | Task-oriented selection of shared concepts; implementation first, not exhaustive developer/API reference |
| AB-250 — Certification Preparation | Prepare against official objectives, using course paths for teaching order | Shared concepts organized by exam domain; gaps explicitly tracked |
| AB-250 — Advanced Scenarios | Apply knowledge to harder decisions and troubleshooting | New applications, not copies of core recall facts; community ideas require primary evidence |

The source provider is provenance, not the pack's identity. An identical card or note belongs to one canonical registry entry even if multiple packs include it. Curations and learning copies are different things.

## Exam coverage inventory

Authority: [official study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250), displayed update 2026-05-15, accessed 2026-10-28. Counts describe the observed guide, not guaranteed future scope. The linked CSV reserves a traceable row for each current objective; original wording remains at the official source.

| Domain | Official range | Groups / objective bullets | Bank target |
|---|---:|---:|---:|
| D1 Deployment | 15–20% | 3 / 15 | 51 |
| D2 Channels | 30–35% | 3 / 46 | 96 |
| D3 Agents and AI | 10–15% | 2 / 16 | 36 |
| D4 Work distribution | 10–15% | 2 / 15 | 36 |
| D5 Representative experience | 15–20% | 3 / 16 | 51 |
| D6 Analytics | 10–15% | 2 / 11 | 30 |
| Total | — | 15 / 119 | 300 |

Internal subgroup locators below follow source order; they are editorial IDs, not Microsoft IDs. A reordered guide requires explicit remapping, not silently reusing positional IDs.

| Group | Short locator | Bullet count | Main course path |
|---|---|---:|---|
| D1.1 | Implementation | 7 | Implement |
| D1.2 | Deployment | 4 | Implement |
| D1.3 | Users | 4 | Implement |
| D2.1 | Chat/digital | 13 | Channels |
| D2.2 | Voice | 7 | Channels |
| D2.3 | Channel features | 26 | Channels / Empower / Monitor |
| D3.1 | Agent assist | 6 | Empower |
| D3.2 | Voice agents | 10 | Channels |
| D4.1 | Queues | 5 | Implement |
| D4.2 | Routing | 10 | Implement |
| D5.1 | Experience profiles | 5 | Empower |
| D5.2 | Productivity | 6 | Empower |
| D5.3 | Knowledge | 5 | Empower |
| D6.1 | Supervision | 5 | Monitor |
| D6.2 | Reporting | 6 | Monitor |

The [objective tracking CSV](objective-coverage.csv) retains one traceable row for each objective. Final 7D evidence spans 117 rows; two remain blocked on sufficient current configuration sources. Each evidence ID resolves to an editorial record in `src/content/pilot/` or `src/content/batches/` and an independent review ledger under `docs/phase7/`. The generated [coverage audit](study-coverage.json) checks that mapped objectives have both notes and useful cards and lists explicit gaps. A mapped item supports its reviewed claim, not every possible feature within that objective. Final integrated audit results passed and are recorded in the full phase report.

## Course teaching map

The four course paths have16 module landing pages in total. These are teaching paths, not the six exam domains. Path/module declared scope is not claim-level verification of every unit.

| Path and source | Modules in teaching order | Editorial mapping |
|---|---|---|
| [Implement](https://learn.microsoft.com/en-us/training/paths/implement-dynamics-365-contact-center/) | Introduction; core capabilities; queues; routing | Foundation, deployment and distribution |
| [Channels](https://learn.microsoft.com/en-us/training/paths/configure-channels-dynamics-365-contact-center/) | Chat/digital; voice; advanced channel settings; voice agents | Channels plus voice AI |
| [Empower](https://learn.microsoft.com/en-us/training/paths/empower-service-representatives-contact-center/) | Workforce management; workspace profiles; productivity; knowledge; AI/Copilot | Experience and AI; workforce also maps into channel objectives |
| [Monitor](https://learn.microsoft.com/en-us/training/paths/monitor-optimize-dynamics-365-contact-center/) | Supervisor operations; proactive engagement; analytics | Analytics and cross-cutting operational topics |

## Practical topic taxonomy

Use stable kebab-case topic IDs and human-readable labels. These topic IDs now organize the shared study collection; exam-domain curations retain their separate official taxonomy.

| Topic ID | Learner outcome |
|---|---|
| architecture-deployment | Choose a deployment model and recognize dependencies |
| users-security | Configure appropriate access and personas |
| lifecycle-management | Plan configuration movement and controlled rollout |
| routing-capacity | Select queues, routing and capacity behavior for a requirement |
| chat-digital | Configure digital interactions and context |
| voice-telephony | Understand telephony topology, provisioning and transfers |
| copilot-ai | Configure assistance/self-service and understand limits |
| representative-workspace | Shape sessions, templates and productivity |
| knowledge-management | Supply and govern useful knowledge |
| supervision-analytics | Diagnose and measure service operations |
| workforce-management | Understand staffing configuration and dependencies |
| proactive-engagement | Configure outbound engagement within applicable constraints |

Controlled facets: topic; feature; task (design/configure/operate/troubleshoot); exam domain/objective where relevant; applicable deployment/channel when needed. Source IDs and review state are editorial metadata, not learner tags. Personal tags stay independent. Do not add tags that imply a preview is generally available.

## Original authoring estimates (historical)

The following Phase 7A estimates record the initial planning exercise, not the final 7D inventory or quotas that justify padding. Source review and duplicate removal determine the actual granularity. Final 7D has 78 notes and 235 cards; an individual card may support several objectives.

| Core domain | Shared reference notes | Core flashcards | Exam questions |
|---|---:|---:|---:|
| Deployment | 9 | 30 | 51 |
| Channels | 26 | 92 | 96 |
| AI | 10 | 32 | 36 |
| Distribution | 9 | 30 | 36 |
| Experience | 10 | 32 | 51 |
| Analytics | 8 | 22 | 30 |
| Core total | 72 | 238 | 300 |
| Advanced additions estimate | 18 | 60 | Uses shared bank |

Core estimate starts near two focused cards per objective, then merges true duplicates and splits overly broad concepts. The practical pack selects roughly 160–200 applicable core cards; exact membership follows source review. Advanced scenarios add roughly 10 substantive cards and 3 notes per domain. Shared items are not counted again per curation. Initial unique inventory estimate: 90 notes / 298 flashcards plus the separate 300-question bank. Additional implementation-only needs may adjust those estimates at batch review.

The pilot's 12 notes / 36 cards / 24 questions are included in final totals. The approved-question floor remains 300, irrespective of draft/rejected volume.

## Remaining source and depth gaps

The [gap register](source-gaps.json) distinguishes missing configuration evidence from sourced material with incomplete depth:

| Objective | Status | Remaining limit |
|---|---|---|
| D1.1.06 | Source-blocked | Health Agent enablement: an exam/release mention does not supply a current configuration procedure |
| D6.1.05 | Source-blocked | A distinct supervisor app setup: current workspace supervisor controls do not establish a separate app procedure |
| D1.1.04 | Partial depth | Retained-provider architecture is sourced; current third-party CCaaS Copilot provisioning is not established |
| D1.1.07 | Partial depth | Service Operations configuration is sourced; autonomous transformation/environment migration is not established |
| D2.2.07 | Partial depth | Related Azure Teams Phone extensibility SDK layers are sourced; the exact Dynamics CCaaS SDK API contract is not established |

The three partial-depth rows have useful sourced notes/cards and are included in the 117 mapped rows. Their unresolved procedures must not be inferred from a broad title, related architecture, manual migration or an adjacent SDK. Preview, region, licensing and deployment prerequisites remain claim-specific. Documentation review is not tenant validation or a claim that every Microsoft page has been read.

## Review boundary

The lead and agents own detailed claim verification and independent review. Present the final 7D collection, explicit gaps and integrated results for the user's learning-experience review. Integrated checks passed; see [Phase 7D](../PHASE_7D.md). Phase 7E has not started: the original 300-question bank remains separate work, and the unchanged 24-question pilot stays a read-only preview.
