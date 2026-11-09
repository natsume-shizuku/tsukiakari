# Simulator question authoring brief

For agents writing or reviewing questions in the `ab250-simulator` bank. Read this, [the blueprint](EXAM_BLUEPRINT.md) and [the review process](../phase7/REVIEW_PROCESS.md) first.

## Non-negotiable rules

1. **Every question is original.** Build it from the official AB-250 skills and current Microsoft documentation. Never use, search for or open exam dumps, brain dumps, "practice exam" sites, exam-question aggregators or community answer keys. If a search result is one of these, do not open it.
2. **Evidence comes from `learn.microsoft.com` only.** A title, snippet or your own memory is not evidence. Open the page and find the claim. This product changes quickly, so prefer the current page over what you remember.
3. **If a page does not support a claim, the claim does not go in.** Rewrite the question or drop the concept. Do not ask the learner to settle a documentation dispute.
4. **Stay out of blocked objectives.** `docs/phase7/source-gaps.json` lists them. Items marked `partial-depth` need extra care.
5. **Invent organizations.** Never use Microsoft sample names such as Contoso, Fabrikam, Northwind or Adventure Works. Use plain, believable names and vary the industries.
6. **Only edit the files named in your task.** Bounded ownership is how parallel batches stay safe.

## What good looks like

Each question tests a decision someone makes when implementing Dynamics 365 Contact Center, not a memorized phrase.

- **Stem shape:** a short scenario, the requirements, one goal starting "You need to", then the question. Keep only what the decision needs.
- **Every requirement should matter.** Together they should rule out the strongest wrong answer.
- **Distractors are real features used in the wrong place.** They must be plausible to someone who half-knows the product, and clearly wrong to someone who knows it. Avoid joke options and "always" or "never" tells.
- **No leakage.** Do not repeat a distinctive word from the stem only in the correct answer. Keep options parallel in length and grammar.
- **State what the decision depends on:** deployment model, channel, permissions, or preview status.
- **Use Microsoft's current names:** Dynamics 365 Contact Center, Copilot Service workspace, Copilot Service admin center, customer service representatives (CSRs).
- **Do not write interface instructions** such as "drag these items". The app adds those by format.
- Avoid repeating a concept already tested in `src/content/published/ab250-bank.json`. A new angle on the same area is fine; the same decision with new names is not.

## Seven checks from the pilot

The pilot's independent review found no wrong answers, but it sent back almost half the questions for these reasons. Check each question against all of them before you finish, including the later ones below.

1. **Order means a real dependency.** For each neighbouring pair of steps, ask whether the later step truly cannot happen first. A numbered list on a page is not proof. Search other Microsoft pages for the reverse order. If the order is only conventional, merge those steps into one or choose another question. A learner who is right must never be marked wrong.
2. **Cover the case.** Hide the case study and try to work out the whole answer, including by elimination. If the stem or row labels carry the fact, the question does not depend on the case. Put the deciding fact in the exhibits, and do not restate it in the stem or a row label. "You need to resolve Issue 4" is usually enough.
3. **Test every row against every token,** including tokens used on other rows. Tokens are reusable, so a token that is right on one row can be a valid second answer on another.
4. **Do not build on a default nobody chooses.** If something is automatic, or the docs show no way to select it, it is not a decision. Ask what the behaviour causes, not which setting to pick.
5. **Do not hide a documentation conflict.** If two Microsoft pages disagree, avoid the claim. Explanations must never state one side as fact while your evidence notes admit the conflict. A distractor that can only be rejected because "Microsoft documents nothing about it" must be replaced with one that fails for a documented reason.
6. **No preview label does not mean generally available.** Where status matters, check release plans and release notes on learn.microsoft.com. State the status in the scenario when the answer depends on it, and avoid "no preview features" constraints unless you can prove the status.
7. **In a series, use different approaches.** Solutions should be real alternatives to the goal, not one design with add-ons. Do not attach something irrelevant to test whether the learner suspects a trap.

Also keep case exhibits consistent with each other and with every question, and keep each batch's facts inside what its scenario says is true.

The analytics calibration added six more:

