import { z } from 'zod';
import type { StudyPack } from './domain';

/** IDs are preserved verbatim. Never normalize or regenerate imported identities. */
export const idSchema = z.string().min(1).refine(value => value.trim() === value && value.trim().length > 0, 'Identity must not be blank or padded.');
const text = z.string().refine(value => value.trim().length > 0, 'Text must not be blank.');
const timestamp = z.number().int().nonnegative().max(253402300799999);
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
function unique(values: string[]): boolean { return new Set(values).size === values.length; }
const identifiers = z.array(idSchema).refine(unique, 'References must be unique.');
const tags = z.array(text).refine(unique, 'Tags must be unique.');

export const sourceSchema = z.strictObject({
  id: idSchema, title: text,
  url: z.url().refine(value => new URL(value).protocol === 'https:', 'Sources must use HTTPS.'),
});
const topicSchema = z.strictObject({ id: idSchema, title: text });
const noteSchema = z.strictObject({ id: idSchema, title: text, body: text, sourceIds: identifiers.refine(value => value.length > 0, 'Notes need a source.') });
const optionSchema = z.strictObject({ id: idSchema, text });
export const publishedCardSchema = z.strictObject({
  id: idSchema, revision: z.number().int().positive(), topicId: idSchema,
  kind: z.enum(['recall', 'mcq']), prompt: text, answer: text, explanation: text,
  sourceIds: identifiers.refine(value => value.length > 0, 'Cards need a source.'),
  noteIds: identifiers, tags,
  options: z.array(optionSchema).optional(), correctOptionId: idSchema.optional(),
}).superRefine((card, ctx) => {
  if (card.kind === 'recall') {
    if (card.options !== undefined || card.correctOptionId !== undefined) ctx.addIssue({ code: 'custom', message: 'Recall cards must not have answer options.' });
    return;
  }
  if (!card.options || card.options.length < 2) ctx.addIssue({ code: 'custom', path: ['options'], message: 'MCQs need at least two options.' });
  if (card.options && !unique(card.options.map(option => option.id))) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Option IDs must be unique within a card.' });
  if (!card.correctOptionId || !card.options?.some(option => option.id === card.correctOptionId)) ctx.addIssue({ code: 'custom', path: ['correctOptionId'], message: 'Correct option must belong to the card.' });
});

export const studyPackSchema = z.strictObject({
  id: idSchema, version: text, title: text, description: text,
  fixture: z.boolean(), examEnabled: z.boolean(),
  topics: z.array(topicSchema).min(1), sources: z.array(sourceSchema).min(1),
  notes: z.array(noteSchema), cards: z.array(publishedCardSchema).min(1),
}).superRefine((pack, ctx) => {
  for (const key of ['topics', 'sources', 'notes', 'cards'] as const) {
    if (!unique(pack[key].map(item => item.id))) ctx.addIssue({ code: 'custom', path: [key], message: `${key} IDs must be unique within the pack.` });
  }
  const sourceIds = new Set(pack.sources.map(source => source.id));
  const noteIds = new Set(pack.notes.map(note => note.id));
  const topicIds = new Set(pack.topics.map(topic => topic.id));
  pack.notes.forEach((note, index) => {
    if (note.sourceIds.some(id => !sourceIds.has(id))) ctx.addIssue({ code: 'custom', path: ['notes', index, 'sourceIds'], message: 'Note refers to an unregistered source.' });
  });
  pack.cards.forEach((card, index) => {
    if (!topicIds.has(card.topicId)) ctx.addIssue({ code: 'custom', path: ['cards', index, 'topicId'], message: 'Card refers to an unknown topic.' });
    if (card.sourceIds.some(id => !sourceIds.has(id))) ctx.addIssue({ code: 'custom', path: ['cards', index, 'sourceIds'], message: 'Card refers to an unregistered source.' });
    if (card.noteIds.some(id => !noteIds.has(id))) ctx.addIssue({ code: 'custom', path: ['cards', index, 'noteIds'], message: 'Card refers to an unknown note.' });
  });
  if (pack.fixture && pack.examEnabled) ctx.addIssue({ code: 'custom', path: ['examEnabled'], message: 'Developer fixtures cannot enable exams.' });
  if (pack.examEnabled && pack.cards.filter(card => card.kind === 'mcq').length < 300) ctx.addIssue({ code: 'custom', path: ['examEnabled'], message: 'An exam-enabled pack needs at least 300 MCQs.' });
});

export function validatePack(input: unknown): StudyPack { return studyPackSchema.parse(input); }
export function validateCatalog(input: unknown): StudyPack[] {
  return z.array(studyPackSchema).refine(packs => unique(packs.map(pack => pack.id)), 'Pack IDs must be unique.').parse(input);
}

const steps = z.array(z.number().int().min(1).max(1439)).min(1).max(20)
  .refine(values => values.every((value, index) => index === 0 || value > values[index - 1]), 'Learning steps must be strictly increasing whole minutes below one day.');
