# Final digital-channel author report

Author: /root/finish_digital. Actual primary-source review: 2026-11-02. Status: source-reviewed; independent review required. No approval fingerprints or generated catalog outputs were written.

## Inventory and teaching scope

Seven notes (cc-d2-n09..15), 22 cards (cc-d2-c25..45 plus parent-approved extra core c88):15 recall and7 application MCQs, zero exam items.18 registered primary Microsoft Learn sources were opened. The official AB-250 guide was reopened and positional objective order checked. Source sections and deployment/channel applicability are recorded in editorial evidence.

The seven coherent readers cover record-routing prerequisites; web/native/backend integration choices; state/presence/consult/transfer; masking/attachments; event messages and enhanced forms; timeline/CIF; survey publication/deployment. New basics are distinct from earlier prechat/authentication/customer-match/widget-placement work. MCQ correct positions are A/B/C/D/A/B/C; alternatives were considered under explicit scenario scope. Introductory to moderate applications; no actual exam difficulty claim.

## Objective traceability

| Objective | New note | Useful card evidence |
|---|---|---|
| D2.1.02 record channel | n09 | c25,c26,c27 |
| D2.1.03 digital channels | n10 + existing n06 | Existing Twilio c16,c17,c22; n10 adds scoped WhatsApp/provider sequence |
| D2.1.08 live chat SDK | n10 | c30 tests actual startChat precedence, distinct from prior readiness/context-provider initial setup |
| D2.1.10 native Messaging SDK | n10 | c28 |
| D2.1.11 custom Messaging APIs | n10 | c29 |
| D2.3.01 context | n13 + existing n02 | Existing c02/c03/c06; n13 adds automated-message substitution scope |
| D2.3.02 customer identification | Existing n01 | Existing c01/c05; no duplicate authored |
| D2.3.03 auto closure | n11 | c31 |
| D2.3.04 consult/transfer | n11 | c33 |
| D2.3.05 masking | n12 | c34,c36 |
| D2.3.06 custom presence | n11 | c32 |
| D2.3.07 messages | n13 | c37,c39 |
| D2.3.08 active conversation | n13 | c38 |
| D2.3.09 timeline | n14 | c88 (extra core approved by parent) |
| D2.3.10 timeline connectors | n14 | c40,c42 |
| D2.3.11 CIF | n14 | c41 |
| D2.3.12 manage conversations | n11 | c33 (consult/transfer ownership; note also explains reroute) |
| D2.3.13 feedback | n15 | c43,c44,c45 |
| D2.3.14 attachments | n12 | c35 |

These establish useful sourced foundations, not exhaustive coverage of every setting/API method. Earlier D2.1 chat/widget/proactive/prechat/quickreply/auth/translation/customer-setting material remains canonical and unchanged. Voice, outbound, WFM and architecture are assigned to other authors.

## Source findings and boundaries

- Current mobile product documentation explicitly recommends native iOS/Android SDKs, describes authenticated persistent chat and Azure Notification Hub support. The archived release plan was not used as delivery evidence. The page has a code-sample inconsistency around start/close calls; no copied code or inference from that example is taught.
- Messaging API configuration has managed-identity webhook-authentication material in the opened current page beyond old search snippets. This reader teaches registration/authentication/webhook/workstream layers, not an exhaustive security implementation or token-scope recipe.
- WhatsApp ACS guidance is sourced from the opened course unit as a documented teaching flow, with an explicit requirement to verify current provider availability/geography before deployment. No procurement recommendation, numeric messaging-window rule or license guarantee is taught.
- Automated and manual masking are distinct. For asynchronous customer-data masking the representative UI scope matters. Manual text masking does not erase retained voice audio. No claim of removing data from all external customer devices is made.
- Consult documentation has overlapping capacity statements. No capacity rule for ordinary consult is taught; only ownership/private assistance and separate add-to-customer behavior. Transfer and reroute require appropriate administrator enablement.
- Active Conversation material uses Contact Center-specific documentation rather than bringing Customer Service-only case cards into standalone Contact Center. App setting values override environment values.
- Timeline custom connectors are IRecordSource JavaScript resources, not Power Automate connectors; no secrets in client files. Export dependencies require explicit inclusion.
- Survey publication requires a Dataverse connection; digital channel attachment uses published admin-created surveys. New stored variables begin MCS_. Environment-copy caveat is explicit. No multilingual/voice consent behavior is inferred here.

## Validation and remaining work

JSON identities/counts were checked by the author; parent integration runs strict app validation and the independent review gates. Independent reviewer must reopen cited sections, challenge strongest alternatives, check duplicate disposition and approve current exact revisions. No sources were marked independently approved by the author. No prior source/card/note, learner storage, database contract, scheduler or test bank was changed.
