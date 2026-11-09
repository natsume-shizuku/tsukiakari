# AB-250 simulator blueprint

Format statistics and mechanics only. This file deliberately contains no question text, scenarios, options or answers from the analyzed dump, and none may be added.

Microsoft does not publish the AB-250 format mix. These shares mirror one community question set of 100 items and are an internal practice allocation, not a prediction of the real exam.

## Observed formats

| Format | Count of 100 | Mechanics |
|---|---|---|
| Drag and drop: match | 24 | Left tray of 4 to 5 tokens, vertical divider, titled table with requirement and answer columns, empty slot per row. 22 items have 2 rows, one has 3, one has 4. Every item allows a token to be used once, more than once, or not at all, so tokens stay in the tray. 1 point per row. |
| Drag and drop: order | 5 | Tray of 4 to 5 actions with grip handles. The answer area shows exactly the required number of empty positions, 3 or 4, so distractors stay behind. Tokens move rather than clone. No per-selection note, so 1 point, all or nothing. |
| Hotspot | 26 | Titled table with requirement and answer columns and a dropdown on each row. 25 items have 2 rows, one has 3. Each row has its own 3 or 4 options, and options may repeat between rows. 1 point per row. |
| Multiple select | 21 | Choose two (19) or three (2). Worded as either a complete solution (9) or part of the solution (12). 1 point per correct selection. |
| Single answer | 17 | 3 to 5 options. |
| Yes/No series | 4 | One shared scenario with a different proposed solution per item. No return once answered, and the items stay off the review screen. |
| Unusable | 3 | Printed without answer choices. Excluded from the shares below. |

Case studies make up 19 of the 100 items, across two fictional companies. Each is a long reference document with sections for background, current environment, users and roles, business requirements, technical requirements and issues. Their items lean interactive: 9 match, 4 order, 3 hotspot. A case study can be reviewed internally and is locked after leaving.

Stem shape: a short company scenario, a list of requirements, one goal starting "You need to", then the instruction.

## Published facts

Passing score 700. 120 minutes on the AB-250 page. Microsoft says most exams have about 40 to 60 questions. A scaled score is not a raw percentage, so any 700-scale figure in the app is labelled approximate. Labs and active screen exist in Microsoft's general list but did not appear in this set and are out of scope.

## Allocation

| Format | Share | First 128 |
|---|---:|---:|
| Drag and drop: match | 25% | 32 |
| Drag and drop: order | 5% | 7 |
| Hotspot | 27% | 34 |
| Multiple answer | 21% | 27 |
| Single answer | 16% | 20 |
| Yes/No series | 6% | 8 (2 series of 4) |

About 27 of the 128 sit inside 3 case studies of 9 items each, counted within the table. Domain split 22/41/15/15/22/13 follows the existing 17/32/12/12/17/10 shares.

## Assembly rules

A test of N questions places whole case studies first, about one per 50 questions, then one whole series. Groups are never split. The remaining slots are shared across standalone formats so the exam lands on these shares as closely as whole groups allow, always filling from the domain furthest below its quota. Domain counts finish within 1 of quota. If that cannot be met the exam does not start, and nothing is substituted. Practice can be shorter: under about 25 questions it has no case study, and under 50 no series, because groups are never split.

## Authoring rules

- Authors receive this blueprint, Microsoft Learn and the existing notes. They never receive the dump.
- Case studies use invented organizations, not Microsoft sample names such as Fabrikam, VanArsdel or Contoso.
- Instruction wording comes from the app by format, not from the item.
- Every new item goes through [the review process](../phase7/REVIEW_PROCESS.md), then a similarity check against the dump that reports only item IDs and scores.
