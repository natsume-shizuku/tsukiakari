import { describe, expect, it } from 'vitest';
import raw from '../../src/content/simulator-fixture-bank.json';
import type { ExamQuestion, HotspotQuestion, MatchQuestion, OrderQuestion, SelectionQuestion } from '../../src/domain';
import { validateQuestionBank } from '../../src/questionBankValidation';
import { gradeQuestion, isAnswered, isComplete, orderPositionId, questionFormat, requiredSelections, responseProblem } from '../../src/testGrading';

const bank = validateQuestionBank(raw);
const find = <T extends ExamQuestion>(test: (question: ExamQuestion) => boolean) => bank.questions.find(test) as T;
const match = find<MatchQuestion>(question => question.kind === 'match' && question.rows.length === 2);
const order = find<OrderQuestion>(question => question.kind === 'order');
const hotspot = find<HotspotQuestion>(question => question.kind === 'hotspot' && question.rows.length === 2);
const multiple = find<SelectionQuestion>(question => question.kind === 'multiple' && question.correctOptionIds.length === 2);
const single = find<SelectionQuestion>(question => question.kind === 'single' && !question.groupId);
const none = { selectedOptionIds: [] };
const placed = (placements: Record<string, string>) => ({ selectedOptionIds: [], placements });
const wrongToken = (card: MatchQuestion, rowIndex: number) => card.tokens.find(token => token.id !== card.rows[rowIndex].correctTokenId)!.id;

describe('gradeQuestion', () => {
  it('keeps exact-set scoring for attempts from before Phase 8', () => {
    const [first, second] = multiple.correctOptionIds;
    const wrong = multiple.options.find(option => !multiple.correctOptionIds.includes(option.id))!.id;
    expect(gradeQuestion(multiple, { selectedOptionIds: [first, second] }, undefined)).toEqual({ earned: 1, possible: 1, state: 'correct' });
    expect(gradeQuestion(multiple, { selectedOptionIds: [first, wrong] }, undefined)).toEqual({ earned: 0, possible: 1, state: 'wrong' });
    expect(gradeQuestion(multiple, none, undefined)).toEqual({ earned: 0, possible: 1, state: 'skipped' });
  });
  it('gives one point per correct selection on simulator attempts', () => {
    const [first, second] = multiple.correctOptionIds;
    const wrong = multiple.options.filter(option => !multiple.correctOptionIds.includes(option.id)).map(option => option.id);
    expect(gradeQuestion(multiple, { selectedOptionIds: [first, second] }, 'per-selection')).toEqual({ earned: 2, possible: 2, state: 'correct' });
    expect(gradeQuestion(multiple, { selectedOptionIds: [first, wrong[0]] }, 'per-selection')).toEqual({ earned: 1, possible: 2, state: 'partial' });
    expect(gradeQuestion(multiple, { selectedOptionIds: [wrong[0], wrong[1]] }, 'per-selection')).toEqual({ earned: 0, possible: 2, state: 'wrong' });
    expect(gradeQuestion(single, { selectedOptionIds: single.correctOptionIds }, 'per-selection')).toEqual({ earned: 1, possible: 1, state: 'correct' });
  });
  it('scores a match question by row', () => {
    const [a, b] = match.rows;
    expect(gradeQuestion(match, placed({ [a.id]: a.correctTokenId, [b.id]: b.correctTokenId }), 'per-selection')).toEqual({ earned: 2, possible: 2, state: 'correct' });
    expect(gradeQuestion(match, placed({ [a.id]: a.correctTokenId, [b.id]: wrongToken(match, 1) }), 'per-selection')).toEqual({ earned: 1, possible: 2, state: 'partial' });
    expect(gradeQuestion(match, placed({ [a.id]: a.correctTokenId }), 'per-selection')).toEqual({ earned: 1, possible: 2, state: 'partial' });
    expect(gradeQuestion(match, placed({ [a.id]: wrongToken(match, 0) }), 'per-selection')).toEqual({ earned: 0, possible: 2, state: 'wrong' });
    expect(gradeQuestion(match, placed({}), 'per-selection')).toEqual({ earned: 0, possible: 2, state: 'skipped' });
  });
  it('scores an order question all or nothing', () => {
    const placements = Object.fromEntries(order.correctOrder.map((id, index) => [orderPositionId(index), id]));
    expect(gradeQuestion(order, placed(placements), 'per-selection')).toEqual({ earned: 1, possible: 1, state: 'correct' });
    const swapped = { ...placements, [orderPositionId(0)]: order.correctOrder[1], [orderPositionId(1)]: order.correctOrder[0] };
    expect(gradeQuestion(order, placed(swapped), 'per-selection')).toEqual({ earned: 0, possible: 1, state: 'wrong' });
    expect(gradeQuestion(order, placed({ [orderPositionId(0)]: order.correctOrder[0] }), 'per-selection').state).toBe('wrong');
  });
  it('scores a hotspot question by row', () => {
    const [a, b] = hotspot.rows;
    expect(gradeQuestion(hotspot, placed({ [a.id]: a.correctOptionId, [b.id]: b.correctOptionId }), 'per-selection')).toEqual({ earned: 2, possible: 2, state: 'correct' });
    const wrong = b.options.find(option => option.id !== b.correctOptionId)!.id;
    expect(gradeQuestion(hotspot, placed({ [a.id]: a.correctOptionId, [b.id]: wrong }), 'per-selection')).toEqual({ earned: 1, possible: 2, state: 'partial' });
  });
});

describe('answer helpers', () => {
  it('separates answered from complete', () => {
    const [a, b] = match.rows;
    expect(isAnswered(placed({}))).toBe(false);
    expect(isAnswered(placed({ [a.id]: a.correctTokenId }))).toBe(true);
    expect(isComplete(match, placed({ [a.id]: a.correctTokenId }))).toBe(false);
    expect(isComplete(match, placed({ [a.id]: a.correctTokenId, [b.id]: b.correctTokenId }))).toBe(true);
    expect(requiredSelections(order)).toBe(order.correctOrder.length);
  });
  it('treats a Yes/No item as a series format', () => {
    const series = bank.questions.find(question => question.groupId?.startsWith('fixture-series'))!;
    expect(series.kind).toBe('single');
    expect(questionFormat(series, bank.groups)).toBe('series');
    expect(questionFormat(single, bank.groups)).toBe('single');
  });
  it('allows a token to fill two rows in a match question', () => {
    const [a, b] = match.rows;
    expect(responseProblem(match, placed({ [a.id]: a.correctTokenId, [b.id]: a.correctTokenId }))).toBeNull();
  });
  it('rejects an action that fills two order positions', () => {
    const id = order.correctOrder[0];
    expect(responseProblem(order, placed({ [orderPositionId(0)]: id, [orderPositionId(1)]: id }))).toMatch(/one position/);
  });
  it('rejects answers that do not belong to the question', () => {
    const [a] = match.rows;
    expect(responseProblem(match, placed({ 'unknown-row': a.correctTokenId }))).toMatch(/belong/);
    expect(responseProblem(match, placed({ [a.id]: 'unknown-token' }))).toMatch(/belong/);
    expect(responseProblem(hotspot, placed({ [hotspot.rows[0].id]: hotspot.rows[1].options[0].id }))).toMatch(/belong/);
    expect(responseProblem(order, placed({ 'position-9': order.tokens[0].id }))).toMatch(/belong/);
    expect(responseProblem(match, { selectedOptionIds: [match.tokens[0].id] })).toMatch(/placed answers/);
    expect(responseProblem(single, placed({}))).toMatch(/placed answers/);
  });
});
