# Independent review: 7D2 chat

Reviewer: /root/chat_review. Actual source review: 2026-11-02. Author: /root/d2_chat (2026-10-31). Decision: all 12 items approved at their current revision and fingerprint. No blocking factual or answer-key findings; no changes required by this pass.

## Sources and objective mapping

Opened all seven registered Microsoft Learn pages and the official AB-250 study guide. D2.1.01 covers chat setup; .04 widget configuration; .05 proactive chat; .07 quick replies. Mappings support only the taught claims, not complete objective coverage.

- [Create and manage workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams): Introduction; Create a workstream. Verified same-type channel sharing and Messaging/Chat configuration in the opened article.
- [Configure a chat widget](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/add-chat-widget): Add to an existing classic Chat channel; Set up the modern widget; Manage modern and classic versions. Verified appearance per channel, preserved workstream configuration, pinned testing script and active-version general script.
- [Configure proactive chat](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/proactive-chat): Applicability; Enable proactive chat; Customer experience; Agent experience. Verified standalone scope, embedded-widget prerequisite and invitation acceptance before representative notification.
- [startProactiveChat API](https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/reference/methods/startproactivechat): Parameters; Example. Verified notificationUIConfig message and showPrechat Boolean; no unsupported routing behavior inferred.
- [Start a chat proactively](https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/start-proactive-chat): Scenario 1: Customer wait time; Sample code. Verified readiness listener and timed invitation. No authentication implementation is taught from its anonymous-context sample.
- [Create quick replies](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-quick-replies): Create quick replies; Associate with a workstream; Availability and language settings. Verified separate locale records, no automatic localization and unassociated/all-representative availability subject to language.
- [View the communication panel for conversations](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/oc-conversation-control): Send quick replies. Verified administrator replies on All and enabled personal replies on Personal.

## Item and alternative decisions

- **cc-d2-n03**: Supported routing/widget distinction and version-release workflow. Distinct from pilot snippet placement and context collection.
- **cc-d2-n04**: Scoped standalone invitation flow is supported; trigger testing advice is editorial guidance. SDK message and survey controls are separate.
- **cc-d2-n05**: Supported language, audience and retrieval distinctions. Diagnostic guidance does not promise automatic localization.
- **cc-d2-c07**: Messaging/Chat selection directly supported; no pilot question repeats this selection.
- **cc-d2-c08**: Testing script remains version-specific while general script follows active selection.
- **cc-d2-c09**: Shared workstream satisfies common routing; separate channels allow presentation differences. Separate workstreams duplicate maintenance, queue changes do not separate presentation, and mixed channel types contradict same-type sharing.
- **cc-d2-c10**: Customer acceptance is the documented event preceding representative notification; trigger firing alone is insufficient.
- **cc-d2-c11**: showPrechat controls the configured survey visibility, distinct from invitation UI and routing.
- **cc-d2-c12**: notificationUIConfig changes visitor invitation text. Representative template targets another audience, fallback queue targets routing and false showPrechat violates survey preservation.
- **cc-d2-c13**: No workstream association means broad availability; explanation preserves language filtering.
- **cc-d2-c14**: Locale does not translate reply text; separate localized records are explicitly documented.
- **cc-d2-c15**: Given the correct language/workstream, All is the supported retrieval step. Personal duplication, scope broadening and channel-language changes do not address the stated tab mismatch.

## Distinctness, difficulty and limitations

Compared all 54 published cards and their notes, including the pilot chat authentication, survey, context and snippet-placement material. The new concepts concern workstream ownership, widget release selection, invitations and reusable replies. Readiness appears only as context for an invitation example; it does not repeat the pilot SDK initialization quiz.

The three MCQs have one supported answer each. Their correct positions are B/C/D. Distractors were evaluated individually above. These are introductory to moderate application checks, especially the panel-tab diagnostic; the advanced curation label is not a claim of actual exam difficulty. An independent agent source pass is not human expert certification. Source checks and fingerprints validate only this exact wording. Full app/browser checks belong to lead integration.
