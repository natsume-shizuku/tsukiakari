import type { ExamQuestion, SelectionQuestion } from '../../src/domain';

/** Tests that exercise single and multiple-answer questions read their fields through this. */
export function sel(card: ExamQuestion | undefined): SelectionQuestion {
  return card as SelectionQuestion;
}
