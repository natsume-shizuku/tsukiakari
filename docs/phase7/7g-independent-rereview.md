# Phase 7G independent re-review of 104 items

Run on 2026-11-04 by a separate Claude Opus 5.5 agent session, which is neither the lead nor an author of these items. This is an independent agent pass, not a human expert certification. No card, note, question, revision, fingerprint, approval or generated file was changed, and nothing was committed.

## Result

| Verdict | Items |
|---|---|
| Supported | 102 |
| Changed | 1 |
| Unclear | 1 |
| Source gone | 0 |

No cited page has gone, and no keyed answer teaches the wrong conclusion. Two items need a revision: one answer can't be carried out as written, and one note is behind its source.

## Items needing a revision

Each needs a new revision and independent approval, with the user's authorization.

### `ab250-d4-q06`: the keyed action can't be done with the question's numbers (unclear)

- **Problem:** the routine queue has priority 1, and the keyed answer is "Assign the urgent queue a smaller priority number than the routine queue".
- **Evidence:** the [Dataverse queue table reference](https://learn.microsoft.com/en-us/dynamics365/developer/reference/entities/queue) lists `msdyn_priority` with MinValue 1. The cited queue page doesn't state the range, so the problem doesn't show from the cited sources alone.
- **What still holds:** smaller numbers win, so the option remains the best one and no distractor becomes right.
- **Suggested fix:** change the stem's routine priority from 1 to 2 and leave urgent at 4. The keyed option then works by setting urgent to 1, and the options need no change.
- **Limit:** this rests on the table reference, not on a test in the admin center.

### `cc-d6-n08`: the note is behind its own cited page (changed)

- **Problem 1:** the note says the Diagnose Debug experience "needs additional setup" and lists registering the app and federated credentials as manual work. [Configure conversation diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics), dated 2026-10-20, now has a guided setup that "creates the required app and federated identity credential, sets the environment variable, and validates the connection".
- **Problem 2:** "event telemetry complements conversation recordings and transcripts rather than replacing them" appears on none of the three cited pages, and the note's evidence record doesn't claim it.
- **What still holds:** [Enable Diagnose dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/enable-diagnose-dashboard), dated 2026-05-06, still documents the manual path, Monitoring Reader and the app setting. Nothing in the note is directly contradicted.
- **Suggested fix:** present the guided setup as the current route and the manual steps as documented detail, then remove or source the recordings sentence.

## Watch items, no revision needed

- **`cc-d6-c22`, `c23`, `c24`:** these cite only the older Diagnose page and stay correct against it. Reread them if `cc-d6-n08` is revised, because the two pages don't say whether guided setup also covers the Debug app setting.
- **`cc-d1-n10`, `cc-d1-c30`:** the reference architecture page dates from 2024 and still says "Copilot for Service". The tested wording is generic and holds. I found no retirement notice for that product name, and no current confirmation of it either.
- **`ab250-d3-q14`:** the [Bot Framework SDK page](https://learn.microsoft.com/en-us/azure/bot-service/index-bf-sdk?view=azure-bot-service-4.0) says the SDK is no longer updated or maintained and points to the Microsoft 365 Agents SDK. The smart assist pages still direct to Azure Bot Service, and I found no official retirement of the service, so the key holds. Recheck if the smart assist guide changes.
- **`ab250-d3-q12`:** Conversation throughput is an average per day, while the stem compares it with a total. The key is still the only option that fits, but the stem could be tightened in any later revision.
- **Unused bundle sources:** `exam-d3-s13` (transparency note), `exam-d3-s17` (voice-channel-pva-bots) and `exam-d4-s07` (set-up-skill-based-routing) are listed in their bundles but cited by no item or evidence record. All three still load.

## Preview, licensing, region and retirement

| Statement | Items | Status on 2026-11-04 |
|---|---|---|
| Copilot Studio extensibility is a production-ready preview | `ab250-d3-q09`, `q10`, `q11` | Holds, page dated 2026-10-14 |
| Secure external contact settings are a production-ready preview | `ab250-d3-q21` | Holds, page dated 2026-07-28 |
| GPT-5-Chat is a preview model | `ab250-d3-q28` | Holds, page dated 2026-09-14 |
| Intent-driven routing is a production-ready preview | `ab250-d4-q25`, `q26` | Holds, page dated 2026-05-21 |
| The note doesn't present every record type or preview option as available | `cc-d6-n04` | Holds, email evaluation is still preview on pages dated 2026-10-23 |
| Smart assist case and knowledge suggestions are unsupported | `ab250-d3-q14` | Holds, [deprecations page](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/deprecations-customer-service) updated 2026-11-03 |

No item in scope makes a specific licensing or regional claim: `cc-d6-n07` defers licensing and `ab250-d3-q28` has the team verify the region. The deprecations page lists unified routing diagnostics and its historical dashboards, but `ab250-d4-q34` to `q36` use conversation diagnostics, so they aren't affected.

## Method and limits

- **Order of work:** each item was judged from its prompt, answer and options against the sources first. Explanations and ledger reasoning were read afterwards as a second pass, which changed no verdict and found no explanation contradicting its source.
- **Depth:** shorter pages were read in full. Five long references were read only in the sections their items depend on: `migrate-channel-config-using-solutions`, `multilingual`, `context-variables-for-bot`, `assignment-methods` and `conversation-diagnostics-subscenarios`. A claim elsewhere on those pages could have been missed.
- **Beyond the cited pages:** the Dataverse queue reference, the Bot Framework SDK page and the deprecations page were opened to test specific claims. All were Microsoft Learn pages, and no exam dumps were used. A web search was used only to look for retirement notices.
- **Not covered:** text extraction drops screenshots, so anything shown only in an image wasn't seen. Nothing was tested in a live Dynamics 365 environment. Page dates show when Microsoft edited a page, not when the product changed. Usefulness and difficulty weren't assessed.
- **`docs/PHASE_7G.md`:** when this review ran, the file was uncommitted in the main checkout, so it was read from there. It is now part of commit `2548bc5`.

## Verdict for each item

Item IDs use `n` for notes, `c` for cards and `q` for questions. All URLs were opened on 2026-11-04.

### 7d-final-deployment (16: 4 notes, 12 cards)

| Item | Verdict | URL checked | Reason |
|---|---|---|---|
| `cc-d1-n09` | supported | [configure-custom-connector](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-custom-connector) | Prerequisites list same-environment rule and the three columns; Copy data separates manual initial sync (pagination) from automated incremental sync; webhooks cover create/update/delete. The closing test advice is authoring guidance, not a source claim. |
| `cc-d1-n10` | supported | [set-up-embedded-experience](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience)<br>[contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/guidance/reference-architectures/contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio) | Salesforce steps (import, Manage Call Center Users, default softphone layout, Open CTI Softphone) match. Reference architecture says routing, follow-up and supervision stay with CRM/CCaaS. Source page last changed 2024 and still says Copilot for Service; note wording is generic so it survives. |
| `cc-d1-n11` | supported | [migrate-channel-config-using-solutions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions)<br>[alm-best-practices](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/alm-best-practices) | Important note scopes out account, channel provider, agent configuration and AI/analytics; the ordered list matches; ALM page says delete the managed solution that brought the configuration in. |
| `cc-d1-n12` | supported | [copy-environment-with-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/copy-environment-with-omnichannel)<br>[voice-channel-disconnect-from-acs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-disconnect-from-acs) | Copy page (2026-09-09) covers review of accounts/numbers/agents/websites, routing tests, record-routing note, target snippet, one ACS resource per environment, publish agent and test escalation. Disconnect page confirms numbers released and Event Grid cleanup. |
| `cc-d1-c25` | supported | [configure-custom-connector](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-custom-connector) | Prerequisites name Source CRM, Source CRM ID and Source CRM URL on Account and Contact. |
| `cc-d1-c26` | supported | [configure-custom-connector](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-custom-connector) | Prerequisite: 'Ensure that the Power Apps and Power Automate environments are the same.' |
| `cc-d1-c27` | supported | [configure-custom-connector](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-custom-connector) | Copy data defines incremental sync through automated triggers; webhooks are documented for it. Re-running the manual flow, editing a URL value or moving environments adds no automation. |
| `cc-d1-c28` | supported | [set-up-embedded-experience](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience) | Step: Manage Call Center Users > Add more users, select the signed-in user record. |
| `cc-d1-c29` | supported | [set-up-embedded-experience](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience) | Utility Items step selects Open CTI Softphone in the Service Console app. |
| `cc-d1-c30` | supported | [contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/guidance/reference-architectures/contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio) | Page: routing through CRM/CCaaS provider; supervisors and managers work with existing CRM or CCaaS provider. All three distractors move those duties elsewhere. |
| `cc-d1-c31` | supported | [migrate-channel-config-using-solutions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions) | Important note: account, channel provider, agent configuration, AI and analytics settings are not in scope. |
| `cc-d1-c32` | supported | [alm-best-practices](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/alm-best-practices) | Deletion section: delete the managed solution that brought in the configuration. |
| `cc-d1-c33` | supported | [migrate-channel-config-using-solutions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions) | Ordered steps put queues before channel workstreams and settings. Each distractor reverses or skips a required step. |
| `cc-d1-c34` | supported | [voice-channel-disconnect-from-acs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-disconnect-from-acs) | Important note: all associated phone numbers are also released from Dynamics 365. |
| `cc-d1-c35` | supported | [copy-environment-with-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/copy-environment-with-omnichannel) | Note: copy of record-routing configuration isn't currently supported; configure and validate separately. |
| `cc-d1-c36` | supported | [copy-environment-with-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/copy-environment-with-omnichannel) | Chat channel section: replace the source snippet with the one generated in the target. Distractors leave the source snippet in place. |

### 7d-final-analytics (24: 6 notes, 18 cards)

| Item | Verdict | URL checked | Reason |
|---|---|---|---|
| `cc-d6-n03` | supported | [enable-monitor-assign-transfer-conv](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-monitor-assign-transfer-conv)<br>[monitor-conversations](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/monitor-conversations)<br>[configure-customer-service-analytics-insights-csh](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-customer-service-analytics-insights-csh) | Toggles sit under Ongoing conversation insights; Open/unassigned for Assign; Active/Waiting messaging for Transfer; elevated voice/video and AI-agent limits; Force Close sets Closed. |
| `cc-d6-n04` | supported | [manage-quality-evaluation-agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/manage-quality-evaluation-agent)<br>[evaluation-plan](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/evaluation-plan) | Three-part framework, the four prerequisites, Step 1-3 readiness tiles, Trigger/Recurring/Once definitions and conditions/criteria/activate flow all match the October 2026 pages. Note hedges on email preview. |
| `cc-d6-n05` | supported | [customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/customize-reports)<br>[datamodel-overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/datamodel-overview) | Editor scope, organization-wide publish and permanent Reset match; data-model overview directs new logic to model customization and reuse of out-of-the-box metrics. |
| `cc-d6-n06` | supported | [datamodel-overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/datamodel-overview)<br>[model-customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/model-customize-reports)<br>[use-datamodel](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/use-datamodel) | Managed dataset read-only recommendation, local composite model and relationships, manual upkeep of copies, and no supervisor actions on model-customized reports all match. |
| `cc-d6-n07` | supported | [model-customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/model-customize-reports)<br>[2-out-of-box-analytics](https://learn.microsoft.com/en-us/training/modules/analytics-reporting-contact-center/2-out-of-box-analytics) | Training unit confirms embedding and the table content setting in a customized app; Step 4 confirms picker scope and the shared Customized Reports site map. |
| `cc-d6-n08` | **changed** | [configure-conversation-diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics)<br>[conversation-diagnostics-application-insights](https://learn.microsoft.com/en-us/power-platform/admin/conversation-diagnostics-application-insights)<br>[enable-diagnose-dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/enable-diagnose-dashboard) | Diagnose page still documents the manual path, but Configure conversation diagnostics (2026-10-20) now has a guided setup that creates the app and federated credential and sets the environment variable, so 'needs additional setup' overstates manual work. 'Complements recordings and transcripts' appears in none of the three cited pages. |
| `cc-d6-c07` | supported | [enable-monitor-assign-transfer-conv](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-monitor-assign-transfer-conv) | Admin page: actions need the corresponding toggles; analytics access is a separate role-based grant. |
| `cc-d6-c08` | supported | [monitor-conversations](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/monitor-conversations) | Assign section: Open state and not assigned to any representative. |
| `cc-d6-c09` | supported | [monitor-conversations](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/monitor-conversations) | Transfer covers Active conversations on Live Chat between representatives. Assign needs Open/unassigned, Force Close ends the chat, a report filter changes nothing. |
| `cc-d6-c10` | supported | [manage-quality-evaluation-agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/manage-quality-evaluation-agent) | Evaluation plans 'determine when and which interactions are evaluated, and which criteria to apply'. |
| `cc-d6-c11` | supported | [manage-quality-evaluation-agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/manage-quality-evaluation-agent) | Prerequisites section lists Step 1 Connection References, Step 2 Power Automate Flows, then Publish in Step 3 Copilot Studio Agent. |
| `cc-d6-c12` | supported | [evaluation-plan](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/evaluation-plan) | Trigger with Event: Closed conversations automatically evaluates future conversations meeting conditions. Once and Recurring are defined for other purposes; criteria alone run nothing. |
| `cc-d6-c13` | supported | [customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/customize-reports) | Note: all customizations become visible to all users in your organization. |
| `cc-d6-c14` | supported | [customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/customize-reports) | Important: Reset permanently removes customizations. |
| `cc-d6-c15` | supported | [datamodel-overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/datamodel-overview) | Scenarios 1 and 2 place new logic in data model customization. Renaming, re-charting or bookmarking leaves the calculation unchanged. |
| `cc-d6-c16` | supported | [datamodel-overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/datamodel-overview) | 'We recommend treating the dataset in the managed workspace as read-only.' |
| `cc-d6-c17` | supported | [datamodel-overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/datamodel-overview) | Note: assign, transfer, monitor and force close aren't available for model customized reports. |
| `cc-d6-c18` | supported | [use-datamodel](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/use-datamodel) | External/additional data path: add a local model, bring the attribute in, Manage relationship. Direct edits are overwritten; an unrelated table or a measure alone can't slice by the attribute. |
| `cc-d6-c19` | supported | [2-out-of-box-analytics](https://learn.microsoft.com/en-us/training/modules/analytics-reporting-contact-center/2-out-of-box-analytics) | Training unit: dashboards are embedded directly in the application, reached through standard navigation. |
| `cc-d6-c20` | supported | [model-customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/model-customize-reports) | Step 4: dropdown is populated with the reports in the workspace configured on Step 1. |
| `cc-d6-c21` | supported | [model-customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/model-customize-reports) | Same Step 4 rule makes workspace match the first check. The role, toggle and Reset distractors don't drive that list. |
| `cc-d6-c22` | supported | [enable-diagnose-dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/enable-diagnose-dashboard) | 'Assign the Monitoring Reader role to your app to access App insights data.' |
| `cc-d6-c23` | supported | [enable-diagnose-dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/enable-diagnose-dashboard) | 'Select Yes in the Default value and Setting environment value fields.' |
| `cc-d6-c24` | supported | [enable-diagnose-dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/enable-diagnose-dashboard) | Cited Diagnose page lists these steps. Guided setup in Configure conversation diagnostics now automates part of them, but the keyed set remains what is needed and the distractors stay wrong. |

### 7e-ai (32 questions)

| Item | Verdict | URL checked | Reason |
|---|---|---|---|
| `ab250-d3-q05` | supported | [copilot-enable-summary](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-summary) | Page's own example adds the automatic-notification sender under Specify information to exclude. Case-timeline removal breaks the audit rule; product filter and conversation trigger don't touch case summary input. |
| `ab250-d3-q06` | supported | [copilot-summarize-conversations](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-summarize-conversations) | Summarize conversations note: 'You can see Create case only if case management is configured.' Stem rules out the settings distractors. |
| `ab250-d3-q07` | supported | [copilot-enable-help-pane](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-help-pane) | Automated filters apply without representative action and rules apply to the record type in use. Preset is hidden but static; representative filter needs a choice; prompts don't filter. |
| `ab250-d3-q08` | supported | [copilot-enable-help-pane](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-help-pane) | Knowledge sources note: Copilot uses articles tagged with the UI language, on the latest version and Published. Web sources are No for Ask a question; only the content attribute is used. |
| `ab250-d3-q09` | supported | [extend-copilot-with-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/extend-copilot-with-copilot-studio) | Sequence: if no confident response, Copilot falls back to configured knowledge sources if enabled. Page still labelled production-ready preview on 2026-10-14. |
| `ab250-d3-q10` | supported | [extend-copilot-with-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/extend-copilot-with-copilot-studio) | Tools retrieve structured data and topics define controlled logic; Limitations say model, instructions and msdyn_ topics can't be updated. |
| `ab250-d3-q11` | supported | [extend-copilot-with-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/extend-copilot-with-copilot-studio) | Custom context passes entity, data field and description so users needn't supply the value; description guides the orchestrator. |
| `ab250-d3-q12` | supported | [copilot-analytics-report](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-analytics-report) | Conversation throughput is defined as excluding email and voice. Stem removes the duration, timezone and ongoing-versus-completed distractors. Wording watch: the stem compares a per-day average with a total, a second difference no option covers. |
| `ab250-d3-q13` | supported | [copilot-analytics-report](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-analytics-report) | Duration and Time zone are the report filters; Daily active users means unique representatives. 'Used' means copied, not resolved, and the conversation metric lists ended conversations only. |
| `ab250-d3-q14` | supported | [smart-assist](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/smart-assist)<br>[smart-assist-bot](https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/smart-assist-bot) | Manage smart assist: Copilot agents aren't supported as smart assist agents; build with Azure Bot Service. Case and knowledge suggestions unsupported since 2025-06-02, confirmed on the deprecations page. No retirement of smart assist itself is listed. Watch: Bot Framework SDK is no longer maintained, though Azure AI Bot Service itself is not retired. |
| `ab250-d3-q15` | supported | [smart-assist](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/smart-assist) | Add a smart assist agent to a workstream: Advanced settings, Add bot in Smart assist bots area, per workstream. The Bot area and queue membership are different. |
| `ab250-d3-q16` | supported | [smart-assist](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/smart-assist) | Page: enabled across channels 'excluding Entity Records Channel'. The distractors treat a scope exclusion as a setting. |
| `ab250-d3-q17` | supported | [voice-configuration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-configuration) | Important note: Enable voice changes authoring only; turn on the Telephony channel for a fully voice-enabled agent. |
| `ab250-d3-q18` | supported | [context-variables-for-bot](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/context-variables-for-bot) | Parse JSON section: context holds RecordId GUID and PrimaryDisplayValue, the name. Parse the structure and use RecordId. |
| `ab250-d3-q19` | supported | [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure) | Pass variables section: 'you only return explicitly defined output variables as structured data'. |
| `ab250-d3-q20` | supported | [voice-sensitive-data](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sensitive-data) | Limitations: the setting doesn't mask values intentionally sent to external systems or overwrite third-party content; redact at the destination. |
| `ab250-d3-q21` | supported | [configure-voice-call-experiences](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-voice-call-experiences) | Consult 'Turn off recording (keep transcription if active)' and bridged 'Turn off transcription & recording' match the stated policy. Feature still production-ready preview, and the stem says so. |
| `ab250-d3-q22` | supported | [voice-consent-based-record](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-consent-based-record) | Note: supported only for inbound voice workstreams with a voice-enabled agent; not outbound. |
| `ab250-d3-q23` | supported | [voice-consent-based-record](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-consent-based-record) | Sample YAML sets defaultValueOnSilence: true and the note treats no input as implicit consent; page says modify the sample to meet compliance needs. |
| `ab250-d3-q24` | supported | [voice-sip-x-header](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sip-x-header) | Update the JSON schema when names change; schema must use lowercase x-, so x-BookingRef is the exact form. |
| `ab250-d3-q25` | supported | [voice-sip-x-header](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sip-x-header)<br>[voice-configuration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-configuration) | Direct Routing is a prerequisite; outgoing X-headers accept a static value or variable and exist only for External phone number transfer. SIP UUI takes neither formulas nor per-call values. |
| `ab250-d3-q26` | supported | [voice-configuration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-configuration) | 'Transfer egress with SIP UUI ... must use direct routing'; PSTN numbers don't support SIP UUI transfers. |
| `ab250-d3-q27` | supported | [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure) | Real-time selection is one-time; to use a basic agent, create a new agent. |
| `ab250-d3-q28` | supported | [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure) | Comparison table recommends GPT-5-Chat (Preview) with Neural TTS for custom or branded voice at higher latency. Still preview on the page; admin center voice doesn't override the agent. |
| `ab250-d3-q29` | supported | [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure) | Silence detection isn't on by default; the agent waits indefinitely; turn it on and configure a reprompt. VAD controls turn end; inactivity is digital only. |
| `ab250-d3-q30` | supported | [voice-dtmf](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-dtmf) | DTMF important note: plain number matches menu order; /DTMFKey simulates the assigned key. |
| `ab250-d3-q31` | supported | [voice-dtmf](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-dtmf) | Fixed length is allowed; # is selectable and isn't counted in length; unspecified length accepts any; global triggers take single keys only. |
| `ab250-d3-q32` | supported | [advanced-hand-off](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-hand-off) | Explicit triggers: you must add a Transfer conversation node; optional private message goes to the live agent. |
| `ab250-d3-q33` | supported | [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure) | Trigger table marks Unknown Topic/On Unknown Intent and AI response generated as Not supported. |
| `ab250-d3-q34` | supported | [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure)<br>[multilingual](https://learn.microsoft.com/en-us/microsoft-copilot-studio/multilingual) | Real-time page: deterministic topic messages need provided translations. Multilingual page: makers supply topic translations and test the secondary language. |
| `ab250-d3-q35` | supported | [authoring-language-support](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-language-support) | Note: republish to update the speech model, possibly reconfigure TTS, and use the workstream voice channel for Dynamics integration. |
| `ab250-d3-q36` | supported | [multilingual](https://learn.microsoft.com/en-us/microsoft-copilot-studio/multilingual) | Make an agent switch: set User.Language; best practice is right after a Question node. |

### 7e-routing (32 questions)

| Item | Verdict | URL checked | Reason |
|---|---|---|---|
| `ab250-d4-q05` | supported | [queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel) | Queues page: for a live chat workstream only messaging type queues are shown. Priority, assignment method and hours don't change queue type. |
| `ab250-d4-q06` | **unclear** | [queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel)<br>[assignment-methods](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) | Direction is right: smaller number wins. But routine is already 1 and the Dataverse queue reference sets msdyn_priority MinValue to 1, so the urgent queue can't go below it as the keyed option says. Routine must be renumbered, which no option states. |
| `ab250-d4-q07` | supported | [assignment-methods](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) | Equal-priority custom queues order alphabetically by name; page says to assign distinct priorities to them. |
| `ab250-d4-q08` | supported | [assignment-methods](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) | Assignment methods page gives this WhatsApp case: asynchronous channels use last interaction time, so the Thursday afternoon return follows the Thursday morning waiters. |
| `ab250-d4-q09` | supported | [unified-routing-faqs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-faqs)<br>[assignment-methods](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) | FAQ: last capacity release time for voice and messaging is the only parameter, and sign-in time doesn't affect it. Scenario 2 confirms it when workloads match. |
| `ab250-d4-q10` | supported | [unified-routing-faqs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-faqs)<br>[queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel) | FAQ: conversations in a queue with no representatives close automatically; records stay and aren't auto assigned. The pattern points to queue membership. |
| `ab250-d4-q11` | supported | [manage-overflow](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow)<br>[queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel) | Voice queued overflow offers Waiting time in queue exceeds with Transfer to a different queue. Average wait is prequeue; Record queues can't take voice. |
| `ab250-d4-q12` | supported | [manage-overflow](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow) | Note: the check runs once only, and an overflow transfer assigns without further prequeue checks. |
| `ab250-d4-q13` | supported | [queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel)<br>[manage-overflow](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow) | Both pages: a no-match or error route to the fallback queue ignores that queue's overflow settings. |
| `ab250-d4-q14` | supported | [manage-overflow](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow)<br>[create-workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams) | Adding an operating hour record creates Out of operation hours with action Assign to queue anyway. Voice is Push only, so option d changes nothing. |
| `ab250-d4-q15` | supported | [create-operating-hours](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-operating-hours) | Time zone setting accounts for daylight saving; New > Holiday sets a date or range without removing recurrence. |
| `ab250-d4-q16` | supported | [create-operating-hours](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-operating-hours)<br>[queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel) | Limitation: Calendar can't be migrated by export and import; set work hours up manually. A queue without hours is treated as always available. |
| `ab250-d4-q17` | supported | [create-workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams) | Channels in one workstream inherit its routing and assignment settings; allowed presences sit in workstream work distribution. |
| `ab250-d4-q18` | supported | [3-configure-engagement-agent](https://learn.microsoft.com/en-us/training/modules/configure-routing-contact-center/3-configure-engagement-agent) | Training unit: connect the agent to omnichannel, then Add bot in the workstream Bot area. Escalation logic lives in Copilot Studio, not classification. |
| `ab250-d4-q19` | supported | [configure-work-classification](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) | Within a classification ruleset items run in order; on a match control passes to the next ruleset, so the narrow rule must come first. |
| `ab250-d4-q20` | supported | [configure-work-classification](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) | Template ruleset rules can't be edited in the workstream; Copy from template creates an editable copy. |
| `ab250-d4-q21` | supported | [configure-work-classification](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) | Note: when you reroute a work item, new skills are appended to existing ones. |
| `ab250-d4-q22` | supported | [unified-routing-faqs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-faqs)<br>[set-up-isf-model](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-isf-model) | FAQ: extract text from email HTML into another field for the model. Skill finder page: review loaded data and retrain. |
| `ab250-d4-q23` | supported | [configure-work-classification](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) | Note: use the same rating model for a skill in the rule and on the representative, or assignment won't work as expected. |
| `ab250-d4-q24` | supported | [set-up-isf-model](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-isf-model) | Important note: a model trained in a test environment works only in another test environment, not production. |
| `ab250-d4-q25` | supported | [configure-intent-driven-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-intent-driven-routing) | Prerequisites: Customer Intent Agent enabled, intent discovery set up, Copilot agent in the messaging workstream. Unified routing doesn't determine intent. Still production-ready preview. |
| `ab250-d4-q26` | supported | [configure-intent-driven-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-intent-driven-routing) | Classification rules attach skills from intent fields; route-to-queue only selects the queue; legacy mappings no longer apply. |
| `ab250-d4-q27` | supported | [configure-preferred-agent](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-preferred-agent) | Contacts with no mapped representative go to the best eligible representative regardless of the fallback option. |
| `ab250-d4-q28` | supported | [configure-preferred-agent](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-preferred-agent) | Prerequisite: queue membership. Runtime: allowed presence is checked and capacity, skills and assignment rules are skipped. |
| `ab250-d4-q29` | supported | [configure-preferred-agent](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-preferred-agent) | Next best representative is the fallback for live chat and voice; No one leaves work in the queue. |
| `ab250-d4-q30` | supported | [set-up-record-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-record-routing) | Note: without permission to the assigned item, the system stops the assignment and closes the conversation. |
| `ab250-d4-q31` | supported | [create-rules-automatically-route-cases](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-rules-automatically-route-cases) | Limitation: only one level of related entity hierarchy is supported though nested selection is allowed. The grouping and IN distractors are also limited. |
| `ab250-d4-q32` | supported | [set-up-record-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-record-routing) | Active basic rule won't route until intake rules exist; intake maps to a workstream or an active basic rule; records use Record workstreams. |
| `ab250-d4-q33` | supported | [create-rules-automatically-route-cases](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-rules-automatically-route-cases) | Note: for a same-ID active ruleset, deactivate the rule in the target organization before import. |
| `ab250-d4-q34` | supported | [configure-conversation-diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics) | Case diagnostics: each routing attempt creates a conversation; select the attempt to review its intake rules. |
| `ab250-d4-q35` | supported | [conversation-diagnostics-subscenarios](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/conversation-diagnostics-subscenarios) | AssignmentRuleset holds custom ruleset and rule details; CSRStatusandCapacityDetails holds status and capacity history. |
| `ab250-d4-q36` | supported | [conversation-diagnostics-subscenarios](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/conversation-diagnostics-subscenarios) | CSRAssignment is 'assignment attempted'; CSRAccepted and CSRNotificationTimeout are the separate outcomes. |

## Sources opened

All 55 distinct URLs returned HTTP 200 with no redirect. "Doc date" is the page's `ms.date` and "Updated" is its `updated_at`.

| Page | Doc date | Updated | Items citing it |
|---|---|---|---|
| [configure-custom-connector](https://learn.microsoft.com/en-us/dynamics365/contact-center/extend/configure-custom-connector) | 2026-05-28 | 2026-07-21 | 4 |
| [set-up-embedded-experience](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/set-up-embedded-experience) | 2026-05-08 | 2026-07-21 | 3 |
| [contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/guidance/reference-architectures/contact-center-existing-crm-ccaas-solution-copilot-service-copilot-studio) | 2024-06-27 | 2025-08-14 | 2 |
| [migrate-channel-config-using-solutions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/migrate-channel-config-using-solutions) | 2026-05-15 | 2026-06-16 | 3 |
| [alm-best-practices](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/alm-best-practices) | 2026-05-08 | 2026-07-21 | 2 |
| [copy-environment-with-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/implement/copy-environment-with-omnichannel) | 2026-09-09 | 2026-09-09 | 3 |
| [voice-channel-disconnect-from-acs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-disconnect-from-acs) | 2026-05-08 | 2026-05-08 | 2 |
| [enable-monitor-assign-transfer-conv](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-monitor-assign-transfer-conv) | 2026-05-28 | 2026-05-29 | 2 |
| [monitor-conversations](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/monitor-conversations) | 2026-04-28 | 2026-04-30 | 3 |
| [configure-customer-service-analytics-insights-csh](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-customer-service-analytics-insights-csh) | 2026-07-29 | 2026-07-29 | 1 |
| [manage-quality-evaluation-agent](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/manage-quality-evaluation-agent) | 2026-10-23 | 2026-10-23 | 3 |
| [evaluation-plan](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/evaluation-plan) | 2026-10-23 | 2026-10-23 | 2 |
| [customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/customize-reports) | 2026-09-30 | 2026-09-30 | 3 |
| [datamodel-overview](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/datamodel-overview) | 2026-07-30 | 2026-07-29 | 5 |
| [model-customize-reports](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/model-customize-reports) | 2026-09-29 | 2026-09-30 | 4 |
| [use-datamodel](https://learn.microsoft.com/en-us/dynamics365/customer-service/use/use-datamodel) | 2026-06-26 | 2026-06-26 | 2 |
| [2-out-of-box-analytics](https://learn.microsoft.com/en-us/training/modules/analytics-reporting-contact-center/2-out-of-box-analytics) | 2026-04-07 | 2026-05-14 | 2 |
| [configure-conversation-diagnostics](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-conversation-diagnostics) | 2026-10-20 | 2026-10-20 | 2 |
| [conversation-diagnostics-application-insights](https://learn.microsoft.com/en-us/power-platform/admin/conversation-diagnostics-application-insights) | 2025-11-28 | 2026-08-14 | 1 |
| [enable-diagnose-dashboard](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/enable-diagnose-dashboard) | 2026-05-06 | 2026-07-21 | 4 |
| [copilot-enable-help-pane](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-help-pane) | 2026-09-10 | 2026-09-10 | 2 |
| [copilot-enable-summary](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/copilot-enable-summary) | 2026-08-27 | 2026-08-31 | 1 |
| [extend-copilot-with-copilot-studio](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/extend-copilot-with-copilot-studio) | 2026-10-14 | 2026-10-17 | 3 |
| [copilot-analytics-report](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-analytics-report) | 2026-08-27 | 2026-08-31 | 2 |
| [smart-assist](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/smart-assist) | 2026-05-07 | 2026-05-16 | 3 |
| [smart-assist-bot](https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/smart-assist-bot) | 2026-05-27 | 2026-05-27 | 1 |
| [voice-configuration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-configuration) | 2026-10-02 | 2026-10-20 | 3 |
| [voice-dtmf](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-dtmf) | 2026-04-23 | 2026-10-20 | 2 |
| [voice-sensitive-data](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sensitive-data) | 2026-09-24 | 2026-10-20 | 1 |
| [voice-consent-based-record](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-consent-based-record) | 2026-05-07 | 2026-10-07 | 2 |
| [voice-sip-x-header](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sip-x-header) | 2026-05-21 | 2026-10-20 | 2 |
| [voice-realtime-configure](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-configure) | 2026-09-14 | 2026-10-20 | 6 |
| [transparency-note-real-time-voice-agents](https://learn.microsoft.com/en-us/dynamics365/contact-center/implement/transparency-note-real-time-voice-agents) | 2026-07-17 | 2026-07-21 | none |
| [advanced-hand-off](https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-hand-off) | 2026-04-30 | 2026-08-19 | 1 |
| [multilingual](https://learn.microsoft.com/en-us/microsoft-copilot-studio/multilingual) | 2026-04-14 | 2026-08-03 | 2 |
| [authoring-language-support](https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-language-support) | 2026-06-29 | 2026-10-17 | 1 |
| [voice-channel-pva-bots](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/voice-channel-pva-bots) | 2026-02-11 | 2026-02-11 | none |
| [configure-voice-call-experiences](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-voice-call-experiences) | 2026-07-28 | 2026-07-29 | 1 |
| [context-variables-for-bot](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/context-variables-for-bot) | 2026-07-30 | 2026-07-30 | 1 |
| [copilot-summarize-conversations](https://learn.microsoft.com/en-us/dynamics365/contact-center/use/copilot-summarize-conversations) | 2026-08-27 | 2026-08-31 | 1 |
| [queues-omnichannel](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/queues-omnichannel) | 2026-07-22 | 2026-07-24 | 6 |
| [manage-overflow](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/manage-overflow) | 2026-10-30 | 2026-10-30 | 4 |
| [create-operating-hours](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-operating-hours) | 2026-03-18 | 2026-03-18 | 2 |
| [create-workstreams](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams) | 2026-05-08 | 2026-08-24 | 2 |
| [configure-work-classification](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-work-classification) | 2026-05-08 | 2026-05-08 | 4 |
| [3-configure-engagement-agent](https://learn.microsoft.com/en-us/training/modules/configure-routing-contact-center/3-configure-engagement-agent) | 2026-04-01 | 2026-05-13 | 1 |
| [set-up-skill-based-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing) | 2026-05-07 | 2026-05-18 | none |
| [set-up-isf-model](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-isf-model) | 2026-05-27 | 2026-05-27 | 2 |
| [configure-intent-driven-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-intent-driven-routing) | 2026-05-21 | 2026-06-18 | 2 |
| [configure-preferred-agent](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-preferred-agent) | 2026-10-30 | 2026-10-30 | 3 |
| [set-up-record-routing](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-record-routing) | 2026-10-28 | 2026-10-28 | 2 |
| [create-rules-automatically-route-cases](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-rules-automatically-route-cases) | 2026-05-08 | 2026-05-08 | 2 |
| [conversation-diagnostics-subscenarios](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/conversation-diagnostics-subscenarios) | 2026-06-04 | 2026-06-11 | 2 |
| [unified-routing-faqs](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/unified-routing-faqs) | 2026-01-19 | 2026-04-15 | 3 |
| [assignment-methods](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/assignment-methods) | 2026-10-30 | 2026-10-30 | 4 |