const timeZone = text.refine(value => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Timezone must be recognized.');
export const deckSettingsSchema = z.strictObject({
  newCardsPerDay: count, maximumReviewsPerDay: count,
  learningStepsMinutes: steps,
  relearningStepsMinutes: steps,
  desiredRetention: z.number().min(0.7).max(0.99),
  leechThreshold: z.number().int().positive(), leechAction: z.enum(['suspend', 'tag']),
});
export const deckSchema = z.strictObject({ id: idSchema, name: text, createdAt: timestamp, settings: deckSettingsSchema, archived: z.boolean().optional() });
export const learningCopySchema = z.strictObject({
  id: idSchema, deckId: idSchema, packId: idSchema, cardId: idSchema,
  contentRevision: z.number().int().positive(), createdAt: timestamp,
  personalNote: z.string(), tags, suspended: z.boolean(), removed: z.boolean().optional(),
});
export const preferencesSchema = z.strictObject({
  id: z.literal('preferences'), theme: z.enum(['dark', 'light', 'system']),
  timeZone,
  dayStartsAtHour: z.number().int().min(0).max(23),
});
export const schedulerStateSchema = z.strictObject({
  copyId: idSchema, algorithm: text, libraryVersion: text, modelVersion: text, parametersVersion: text,
  state: z.enum(['new', 'learning', 'review', 'relearning']), dueAt: timestamp.nullable(),
  stability: z.number().finite().nonnegative(), difficulty: z.number().min(0).max(10),
  repetitions: count, lapses: count, learningStep: count, elapsedDays: count, scheduledDays: count, lastReviewAt: timestamp.nullable(),
}).superRefine((state, ctx) => {
  if (state.state === 'new') {
    if (state.dueAt !== null || state.lastReviewAt !== null || state.repetitions !== 0 || state.stability !== 0 || state.difficulty !== 0 || state.lapses !== 0 || state.learningStep !== 0 || state.elapsedDays !== 0 || state.scheduledDays !== 0) ctx.addIssue({ code: 'custom', message: 'A new schedule cannot contain review history.' });
  } else if (state.dueAt === null || state.lastReviewAt === null || state.repetitions < 1 || state.stability <= 0 || state.difficulty < 1 || state.dueAt < state.lastReviewAt) {
    ctx.addIssue({ code: 'custom', message: 'A studied schedule needs valid memory state and review timestamps.' });
  }
  if (state.lapses > state.repetitions) ctx.addIssue({ code: 'custom', message: 'Lapses cannot exceed reviews.' });
});
export const reviewSessionSchema = z.strictObject({
  id: z.literal('active'), deckId: idSchema, copyId: idSchema.nullable(), turnId: idSchema,
  revealed: z.boolean(), selectedOptionId: idSchema.nullable(), guessed: z.boolean(),
  startedAt: timestamp, shownAt: timestamp,
}).superRefine((session, ctx) => {
  if (session.copyId === null && (session.revealed || session.selectedOptionId !== null || session.guessed)) ctx.addIssue({ code: 'custom', message: 'A waiting session cannot contain an answer.' });
  if (session.shownAt < session.startedAt) ctx.addIssue({ code: 'custom', message: 'A session cannot show a card before it starts.' });
});
export const reviewLogSchema = z.strictObject({
  id: idSchema, copyId: idSchema, deckId: idSchema, at: timestamp,
  studyDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), rating: z.enum(['again', 'right']),
  durationMs: count.max(86_400_000), undone: z.boolean(), contentRevision: z.number().int().positive(),
  before: schedulerStateSchema, after: schedulerStateSchema, settings: deckSettingsSchema,
  sequence: count.min(1), undoable: z.boolean(), timeZone, dayStartsAtHour: z.number().int().min(0).max(23),
  copyBefore: learningCopySchema, copyAfter: learningCopySchema,
  sessionBefore: reviewSessionSchema, sessionAfter: reviewSessionSchema,
}).superRefine((log, ctx) => {
  if (log.before.copyId !== log.copyId || log.after.copyId !== log.copyId ||
      log.copyBefore.id !== log.copyId || log.copyAfter.id !== log.copyId ||
      log.copyBefore.deckId !== log.deckId || log.copyAfter.deckId !== log.deckId ||
      log.sessionBefore.deckId !== log.deckId || log.sessionAfter.deckId !== log.deckId ||
      log.sessionBefore.copyId !== log.copyId) ctx.addIssue({ code: 'custom', message: 'Review snapshots must belong to the reviewed deck and learning copy.' });
  if (log.copyBefore.packId !== log.copyAfter.packId || log.copyBefore.cardId !== log.copyAfter.cardId) ctx.addIssue({ code: 'custom', message: 'A review cannot change published card identity.' });
  if (!log.sessionBefore.revealed || log.sessionAfter.revealed) ctx.addIssue({ code: 'custom', message: 'A review must advance from a revealed answer to a fresh turn.' });
  if (log.undone && log.undoable) ctx.addIssue({ code: 'custom', message: 'An undone review cannot be undone again.' });
  if (log.after.lastReviewAt !== log.at || (log.before.lastReviewAt !== null && log.before.lastReviewAt > log.at)) ctx.addIssue({ code: 'custom', message: 'Review timestamps must be consistent.' });
});