8. **No working example.** Do not describe a person or setup that works beside ones that do not, or learners can score by spotting the difference without knowing the rule. Ask directly which ones fail.
9. **One documented way is not the only way.** If a distractor fails only because the docs do not mention it, add a requirement that genuinely rules it out.
10. **If you state a feature's role, also state whether it is on,** and check its default. An answer that sends someone to something disabled is wrong.
11. **Check 2 applies to standalone questions too:** the stem must not carry the answer by contrast.
12. **Keep correct options from being the longest.** Length is a tell. Make distractors as specific and complete as the answer.
13. **Evidence notes are part of the record.** They are reviewed and fingerprinted, so they need the same accuracy as learner-facing text. Do not claim something you did not confirm.
14. **Test wrong beliefs against the count.** In a "which two" question, a trap only works if a believable wrong rule names exactly two options. Otherwise the count gives the answer away.
15. **A Yes solution must be complete.** State every step it depends on, including publish, activate and assign. A careful learner should not be able to read an omission as the catch. Read each No solution for a word that gives the answer away.

The deployment review added five leak patterns:

16. **Do not clear distractors one by one.** If the stem rules out each wrong item, the leftovers are the answer. Keep a compliant decoy that looks like the correct items.
17. **A safe option beside a risky one answers itself.** Ask what the behaviour does instead.
18. **Name the surface, not the product.** A rule that sorts tasks by product boundary must be checked against release plans, because boundaries move. Refer to the specific tile or page.
19. **If the stem names a custom object, use that name in a distractor too,** or it marks the correct option.
20. **Do not turn one page's list into "only these".** Check whether another page adds a route.

The voice review added four more:

21. **Names must not answer the row.** If every token's name literally describes its row, at least one row must turn on a fact the names do not give, or that they mislead about.
22. **Check where the stem and the options overlap.** If the stem's words appear in exactly the number of options the question asks for, word matching solves it. Do not state the diagnosis in the stem. State the goal.
23. **Word parallel options alike.** One distractor phrased differently from the others is a tell, even when the phrase is accurate.
24. **Quote a phrase Microsoft does not define.** Use its exact words rather than paraphrasing them into a claim Learn does not make.

The digital channels review added six more:

25. **Do not restate a distractor in the negative.** A requirement such as "the conversation doesn't end" names the wrong action for the learner.
26. **Do not name what changed if only one option changes it.** "The score moved to a new variable" marks the one option that names a variable.
27. **Do not remove an option's only caveat in the setup.** If a setup sentence clears the one weakness of one option and names its type, it marks that option.
28. **A category is not a format.** A support table that lists "Document" does not say PDF. Use the table's own word.
29. **Check the procedure against the state model.** If one page says to reopen a closed conversation and another says closed conversations cannot be reopened, avoid the claim.
30. **State the setting a result depends on.** If an outcome only holds under a configuration such as keeping the same representative for the whole conversation, say that in the stem.
31. **Mirror-image options cancel out.** In a single-answer question, two options with the same steps in a different order both drop out when nothing makes the order matter. To keep the wrong belief, make one decoy strictly weaker than the other.
32. **Review a fix as new text.** A setup sentence that clears one option's caveat marks that option unless another option shares the caveat. A setting added to the stem to make an outcome hold needs its own dependencies checked, including defaults and preview status.

Do not worry about answer position. The app shuffles choices for each attempt.

## Formats

Every question has these fields, plus the fields for its `kind`:

```json
{ "id": "sim-example-q01", "revision": 1, "kind": "single", "domainId": "channels",
  "objectiveIds": ["D2.1.01"], "conceptId": "short-unique-kebab-id",
  "prompt": "Scenario, requirements, You need to..., question.",
  "answer": "The answer stated plainly.", "explanation": "Why, teaching the decision.",
  "sourceIds": ["sim-d2-s01"], "tags": ["domain:channels", "task:apply", "feature:short-kebab"],
  "optionExplanations": {}, "relatedNotes": [{ "packId": "contact-center-core", "noteId": "cc-d2-n01" }],
  "status": "draft" }
```

`optionExplanations` needs an entry for **every** choice ID, saying why it is right or why it fails here. Case-study and series questions also have `"groupId"`.

| `kind` | Extra fields | Rules |
|---|---|---|
| `single` | `options`, `correctOptionIds` | 4 or 5 options, one correct. Vary the correct position. |
| `multiple` | `options`, `correctOptionIds` | 4 or 5 options, 2 or 3 correct. The prompt says "two" or "three". Say whether each answer is a complete solution or part of the solution. |
| `match` | `tray`, `table`, `tokens`, `rows` | 4 to 6 tokens, 2 to 4 rows. At least one token is a distractor. A token may fill two rows when that is genuinely right. |
| `order` | `tray`, `tokens`, `correctOrder` | 3 or 4 steps from 4 to 6 tokens, so at least one is a distractor. The order must be a real dependency from the docs, not a preference. Tray order must not reveal it. Worth one point, all or nothing. |
| `hotspot` | `table`, `rows` | 2 or 3 rows, each with 3 or 4 of its own options. Option IDs are unique across rows. |

