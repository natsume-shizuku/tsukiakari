# Phase 7D1 user administration author report

Author: `/root/d1_users`. Source bodies and exact claims reviewed on 2026-10-31. Status: source-reviewed, awaiting independent review. No content is independently approved by this author.

## Delivered scope

Three notes and nine cards: six core recall and three application MCQs. No exam-bank questions. IDs cc-d1-n06..08 and cc-d1-c16..24. The cards add account readiness, bookable-resource/default-presence configuration, role grants, persona/application access and capacity editing behavior. Every card links its supporting note, registered sources, controlled topic/feature/task tags and D1.3 objective mapping.

The official [AB-250 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-250) was opened and its four Manage users bullets checked. D1.3.01 is user settings; .02 account creation; .03 security roles/custom roles/personas; .04 capacity profiles. These are partial claims within those objectives, not complete objective coverage.

## Primary pages actually opened

| Source | Reviewed sections and use |
|---|---|
| [Create users](https://learn.microsoft.com/en-us/power-platform/admin/create-users) | Create a user account; Requirements for successfully adding users in Dataverse. Regular human identity creation is distinct from roles/environment eligibility. The former create-users-assign-online-security-roles URL redirects here; the bundle uses the canonical URL. |
| [Control user access](https://learn.microsoft.com/en-us/power-platform/admin/control-user-access) | Environment security groups and roles; non-admin eligibility. Account/group membership is not data access. Admin and other special-user exceptions are deliberately excluded from the scenario. |
| [Enhanced user management](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles) | Manage contact center users; Manage users using the classic experience. Existing bulk attributes, bookable resource prerequisite and default presence at sign-in. No blanket capacity number is taught. |
| [Role/persona mapping](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/role-persona-mapping) | Create custom security roles; Enable access to applications/forms/dashboards. Map the appropriate archetype and configure application access separately. |
| [Assign security roles](https://learn.microsoft.com/en-us/power-platform/admin/assign-security-roles) | Cumulative permissions and direct or group-team roles. A narrower additional role does not negate other grants. No invented minimal delegation privilege set is given. |
| [Capacity profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles) | Profile creation, representative-specific limits and how limits work. Reset-frequency recreation and prospective custom-limit behavior. |
| [Assign roles and enable users](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/add-users-assign-roles) | Roles in Contact Center; Assign roles to users. Basic User, case-work role and distinction between role requirements. |

## Source discrepancy and applicability

A search snippet for Assign roles and enable users still said roles must be assigned directly, not through team memberships, to map personas. The opened current article body at **Assign roles to users** instead says roles can be assigned directly **or through team memberships**. Its preceding section documents Microsoft Entra group teams. The batch does not teach the cached restriction. Its references to directly or indirectly assigned security roles are additionally supported by Assign a security role to a user. The independent reviewer should inspect the current body, not rely on the stale snippet.

Persona mapping is not described as granting every underlying privilege automatically. The note/card distinguish required role privileges and separate application/form/dashboard access, as the exact persona article states. This avoids an unsupported blanket claim that persona mapping either grants all access or has no permission effect.

The shared Contact Center administration articles explicitly apply to embedded and standalone Contact Center and Customer Service. Account examples concern ordinary human representatives in a Dataverse environment, not AI agent identities, administrative users or application users. The account-access scenario explicitly supplies license/group/enablement prerequisites so missing roles are the tested issue.

## Duplicate and answer-quality review

Compared all 36 pilot card prompts and related D1/D4 notes. The batch does not repeat the Omnichannel Agent prerequisite recall, workspace choice, managed solution layers, post-restore recovery or manual capacity override. Bookable-resource readiness is separate from the pilot post-migration skill-association scenario. The capacity note explicitly addresses configuration edits rather than the override taught in D4.

Each MCQ has one answer and stable option IDs. Alternatives concern identity synchronization/environment membership, app/form/persona configuration, or current-versus-future workload. The custom-role application card was tightened during drafting to remove implausible role-renaming distractors. No frozen/public content was changed.

## Checks and limits

Local structural check: 3 unique notes, 9 unique cards, 12 matching editorial records, 7 registered HTTPS Microsoft sources; every card source/note reference and MCQ key resolves; six recall and three MCQs. Lead will run catalog/schema checks and application tests after independent approval. This report is author evidence, not independent approval.

No full security privilege matrix, licensing SKU recommendation, delegated-admin role recipe, capacity API recipe or offboarding procedure is asserted. Notes are kept concise where a longer explanation would repeat the cards. Human/agent terminology follows current documentation while retaining exact documented role names.