/** Exam questions have their own contract; they are never installed as flashcards. */
export const examQuestionSchema = z.strictObject({
  id: idSchema, revision: z.number().int().positive(), kind: z.enum(['single', 'multiple']),
  domainId: idSchema, objectiveIds: identifiers, conceptId: idSchema,
  prompt: text, answer: text, explanation: text,
  sourceIds: identifiers.min(1), tags, options: z.array(optionSchema).min(2),
  correctOptionIds: identifiers.min(1), optionExplanations: z.record(idSchema, text),
  relatedNotes: z.array(z.strictObject({ packId: idSchema, noteId: idSchema })),
  status: z.enum(['draft', 'approved']),
}).superRefine((question, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  const options = question.options.map(option => option.id);
  if (!unique(options)) issue('Question option identities must be unique.');
  if (question.correctOptionIds.some(id => !options.includes(id))) issue('Correct answers must belong to the question.');
  if (question.kind === 'single' && question.correctOptionIds.length !== 1) issue('Single-answer questions need exactly one correct option.');
  if (question.kind === 'multiple' && question.correctOptionIds.length < 2) issue('Multiple-answer questions need at least two correct options.');
  if (options.some(id => !question.optionExplanations[id]) || Object.keys(question.optionExplanations).some(id => !options.includes(id))) issue('Every option needs its own explanation and no unknown option explanations.');
  if (!unique(question.relatedNotes.map(note => JSON.stringify([note.packId, note.noteId])))) issue('Related note references must be unique.');
});
export const testExposureSchema = z.strictObject({
  id: idSchema, bankId: idSchema, questionId: idSchema, lastSeenAt: timestamp,
}).superRefine((exposure, ctx) => {
  if (exposure.id !== JSON.stringify([exposure.bankId, exposure.questionId])) ctx.addIssue({ code: 'custom', message: 'Exposure identity must match its bank and question.' });
});
/** Exams keep a floor; practice may be any size the selection can fill. */
export const MINIMUM_EXAM_QUESTIONS = 50;
export const testAttemptSchema = z.strictObject({
  id: idSchema, bankId: idSchema, mode: z.enum(['practice', 'exam']), startedAt: timestamp,
  bankTitle: text.optional(), bankVersion: text.optional(), fixture: z.boolean().optional(), retryOf: idSchema.optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  deadlineAt: timestamp.nullable(), completedAt: timestamp.nullable(),
  questions: z.array(z.strictObject({ bankId: idSchema, card: examQuestionSchema, sources: z.array(sourceSchema).min(1), domainTitle: text })).min(1),
  responses: z.array(z.strictObject({ cardId: idSchema, selectedOptionIds: identifiers, revealed: z.boolean() })),
  result: z.strictObject({ correct: count, wrong: count, skipped: count }).nullable(),
}).superRefine((attempt, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!unique(attempt.questions.map(question => question.card.id))) issue('Test questions must be unique.');
  if (attempt.retryOf === attempt.id) issue('A retry cannot refer to itself.');
  if (attempt.mode === 'exam' && attempt.questions.length < MINIMUM_EXAM_QUESTIONS) issue(`Exams need at least ${MINIMUM_EXAM_QUESTIONS} questions.`);
  for (const question of attempt.questions) {
    if (question.bankId !== attempt.bankId) issue('Every test question must belong to the selected bank.');
    if (!unique(question.sources.map(source => source.id)) || question.card.sourceIds.some(id => !question.sources.some(source => source.id === id))) issue('Snapshot sources must be unique and include every question reference.');
  }
  if (!unique(attempt.responses.map(response => response.cardId)) || attempt.responses.length !== attempt.questions.length) issue('Each test question needs exactly one response.');
  let correct = 0; let wrong = 0; let skipped = 0;
  for (const response of attempt.responses) {
    const card = attempt.questions.find(question => question.card.id === response.cardId)?.card;
    if (!card) { issue('Response refers to an unknown question.'); continue; }
    if (response.selectedOptionIds.some(id => !card.options.some(option => option.id === id))) issue('Response option must belong to its question.');
    if (response.selectedOptionIds.length > card.correctOptionIds.length) issue('Response exceeds the question selection count.');
    if (attempt.mode === 'exam' && response.revealed) issue('Exam responses cannot be revealed individually.');
    if (!response.selectedOptionIds.length) skipped++;
    else if (response.selectedOptionIds.length === card.correctOptionIds.length && response.selectedOptionIds.every(id => card.correctOptionIds.includes(id))) correct++;
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
