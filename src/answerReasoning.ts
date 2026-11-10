import type { ExamQuestion } from './domain';
import { isSelection, orderPositionId, type Answer } from './testGrading';

export interface AnswerReason { id: string; label: string; explanation: string; contexts: string[]; }

/** Use only the recorded explanation and key; an omission is not an incorrect selected choice. */
export function answerReasoning(card: ExamQuestion, answer: Answer | undefined): { incorrect: AnswerReason[]; remaining: AnswerReason[] } {
  const options = isSelection(card)
    ? card.options.map((option, index) => ({ id: option.id, label: String.fromCharCode(65 + index) + '. ' + option.text }))
    : card.kind === 'hotspot'
      ? card.rows.flatMap(row => row.options.map(option => ({ id: option.id, label: option.text })))
      : card.tokens.map(token => ({ id: token.id, label: token.text }));
  const wrong = new Map<string, string[]>();
  const add = (id: string | undefined, context?: string) => {
    if (!id) return;
    const contexts = wrong.get(id) ?? [];
    if (context && !contexts.includes(context)) contexts.push(context);
    wrong.set(id, contexts);
  };
  if (isSelection(card)) {
    for (const id of answer?.selectedOptionIds ?? []) if (!card.correctOptionIds.includes(id)) add(id);
  } else if (card.kind === 'order') {
    card.correctOrder.forEach((correct, index) => {
      const chosen = answer?.placements?.[orderPositionId(index)];
      if (chosen && chosen !== correct) add(chosen, 'Placed in position ' + (index + 1));
    });
  } else {
    for (const row of card.rows) {
      const correct = card.kind === 'match' ? card.rows.find(item => item.id === row.id)!.correctTokenId
        : card.rows.find(item => item.id === row.id)!.correctOptionId;
      const chosen = answer?.placements?.[row.id];
      if (chosen && chosen !== correct) add(chosen, 'Selected for: ' + row.label);
    }
  }
  const explained = options.filter(option => card.optionExplanations[option.id])
    .map(option => ({ ...option, explanation: card.optionExplanations[option.id], contexts: wrong.get(option.id) ?? [] }));
  return { incorrect: explained.filter(option => wrong.has(option.id)), remaining: explained.filter(option => !wrong.has(option.id)) };
}
