# AI and voice-agent completion author report

Author: /root/finish_deployment. Actual source review:2026-11-02. Eight notes,16core recall cards,8applicationMCQs,18registered primary Microsoft Learn pages and32editorialrecords. Source-reviewed; independentreviewpending. No approvals or generated files changed.

## Objective evidence

| Objective | New evidence | Scope |
|---|---|---|
| D3.1.01 summaries | n03/c07 | Customer Service case-summary exclusions; pilot retains standalone conversation-summary setup |
| D3.1.02 Ask a question | n03/c09 | Feature/source compatibility; pilot has profile/filter selection |
| D3.1.03 knowledge | n03/c08/c09 | Latest published articles,UIlanguage and supported source paths |
| D3.1.04 plugins/tools | n04/c10 | Current CopilotStudio extensibility production-ready-preview path; tools/configuration instead of stale legacy UI |
| D3.1.05 analytics | n04/c11/c12 | Copied responses versus generated responses and unsupported accuracy inference; standalone report |
| D3.1.06 smart assist | n05/c13–15 | CustomAzureBotService build,user,workstream and runtime timing |
| D3.2.01 IVR/orchestration | n06/c16 | Basic/classic versus real-time/generative; nativeworkstream/channel prerequisite |
| D3.2.02 variables | n06/c17 | Explicit topic output contract complements pilot global/session scope |
| D3.2.03 securevoice | n07/c19/c21 | Sensitive-variable boundary and secure external-contact capture override |
| D3.2.04 recording | n07/c20 | Inboundagent consent topic+workstream dependency; silence/default caveat |
| D3.2.05 SIP | n08/c22–24 | StaticUUI versus variableXheaders,DirectRouting and incomingprefix schema |
| D3.2.06 real-time | n09/c25/c26 | One-way type selection and agent voice setting ownership |
| D3.2.07 DTMF/NLU/speech | n06/c18 | Question/globalkeyprecedence; n06alsoexplainsintent/trigger orchestration and speech/keypadtesting |
| D3.2.08 voice triggers | n10/c28 | Explicit transfer action after system/topic trigger withconnectedhub |
| D3.2.09 bestpractices | n09/c27 | Semantic/serverVAD decision for pausing callers; distinct from sibling outboundgreeting/tool-fallback scenarios |
| D3.2.10 multilingual | n10/c29/c30 | Authored-stringmaintenance,recognition-regionrepublish andvoice-path testing |

All mappings support scoped claims, not exhaustive mastery of every possible feature under a broad objective. Real-time Speech wording in the blueprint is mapped to actual current real-time voice-agent product/configuration documentation, not an invented product rename.

## Source and product caveats

- Full cited sections were opened, including current managedagent extension restrictions and existing-plugin continuity. The current extension page is production-ready preview and moves configuration to CopilotStudio. Legacy prompt-plugin tutorials are not presented as the current interface.
- Smartassist administration says built-in case/knowledge suggestions are unsupported fromJune2,2025. The customAzureBotService route remains documented. The developer sample references old suggestions; the note cautions against inferring current built-in support from that sample. CopilotStudioagents are not supported customsmartassist agents.
- Standard-harness basic voice versus real-time features are explicitly scoped. Enablevoice is notTelephony provisioning. Do not apply a basic-voice detail to every realtime model.
- Consent-basedrecording is inbound+voiceagent only. Workstreamtoggle alone does not prompt. Sample silence can become implicitconsent; missingtopic canrecordwithoutprompt. This material is product behavior, not legalcompliance advice or a guarantee of zero capture beforeconsent.
- Sensitive data flags do not prevent Dataverse/external persistence/customlogging. Secure contact recording/transcription overrides are separate from consent.
- SIPUUI text remains static andDirectRouting-specific; currentXheader documentation permitsvariable-backedoutgoingentries. Incominglowercasex-prefix normalization is distinct from thecase of thefullname.
- Secureconsultconfiguration article labels preview while release26092 callsGA. No question tests its release label or universalavailability; reported as a source-status conflict requiring tenant-specificverification. Configuration behavior is scoped to the documentedfeaturewhereprovisioned.
- Realtime configuration voice choice is one-way and voicebelongsCopilotStudio. VADcardtestsmeaning-basedversusaudio-basedsetting, not a guarantee everycallerproblem disappears.
- Multilingualnote avoids applying browserlocale detection tophonecalls, and distinguishes generatedmessages from maintainedauthoredtranslations.

The eighteen teaching sourceURLs are registered in the bundle. Research also opened the officialAB250guide and identified the secureconsultstatusconflict in https://learn.microsoft.com/en-us/dynamics365/released-versions/dynamics365-omnichannel/26092 ; this conflict is not counted as an independently approved claim. No examdump was used; a broad search happened to return an unrequested dump listing and its contents were not opened or used.

## Distinctness and validation

Compared existingD3pilotnotes/cards and siblingoutboundplan. New concepts do not repeat globalvariablelifetime,ANIcopying,representativefiltertype or profileaccess. Core/application siblings teach distinct recalls and scoped decisions. Correctdisplaypositions A/D/B/C/B/A/D/C are balanced without a simple repeatingcycle. EightMCQs use explicitone-answerkeys and explanations. Item/schema/reference validation is performed beforehandoff; full integration/browser/Lighthousechecks remain lead-owned. Independentreviewmustchallenge distractors andapprove exactfingerprints.

Revision 2, 2026-11-03: independent review requested seven MCQ alternative improvements. Updated adjacent feature/configuration misconceptions and explicit elimination reasoning; no correct answer identity or position changed. Awaiting independent recheck.
