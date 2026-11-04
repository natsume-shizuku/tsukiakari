# Independent review: 7D2 digital

Reviewer: /root/chat_review. Actual source review: 2026-11-02. Author: /root/digital_finish. Final decision: all12 items approved at their current revision/fingerprint, following two MCQ revisions.

## Review findings and resolution

- c22 revision1 used an implausible operating-hours-label alternative. Revision2 replaces it with a real queue association and scopes the decision to provider ingress before work assignment. The correct callback answer remains supported and unambiguous.
- c24 revision1 disclosed that portal tracking was missing, effectively repeating the recall answer. Revision2 describes a visible empty tab and working live chat, asking which dependency to verify. Its alternatives now distinguish nearby customer-context features. Rechecked the exact revised text and explanations before approval.
- No unresolved factual contradiction or answer-key blocker remains. Revision history is preserved in [author revision log](7d2-digital-revisions.json).

## Primary evidence and mapping

Opened all five registered primary pages and rechecked official-guide D2.1.03 (digital channels), .12 (translation) and .13 (customer settings). These mappings are partial evidence, not complete coverage.

- [Configure an SMS channel for Twilio](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/configure-sms-channel-twilio): Prerequisites; Get Twilio account details; Establish a connection; Twilio account and phone number validation. Verified US-number scope, provider consent, secure-column prerequisite, inbound URL in number Messaging settings and credential-only validation.
- [Enable real-time translation of conversations](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-real-time-translation): Prerequisites; Enable real-time translation; Enable score-based language detection. Verified web-resource workflow, representative input language, Azure global endpoint and history-based detection. No release-plan availability inferred.
- [Add a web resource for real-time translation](https://learn.microsoft.com/en-us/dynamics365/customer-service/develop/add-web-resource-real-time-translation): Add a web resource; Upload the web resource file. Verified customization, upload, publication and URL registration of translation JavaScript.
- [Set up visitor location detection](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/geo-location-provider): Availability note; Create a geo location provider record; Enable visitor location detection. Verified existing Bing Maps Enterprise restriction through June30,2028, exclusion of new/Azure Maps customers, provider association and browser permission.
- [Enable self-service settings for customer actions](https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/enable-self-service-settings): Applicability; Prerequisites; Enable self-service settings. Verified standalone scope, portal code/history prerequisite and enabled Self service tab.

## Item decisions

- **cc-d2-n06**, revision1: The provider/account/workstream sequence, scoped number support and callback versus validation distinction are supported; delivery testing is useful author guidance.
- **cc-d2-n07**, revision1: Published web-resource procedure is accurately scoped. It does not equate a release-plan date with delivered behavior.
- **cc-d2-n08**, revision1: Accurately separates legacy location eligibility/browser permission from standalone portal-history integration.
- **cc-d2-c16**, revision1: The documented provider connection places the workstream inbound URL in the selected number Messaging settings.
- **cc-d2-c17**, revision1: Validation tests SID/token; the article treats actual inbound callback delivery separately.
- **cc-d2-c18**, revision1: The configured service plus published JavaScript integration are prerequisites of this stated workflow.
- **cc-d2-c19**, revision1: The opened administration article explicitly specifies the Azure global endpoint.
- **cc-d2-c20**, revision1: Browser sharing remains required even for an eligible configured location feature.
- **cc-d2-c21**, revision1: Developer-supplied action history is an explicit prerequisite, distinct from enabling its tab.
- **cc-d2-c22**, revision2: Revision2 scopes diagnosis to provider ingress, making callback verification unambiguous. Queue association is a real subsequent routing check; session template and language do not configure provider ingress.
- **cc-d2-c23**, revision1: History-based detection addresses one-off language switches. Display/widget locales target other settings; substituting the portal URL breaks resource registration rather than detection.
- **cc-d2-c24**, revision2: Revision2 presents symptoms without supplying the missing implementation. History integration is the prerequisite; required survey answers, location keys and language choices do not provide preceding actions.

## Distinctness and limits

Compared existing pilot/7D1 content and the sibling chat bundle. These concepts add provider delivery, translation dependencies/detection and customer-context dependencies; they do not repeat authentication, standard contact matching, survey/context-variable setup or widget script placement. Recall and application siblings reinforce one concept through a distinct diagnostic decision.

MCQ correct positions are B/C/D. Reviewed the full alternative sets, with revisions detailed above. These are introductory to moderate application checks, not a claim about actual exam difficulty. Current primary documentation governs the web-resource workflow; archived roadmap timing does not establish general availability. Source checks and fingerprints apply to this exact content. Independent agent review is not human expert certification; app/browser checks remain integration work.
