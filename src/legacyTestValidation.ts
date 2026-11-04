import { z } from 'zod';
import { idSchema, publishedCardSchema, sourceSchema } from './validation';
const text = z.string().refine(value => value.trim().length > 0, 'Text must not be blank.');
const timestamp = z.number().int().nonnegative().max(253402300799999);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const unique = (ids: string[]) => new Set(ids).size === ids.length;
export const legacyTestAttemptSchema = z.strictObject({
  id: idSchema, packId: idSchema, mode: z.enum(['practice', 'exam']), startedAt: timestamp,
  packTitle: text.optional(), fixture: z.boolean().optional(), retryOf: idSchema.optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  deadlineAt: timestamp.nullable(), completedAt: timestamp.nullable(),
  questions: z.array(z.strictObject({ packId: idSchema, card: publishedCardSchema, sources: z.array(sourceSchema).min(1) })).min(50),
  responses: z.array(z.strictObject({ cardId: idSchema, selectedOptionId: idSchema.nullable(), revealed: z.boolean() })),
  result: z.strictObject({ correct: count, wrong: count, skipped: count }).nullable(),
}).superRefine((attempt, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!unique(attempt.questions.map(question => question.card.id))) issue('Test questions must be unique.');
  if (attempt.retryOf === attempt.id) issue('A retry cannot refer to itself.');
  for (const question of attempt.questions) {
    if (question.packId !== attempt.packId || question.card.kind !== 'mcq') issue('Every test question must be an MCQ from the selected pack.');
    if (!unique(question.sources.map(source => source.id)) || question.card.sourceIds.some(id => !question.sources.some(source => source.id === id))) issue('Snapshot sources must be unique and include every card reference.');
  }
  if (!unique(attempt.responses.map(response => response.cardId)) || attempt.responses.length !== attempt.questions.length) issue('Each test question needs exactly one response.');
  let correct = 0; let wrong = 0; let skipped = 0;
  for (const response of attempt.responses) {
    const card = attempt.questions.find(question => question.card.id === response.cardId)?.card;
    if (!card) { issue('Response refers to an unknown question.'); continue; }
    if (response.selectedOptionId !== null && !card.options?.some(option => option.id === response.selectedOptionId)) issue('Response option must belong to its question.');
    if (attempt.mode === 'exam' && response.revealed) issue('Exam responses cannot be revealed individually.');
    if (response.selectedOptionId === null) skipped++;
    else if (response.selectedOptionId === card.correctOptionId) correct++;
    else wrong++;
  }
  if (attempt.mode === 'practice' && attempt.deadlineAt !== null) issue('Practice tests cannot have deadlines.');
  if (attempt.mode === 'exam') {
    const duration = attempt.deadlineAt === null ? 0 : (attempt.deadlineAt - attempt.startedAt) / 60000;
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) issue('Exams need a deadline between one minute and 24 hours after starting.');
    if (attempt.durationMinutes !== undefined && duration !== attempt.durationMinutes) issue('Exam duration must match its saved deadline.');
    if (attempt.completedAt !== null && attempt.deadlineAt !== null && attempt.completedAt > attempt.deadlineAt) issue('Exam completion cannot be later than its deadline.');
  }
  if (attempt.completedAt === null) {
    if (attempt.result !== null) issue('Unfinished tests cannot contain results.');
  } else {
    if (attempt.completedAt < attempt.startedAt) issue('Completion cannot precede the start.');
    if (!attempt.result || attempt.result.correct !== correct || attempt.result.wrong !== wrong || attempt.result.skipped !== skipped) issue('Results must match the saved responses and answer snapshots.');
  }
});
