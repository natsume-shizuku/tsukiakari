import type { ExamQuestion, QuestionFormat, QuestionGroup, SelectionQuestion, TestAttempt, TestResponse } from './domain';

export const QUESTION_FORMATS: readonly QuestionFormat[] = ['single', 'multiple', 'match', 'order', 'hotspot', 'series'];
export type QuestionState = 'correct' | 'partial' | 'wrong' | 'skipped';
export interface QuestionGrade { earned: number; possible: number; state: QuestionState; }
export type Answer = Pick<TestResponse, 'selectedOptionIds' | 'placements'>;

export function isSelection(card: ExamQuestion): card is SelectionQuestion {
  return card.kind === 'single' || card.kind === 'multiple';
}
export function orderPositionId(index: number): string { return 'position-' + (index + 1); }
export function questionFormat(card: ExamQuestion, groups: readonly QuestionGroup[] = []): QuestionFormat {
  return groups.find(group => group.id === card.groupId)?.kind === 'series' ? 'series' : card.kind;
}

/** How many separate choices the learner must make to complete this question. */
export function requiredSelections(card: ExamQuestion): number {
  if (isSelection(card)) return card.correctOptionIds.length;
  return card.kind === 'order' ? card.correctOrder.length : card.rows.length;
}
function placementCount(answer: Answer | undefined): number { return Object.keys(answer?.placements ?? {}).length; }
export function isAnswered(answer: Answer | undefined): boolean {
  return Boolean(answer?.selectedOptionIds.length) || placementCount(answer) > 0;
}
export function isComplete(card: ExamQuestion, answer: Answer | undefined): boolean {
  return (isSelection(card) ? answer?.selectedOptionIds.length ?? 0 : placementCount(answer)) === requiredSelections(card);
}

function correctPlacements(card: Exclude<ExamQuestion, SelectionQuestion>, placements: Record<string, string>): number {
  if (card.kind === 'order') return card.correctOrder.filter((id, index) => placements[orderPositionId(index)] === id).length;
  if (card.kind === 'match') return card.rows.filter(row => placements[row.id] === row.correctTokenId).length;
  return card.rows.filter(row => placements[row.id] === row.correctOptionId).length;
}

/** The one place a response is judged. Scoring is absent on attempts from before Phase 8. */
export function gradeQuestion(card: ExamQuestion, answer: Answer | undefined, scoring: TestAttempt['scoring']): QuestionGrade {
  if (isSelection(card)) {
    const selected = answer?.selectedOptionIds ?? [];
    const hits = selected.filter(id => card.correctOptionIds.includes(id)).length;
    const exact = selected.length === card.correctOptionIds.length && hits === selected.length;
    if (!scoring || card.kind === 'single') return { earned: exact ? 1 : 0, possible: 1, state: !selected.length ? 'skipped' : exact ? 'correct' : 'wrong' };
    return { earned: hits, possible: card.correctOptionIds.length, state: !selected.length ? 'skipped' : exact ? 'correct' : hits ? 'partial' : 'wrong' };
  }
  const placements = answer?.placements ?? {};
  const hits = correctPlacements(card, placements);
  if (card.kind === 'order') {
    const exact = hits === card.correctOrder.length;
    return { earned: exact ? 1 : 0, possible: 1, state: !placementCount(answer) ? 'skipped' : exact ? 'correct' : 'wrong' };
  }
  return { earned: hits, possible: card.rows.length, state: !placementCount(answer) ? 'skipped' : hits === card.rows.length ? 'correct' : hits ? 'partial' : 'wrong' };
}

/** Returns a message when an answer does not fit its question, otherwise null. */
export function responseProblem(card: ExamQuestion, answer: Answer): string | null {
  if (isSelection(card)) {
    if (answer.selectedOptionIds.some(id => !card.options.some(option => option.id === id))) return 'Response option must belong to its question.';
    if (answer.selectedOptionIds.length > card.correctOptionIds.length) return 'Response exceeds the question selection count.';
    return answer.placements === undefined ? null : 'This question does not take placed answers.';
  }
  if (answer.selectedOptionIds.length) return 'This question takes placed answers.';
  const placements = Object.entries(answer.placements ?? {});
  if (card.kind === 'order') {
    const slots = card.correctOrder.map((_, index) => orderPositionId(index));
    if (placements.some(([slot, token]) => !slots.includes(slot) || !card.tokens.some(option => option.id === token))) return 'Response option must belong to its question.';
    return new Set(placements.map(([, token]) => token)).size === placements.length ? null : 'An action can only fill one position.';
  }
  const fits = card.kind === 'match'
    ? placements.every(([rowId, chosen]) => card.rows.some(row => row.id === rowId) && card.tokens.some(token => token.id === chosen))
    : placements.every(([rowId, chosen]) => card.rows.find(row => row.id === rowId)?.options.some(option => option.id === chosen));
  return fits ? null : 'Response option must belong to its question.';
}