```json
{ "tray": "Actions", "table": { "title": "Short title", "rowHeading": "Requirement", "answerHeading": "Action" },
  "tokens": [{ "id": "a", "text": "..." }],
  "rows": [{ "id": "r1", "label": "...", "correctTokenId": "a" }] }
```

```json
{ "table": { "title": "Short title", "rowHeading": "Requirement", "answerHeading": "Configuration" },
  "rows": [{ "id": "r1", "label": "...", "options": [{ "id": "r1a", "text": "..." }], "correctOptionId": "r1a" }] }
```

```json
{ "tray": "Actions", "tokens": [{ "id": "a", "text": "..." }], "correctOrder": ["b", "a", "c"] }
```

**Yes/No series:** a group with `"kind": "series"`, one exhibit holding the shared scenario, and 4 questions. Each is `kind: "single"` with options `[{ "id": "yes", "text": "Yes" }, { "id": "no", "text": "No" }]`. Each prompt starts `Solution: ` and ends `Does the solution meet the goal?`. Each solution must be judged on its own, and the set should not be all Yes or all No.

**Case study:** a group with `"kind": "case-study"` and exhibits titled Background, Current environment, Business requirements, Technical requirements and Issues. It should read like a real organization with real constraints, and be long enough that a learner has to go back to it. Its questions must genuinely depend on the case, so that they cannot be answered without reading it.

```json
{ "id": "sim-case-example", "kind": "case-study", "title": "Organization name",
  "exhibits": [{ "id": "background", "title": "Background", "body": "..." }] }
```

## Bundle

`src/content/simulator/<batch>.json` has exactly `sources`, `groups`, `questions` and `editorial`. Sources are `{ "id": "sim-...", "title": "...", "url": "https://learn.microsoft.com/..." }`. Reuse the same ID and URL if another batch already registered a page.

Each `editorial` entry:

```json
{ "id": "sim-example-q01", "revision": 1, "domainId": "channels", "conceptId": "short-unique-kebab-id",
  "objectiveIds": ["D2.1.01"], "level": "advanced", "author": "your agent name", "authoredAt": "2026-11-05",
  "status": "source-reviewed",
  "evidence": [{ "sourceId": "sim-d2-s01", "section": "Exact page section", "claim": "What it supports", "applicability": "Where this applies" }],
  "duplicateCheck": "What you compared this against." }
```

Find objectives in `docs/phase7/objective-coverage.csv` and related notes in `src/content/published/study-pack.json`. Check structure with:

```bash
node scripts/compile-simulator-bank.mjs --draft-check src/content/simulator/<batch>.json
```

That only checks structure. It says nothing about whether a question is right.

## Independent review

You did not write this batch, and that is the point. Open the sources yourself and try to break each question.

- Does the evidence directly support the answer as stated, today?
- Is the full answer unambiguous? Argue for the strongest alternative. If it holds up, the question fails.
- Does every distractor really fail under the stated conditions, and is each explanation true?
- For `order`, is every neighbouring pair a documented dependency? Look for a Microsoft page showing the reverse.
- Do all 32 numbered checks above hold?
- For a case study, does the answer truly depend on the case, and do the exhibits contradict anything?
- Is it distinct from other questions in the batch and from the accepted bank?

Write `docs/phase8/reviews/<batch>-review.json`, an array with one entry per question:

```json
{ "id": "sim-example-q01", "revision": 1, "reviewer": "your agent name", "reviewedAt": "2026-11-05",
  "decision": "approved", "rationale": "Why it stands.", "findings": [],
  "sourceChecks": [{ "sourceId": "sim-d2-s01", "supported": true, "section": "Exact section", "accessedAt": "2026-11-05", "claimReviewedAt": "2026-11-05", "notes": "What you confirmed." }] }
```

Use `"decision": "needs-revision"` with concrete `findings` when something fails, and say what would fix it. Never approve what you did not open. Then fill the fingerprints:

```bash
node scripts/compile-simulator-bank.mjs --stamp <batch>
```

Any later edit to a question or its case study breaks its fingerprint, and it has to be reviewed again.
