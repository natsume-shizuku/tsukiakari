# Community material audit

Reviewed 2026-10-28 by a delegated audit agent; lead integrated the voice-module nuance below. This is a targeted claim audit, not approval of all repository examples.

## Provenance and use

[MicrosoftLearnHub](https://github.com/MicrosoftLearnHub) describes itself as community-driven. The repository's use of Official does not establish Microsoft ownership. Treat the [AB-250 repository](https://github.com/MicrosoftLearnHub/AB-250---Transforming-Contact-Center-Experiences-with-AI-in-Dynamics-365) as a topic/scenario discovery aid.

Its weight ranges match the official blueprint, but midpoint values total 105%. Use the approved internal allocation, not the pie graphic, for question sampling.

## Findings and dispositions

| Claim area | Evidence and finding | Disposition |
|---|---|---|
| Capacity | [Profiles](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/capacity-profiles) and [units](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/users-user-profiles#capacity) are distinct models. Fixed voice 100 / chat 30 values are not universal product rules. Manual/supervisor assignment can behave differently from automatic assignment. | Reject the conflated explanation; write explicitly scoped scenarios. |
| Closest Match | [Matching documentation](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/set-up-skill-based-routing#closest-match) describes skill/proficiency ordering. It does not establish the example's built-in 45-second progressive relaxation behavior. | Exclude the timed claim without separate primary evidence. Do not mistake absence of support for proof that no custom implementation could do it. |
| Native handoff and SIP | [Native context](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/context-variables-for-bot) and [SIP X-headers](https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-sip-x-header) have different applicability and prerequisites. The [official voice-agent module](https://learn.microsoft.com/en-us/training/modules/configure-voice-agents-contact-center/) also explicitly mentions SIP UUI context transfer. | Treat as scenario/applicability ambiguity, not a blanket claim that SIP is unsupported or the course is wrong. Verify the exact topology before approving an answer. |
| Telephony currency | [Migration guidance](https://learn.microsoft.com/en-us/dynamics365/contact-center/administer/migrate-from-azure-communication-services) lists 2026-09-30 new-customer phone-number restrictions and 2028-09-30 retirement of specified standalone ACS capabilities. Teams Phone Extensibility configurations are not affected by that retirement. | Date and scope older ACS examples. Do not claim all ACS or all Contact Center is retiring. |

Native context documentation reviewed here applies to standalone Contact Center/Customer Service; embedded behavior needs its own evidence. SIP X-header support is a real feature, with Direct Routing prerequisites in the referenced page. UUI and arbitrary X-headers must not be assumed interchangeable.

## Source conflicts are editorial work

For each candidate item, retain precise evidence, prerequisites, the strongest alternative answer, and a reviewer disposition. If sources do not settle the scenario, revise or exclude it. Do not transfer this decision to the learner.

The remaining community examples are unapproved research leads. Recheck each relevant claim during authoring; an existing answer key is not evidence. Use original questions and explanations, not copied repository or external exam text.
