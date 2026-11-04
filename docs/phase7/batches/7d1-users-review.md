# 7D1 users independent review

Reviewer: `/root/d1_operations`; author: `/root/d1_users`. Actual source access and claim review: **2026-10-31**. Reviewed the current bundle, editorial mappings, all seven cited primary pages, the official AB-250 guide and all 36 pilot card prompts. Independent agent review is not a claim of Microsoft certification or human expert approval.

## Decisions and corrections

Final outcome: **12 of 12 approved** (3 notes and 9 cards). No outstanding factual, source, duplicate or editorial blockers. c22 is approved at revision 2 and c23 at revision 3; all other records retain revision 1.

The initial pass approved 10 of 12 records and requested changes to cc-d1-c22/c23. Both had supported keys, but their stems explicitly supplied the diagnosis. The lead applied the proposed revision-2 stems. The revised questions require identifying the missing access layer rather than repeating a named fault. A final explanation consistency correction removes c23's outdated reference to a stated omission. The JSON ledger is authoritative for final decisions and exact hashes.

In c22, identity synchronization, replacement groups and recreating an identity cannot substitute for data privileges. In c23, form access, experience profiles and repeating persona mapping do not grant app authorization. In c24, automatic redistribution is unsupported, while the alternative linking a custom limit to default reduction contradicts documented override behavior. These are introductory application questions, not a claim of difficult exam simulation. All MCQs have exactly one matching correct-answer text; positions are c/a/d.

## Primary sources opened and claims examined

- [Create users](https://learn.microsoft.com/en-us/power-platform/admin/create-users): regular human account creation in Microsoft 365, Dataverse eligibility and separate direct/team role requirements. Supports n06/c16; the card asks for the documented entry point, not the only possible provisioning mechanism.
- [Control user access](https://learn.microsoft.com/en-us/power-platform/admin/control-user-access): environment membership and licenses do not supply data privileges. Administrator exceptions were read; c22 uses a non-admin. Supports n06/c22.
- [Enhanced user management](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles): bulk attributes must already exist; human unified-routing users need bookable resources; Default Presence determines workspace sign-in status; profiles can be associated with users. Supports n06/n08/c17/c21.
- [Role persona mapping](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/role-persona-mapping): copy a suitable role, retain minimum access/persona privilege, map it, and grant application/form/dashboard access separately. Supports n07/c18/c23.
- [Assign security roles](https://learn.microsoft.com/en-us/power-platform/admin/assign-security-roles): role grants accumulate and roles may be direct or inherited through group teams. Supports n07/c19/c22.
- [Capacity profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles): reset frequency requires recreation; custom limits persist until reset, remain independent of default-limit changes and affect new work without redistributing existing work. Supports n08/c20/c24; the bookable-resource prerequisite also supports n08.
- [Assign roles and enable users](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/add-users-assign-roles): Basic User is required and case work requires Customer Service Representative. Current body permits team as well as direct role assignment. Supports n06. The author's reported stale search-snippet restriction is not supported by the opened current article and is not taught.
- [Official AB-250 guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250): Manage users lists user settings, account creation, security roles/personas and capacity profiles in order. D1.3.01-.04 are repository locators for those bullets. This batch gives partial coverage, not full mastery of those objectives.

The web reader displayed a generic authorization banner on some pages while also returning the full relevant body. Assertions were checked against that body, not titles or snippets. No tenant sign-in or configuration was performed.

## Distinctness and scope

Pilot cc-d1-c02 tests the default workspace representative role. These items teach onboarding layers, custom-role behavior and separate app authorization. Pilot cc-d4-c06 tests manual capacity override; this batch tests editing lifecycle and non-retroactive custom limits. Subject overlap is useful context, not a duplicated tested meaning. The operations batch's rollout, simulation and Service Operations Agent topics do not collide. Every note is used by cards. The concise capacity note is adequate without padding.

Three notes, six core recall cards and three application MCQs remain in scope. No exam-bank questions, dump material, data-schema changes or runtime edits. The onboarding acceptance check is clear author guidance, not an invented product guarantee.

## Validation and limits

Parsed bundle and ledger JSON; used `scripts/pilot-review-utils.mjs` for exact current item/editorial/source fingerprints. Checked unique review IDs, complete sourceChecks and note references. Full application lint, unit tests, build and browser regressions are lead integration checks and were not run by this review-only agent. Later content/editorial/referenced-source changes invalidate approval and need re-review.
