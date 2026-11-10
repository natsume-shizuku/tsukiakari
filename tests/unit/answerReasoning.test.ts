import { describe, expect, it } from 'vitest';
import raw from '../../src/content/simulator-fixture-bank.json';
import type { ExamQuestion, MatchQuestion, HotspotQuestion, OrderQuestion, SelectionQuestion } from '../../src/domain';
import { validateQuestionBank } from '../../src/questionBankValidation';
import { answerReasoning } from '../../src/answerReasoning';
import { gradeQuestion, orderPositionId } from '../../src/testGrading';

const bank = validateQuestionBank(raw);
const find = <T extends ExamQuestion>(kind: ExamQuestion['kind']) => bank.questions.find(question => question.kind === kind && !question.groupId) as T;
const single = find<SelectionQuestion>('single'), multiple = find<SelectionQuestion>('multiple');
const match = find<MatchQuestion>('match'), hotspot = find<HotspotQuestion>('hotspot'), order = find<OrderQuestion>('order');
const placed = (placements: Record<string, string>) => ({ selectedOptionIds: [], placements });
const ids = (reasons: ReturnType<typeof answerReasoning>['incorrect']) => reasons.map(reason => reason.id);

describe('answerReasoning from the saved question and answer', () => {
  it('shows only the incorrectly selected single-answer explanation and retains snapshot-order labels', () => {
    const card = structuredClone(single);
    card.options.reverse();
    const chosen = card.options.find(option => !card.correctOptionIds.includes(option.id))!;
    card.optionExplanations[chosen.id] = 'An explanation saved with an older question revision.';
    const before = structuredClone(card);
    const result = answerReasoning(card, { selectedOptionIds: [chosen.id] });
    expect(result.incorrect).toEqual([{ id: chosen.id, label: 'A. ' + chosen.text,
      explanation: 'An explanation saved with an older question revision.', contexts: [] }]);
    expect(ids(result.remaining)).not.toContain(chosen.id);
    expect(result.incorrect.length + result.remaining.length).toBe(card.options.length);
    expect(card).toEqual(before);
  });
  it('does not call a correct partial multiple selection wrong because another correct answer was omitted', () => {
    const response = { selectedOptionIds: [multiple.correctOptionIds[0]] };
    expect(gradeQuestion(multiple, response, 'per-selection').state).toBe('partial');
    expect(gradeQuestion(multiple, response, undefined).state).toBe('wrong');
    const result = answerReasoning(multiple, response);
    expect(result.incorrect).toEqual([]);
    expect(result.remaining).toHaveLength(multiple.options.length);
  });
  it('shows the selected distractor of a partial multiple answer without promoting the correct selection', () => {
    const wrong = multiple.options.find(option => !multiple.correctOptionIds.includes(option.id))!.id;
    const result = answerReasoning(multiple, { selectedOptionIds: [multiple.correctOptionIds[0], wrong] });
    expect(ids(result.incorrect)).toEqual([wrong]);
    expect(ids(result.remaining)).toContain(multiple.correctOptionIds[0]);
  });
  it('deduplicates a reused wrong match token and lists each affected row', () => {
    const token = match.tokens.find(token => !match.rows.some(row => row.correctTokenId === token.id))!;
    const response = placed(Object.fromEntries(match.rows.map(row => [row.id, token.id])));
    const result = answerReasoning(match, response);
    expect(ids(result.incorrect)).toEqual([token.id]);
    expect(result.incorrect[0].contexts).toEqual(match.rows.map(row => 'Selected for: ' + row.label));
    expect(result.remaining.length).toBe(match.tokens.length - 1);
  });
  it('keeps correct reused-token matches out of the incorrect-placement context', () => {
    const [first, second] = match.rows;
    const result = answerReasoning(match, placed({ [first.id]: first.correctTokenId, [second.id]: first.correctTokenId }));
    expect(ids(result.incorrect)).toEqual([first.correctTokenId]);
    expect(result.incorrect[0].contexts).toEqual(['Selected for: ' + second.label]);
    expect(answerReasoning(match, placed({ [first.id]: first.correctTokenId })).incorrect).toEqual([]);
  });
  it('uses hotspot row-specific keys and omits correctly selected and unanswered rows', () => {
    const [first, second] = hotspot.rows;
    const wrong = first.options.find(option => option.id !== first.correctOptionId)!;
    const result = answerReasoning(hotspot, placed({ [first.id]: wrong.id, [second.id]: second.correctOptionId }));
    expect(ids(result.incorrect)).toEqual([wrong.id]);
    expect(result.incorrect[0].contexts).toEqual(['Selected for: ' + first.label]);
    expect(answerReasoning(hotspot, placed({ [first.id]: first.correctOptionId })).incorrect).toEqual([]);
  });
  it('explains misplaced order tokens with their selected positions, leaving correctly placed tokens collapsed', () => {
    const [first, second, third] = order.correctOrder;
    const result = answerReasoning(order, placed({ [orderPositionId(0)]: second, [orderPositionId(1)]: first, [orderPositionId(2)]: third }));
    expect(new Set(ids(result.incorrect))).toEqual(new Set([first, second]));
    expect(result.incorrect.find(reason => reason.id === first)?.contexts).toEqual(['Placed in position 2']);
    expect(result.incorrect.find(reason => reason.id === second)?.contexts).toEqual(['Placed in position 1']);
    expect(ids(result.remaining)).toContain(third);
    // Order grading is all-or-nothing, but a correct placement alone is still not a wrong choice.
    const partial = placed({ [orderPositionId(0)]: first });
    expect(gradeQuestion(order, partial, 'per-selection').state).toBe('wrong');
    expect(answerReasoning(order, partial).incorrect).toEqual([]);
  });
  it.each([single, multiple, match, hotspot, order])('keeps all existing explanations collapsed for skipped %s questions', card => {
    const result = answerReasoning(card, undefined);
    expect(result.incorrect).toEqual([]);
    expect(result.remaining.length).toBe(Object.keys(card.optionExplanations).length);
  });
  it('never invents reasoning when an older snapshot has no explanation for the selected option', () => {
    const card = structuredClone(single);
    const wrong = card.options.find(option => !card.correctOptionIds.includes(option.id))!.id;
    delete card.optionExplanations[wrong];
    const result = answerReasoning(card, { selectedOptionIds: [wrong] });
    expect(result.incorrect).toEqual([]);
    expect(result.remaining).toHaveLength(card.options.length - 1);
    expect(answerReasoning(card, { selectedOptionIds: ['missing-option'] }).incorrect).toEqual([]);
  });
});
