import type { TestAttempt, TestExposure } from './domain';
import { legacyTestAttemptSchema } from './legacyTestValidation';
import { testAttemptSchema, testExposureSchema } from './validation';

/** Validate the old key and result before converting; never regrade against live content. */
export function migrateLegacyTestAttempt(input: unknown): TestAttempt {
  const legacy = legacyTestAttemptSchema.parse(input);
  const { packId, packTitle, questions, responses, ...rest } = legacy;
  return testAttemptSchema.parse({
    ...rest, bankId: packId, ...(packTitle === undefined ? {} : { bankTitle: packTitle }), bankVersion: 'legacy-v1',
    questions: questions.map(({ packId: ownerId, card, sources }) => ({
      bankId: ownerId, domainTitle: 'Unclassified (legacy)', sources,
      card: {
        id: card.id, revision: card.revision, kind: 'single', domainId: 'legacy-unclassified',
        objectiveIds: [], conceptId: card.id, prompt: card.prompt, answer: card.answer,
        explanation: card.explanation, sourceIds: card.sourceIds, tags: card.tags,
        options: card.options!, correctOptionIds: [card.correctOptionId!],
        optionExplanations: Object.fromEntries(card.options!.map(option => [option.id,
          'No per-option explanation was recorded in this legacy attempt.'])),
        relatedNotes: card.noteIds.map(noteId => ({ packId: ownerId, noteId })),
        // Migration preserves history; it does not give old items editorial approval.
        status: 'draft',
      },
    })),
    responses: responses.map(({ cardId, selectedOptionId, revealed }) => ({
      cardId, selectedOptionIds: selectedOptionId === null ? [] : [selectedOptionId], revealed,
    })),
  });
}

/** One bounded latest-exposure record per bank/question; abandoned starts remain represented. */
export function collectTestExposures(attempts: TestAttempt[], existing: TestExposure[] = []): TestExposure[] {
  const records = new Map<string, TestExposure>();
  for (const input of existing) {
    const value = testExposureSchema.parse(input);
    const previous = records.get(value.id);
    if (!previous || previous.lastSeenAt < value.lastSeenAt) records.set(value.id, value);
  }
  for (const attempt of attempts) {
    for (const question of attempt.questions) {
      const id = JSON.stringify([attempt.bankId, question.card.id]);
      const previous = records.get(id);
      if (!previous || previous.lastSeenAt < attempt.startedAt) records.set(id, {
        id, bankId: attempt.bankId, questionId: question.card.id, lastSeenAt: attempt.startedAt,
      });
    }
  }
  return [...records.values()].sort((a, b) => a.id.localeCompare(b.id, 'en'));
}
