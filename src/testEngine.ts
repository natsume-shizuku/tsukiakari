import { z } from 'zod';
import type { ExamQuestion, QuestionBank, TestAttempt, TestExposure, TestSection } from './domain';
import { MINIMUM_EXAM_QUESTIONS, testAttemptSchema, testExposureSchema } from './validation';
import { validateQuestionBank } from './questionBankValidation';
import { assembleBlueprintExam } from './examAssembly';
import { gradeQuestion, isSelection, responseProblem } from './testGrading';
import { allocateDomainQuotas, shuffle } from './testSelection';

export { allocateDomainQuotas };

export interface TestOptions {
  mode: 'practice' | 'exam'; count: number; durationMinutes: number; fixturePreview?: boolean; domainId?: string;
}
const optionsSchema = z.strictObject({
  mode: z.enum(['practice', 'exam']), count: z.number().int().min(1),
  durationMinutes: z.number().int().min(1).max(1440), fixturePreview: z.boolean().optional(),
  domainId: z.string().min(1).optional(),
});
const timeSchema = z.number().int().nonnegative().max(253402300799999);

/** Eligibility belongs to the independent bank, never to a Library card count. */
/** A test in progress shows this many questions per page. Change it here to resize every page. */
export const QUESTIONS_PER_PAGE = 5;

export function eligibleTestQuestions(input: QuestionBank, fixturePreview = false, domainId?: string): ExamQuestion[] {
  const bank = validateQuestionBank(input);
  if (fixturePreview) {
    if (!bank.fixture) throw new Error('Engineering preview requires a fixture question bank.');
  } else if (bank.fixture || (!bank.blueprint && bank.questions.filter(question => question.status === 'approved').length < 300)) {
    throw new Error('Choose a published question bank with at least 300 approved questions.');
  }
  if (domainId && !bank.domains.some(domain => domain.id === domainId)) throw new Error('Choose a domain from this question bank.');
  const questions = bank.questions.filter(question => question.status === 'approved' && (!domainId || question.domainId === domainId));
  if (!questions.length) throw new Error('This selection has no approved questions.');
  return questions;
}

/** Written order repeats across a bank, so simulator choices are shuffled once per attempt and then frozen. */
function shuffleChoices(card: ExamQuestion, random: () => number): ExamQuestion {
  if (card.kind === 'match' || card.kind === 'order') return { ...card, tokens: shuffle(card.tokens, random) };
  if (card.kind === 'hotspot') return { ...card, rows: card.rows.map(row => ({ ...row, options: shuffle(row.options, random) })) };
  // Yes then No is a reading order, not a position to learn.
  return card.options.length === 2 ? card : { ...card, options: shuffle(card.options, random) };
}

/** Exposure is shared by bank identity, even when different study packs link to it. */
export function createTestAttempt(input: QuestionBank, inputOptions: TestOptions, history: TestAttempt[], now = Date.now(), random = Math.random, exposures: TestExposure[] = []): TestAttempt {
  timeSchema.parse(now);
  const options = optionsSchema.parse(inputOptions);
  if (options.mode === 'exam' && options.domainId) throw new Error('Timed exams cover all bank domains. Use Practice Mode to select one domain.');
  if (options.mode === 'exam' && options.count < MINIMUM_EXAM_QUESTIONS) throw new Error(`Exams need at least ${MINIMUM_EXAM_QUESTIONS} questions.`);
  const bank = validateQuestionBank(input);
  const candidates = eligibleTestQuestions(bank, options.fixturePreview, options.domainId);
  if (options.count > candidates.length) throw new Error('The requested count exceeds the available unique questions. Choose a smaller count.');
  const attempts = z.array(testAttemptSchema).parse(history);
  const recordedExposure = z.array(testExposureSchema).parse(exposures);
  const lastSeen = new Map<string, number>();
  for (const item of recordedExposure.filter(item => item.bankId === bank.id)) {
    lastSeen.set(item.questionId, Math.max(lastSeen.get(item.questionId) ?? -1, item.lastSeenAt));
  }
  for (const attempt of attempts.filter(item => item.bankId === bank.id)) {
    for (const question of attempt.questions) lastSeen.set(question.card.id, Math.max(lastSeen.get(question.card.id) ?? -1, attempt.startedAt));
  }
  const prioritize = (questions: ExamQuestion[]) => shuffle(questions, random)
    .sort((a, b) => (lastSeen.get(a.id) ?? -1) - (lastSeen.get(b.id) ?? -1));
  let selected: ExamQuestion[];
  let assembled: ReturnType<typeof assembleBlueprintExam> | null = null;
  if (bank.blueprint && !options.domainId) {
    assembled = assembleBlueprintExam(bank, options.count, lastSeen, random);
    selected = assembled.questions;
  } else if (options.mode === 'exam') {
    const quotas = allocateDomainQuotas(bank.domains, options.count);
    selected = bank.domains.flatMap(domain => {
      const available = candidates.filter(question => question.domainId === domain.id);
      const required = quotas.get(domain.id)!;
      if (available.length < required) throw new Error('This bank does not have enough approved questions in ' + domain.title + ' for the requested exam. No questions were substituted.');
      return prioritize(available).slice(0, required);
    });
  } else {
    selected = prioritize(candidates).slice(0, options.count);
  }
  const ordered = assembled ? selected : shuffle(selected, random);
  const questions = ordered.map(card => ({
    bankId: bank.id, card: bank.blueprint ? shuffleChoices(card, random) : card, sources: bank.sources.filter(source => card.sourceIds.includes(source.id)),
    domainTitle: bank.domains.find(domain => domain.id === card.domainId)!.title,
  }));
  const usedGroups = (bank.groups ?? []).filter(group => ordered.some(card => card.groupId === group.id));
  const sections: TestSection[] = assembled?.sections ?? [{ id: 'section-general', kind: 'general', title: 'Questions', cardIds: ordered.map(card => card.id) }];
  const simulator = bank.blueprint ? {
    scoring: 'per-selection' as const, groups: usedGroups,
    delivery: { sections, position: 0, flaggedCardIds: [], lockedBefore: 0 },
  } : {};
  return testAttemptSchema.parse({
    id: crypto.randomUUID(), bankId: bank.id, bankTitle: bank.title, bankVersion: bank.version, fixture: bank.fixture,
    mode: options.mode, startedAt: now, durationMinutes: options.durationMinutes,
    deadlineAt: options.mode === 'exam' ? now + options.durationMinutes * 60000 : null,
    completedAt: null, questions,
    responses: questions.map(question => ({ cardId: question.card.id, selectedOptionIds: [], revealed: false })), result: null,
    ...simulator,
  });
}

/** One outcome per question. A partly correct question counts as wrong here and keeps its points in the result. */
export function questionOutcome(attempt: TestAttempt, question: TestAttempt['questions'][number]): 'correct' | 'wrong' | 'skipped' {
  const { state } = gradeQuestion(question.card, attempt.responses.find(response => response.cardId === question.card.id), attempt.scoring);
  return state === 'partial' ? 'wrong' : state;
}

export function scoreTestAttempt(attempt: TestAttempt): NonNullable<TestAttempt['result']> {
  const result = { correct: 0, wrong: 0, skipped: 0 };
  let earned = 0, possible = 0;
  for (const question of attempt.questions) {
    const grade = gradeQuestion(question.card, attempt.responses.find(response => response.cardId === question.card.id), attempt.scoring);
    earned += grade.earned; possible += grade.possible;
    result[grade.state === 'partial' ? 'wrong' : grade.state]++;
  }
  return attempt.scoring ? { ...result, points: { earned, possible } } : result;
}
export function completeTestAttempt(input: TestAttempt, now = Date.now()): TestAttempt {
  timeSchema.parse(now);
  const attempt = testAttemptSchema.parse(input);
  if (attempt.completedAt !== null) return attempt;
  if (now < attempt.startedAt) throw new Error('The clock is earlier than this test start. Correct the device time before saving.');
  return testAttemptSchema.parse({ ...attempt, completedAt: Math.min(now, attempt.deadlineAt ?? now), result: scoreTestAttempt(attempt) });
}
export function testHasExpired(attempt: TestAttempt, now = Date.now()): boolean {
  return attempt.completedAt === null && attempt.deadlineAt !== null && now >= attempt.deadlineAt;
}
/** Shared guard for every write to an open attempt. Returns null when the deadline has already passed. */
function openAttempt(input: TestAttempt, now: number): TestAttempt | null {
  timeSchema.parse(now);
  const attempt = testAttemptSchema.parse(input);
  if (testHasExpired(attempt, now)) return null;
  if (attempt.completedAt !== null) throw new Error('This test is complete. Saved answers cannot be changed.');
  if (now < attempt.startedAt) throw new Error('The clock is earlier than this test start. Correct the device time before saving.');
  return attempt;
}
function writableResponse(attempt: TestAttempt, cardId: string) {
  const index = attempt.questions.findIndex(item => item.card.id === cardId);
  const response = attempt.responses.find(item => item.cardId === cardId);
  if (index < 0 || !response) throw new Error('This question is not part of the test.');
  if (response.revealed) throw new Error('This answer has been revealed and cannot be changed.');
  if (attempt.delivery && index < attempt.delivery.lockedBefore) throw new Error('This section is closed and its answers cannot be changed.');
  return { question: attempt.questions[index], response };
}
export function answerTestAttempt(input: TestAttempt, cardId: string, optionIds: string[], now = Date.now()): TestAttempt {
  const attempt = openAttempt(input, now);
  if (!attempt) return completeTestAttempt(input, now);
  const { question, response } = writableResponse(attempt, cardId);
  if (!isSelection(question.card)) throw new Error('This question takes placed answers.');
  const { card } = question;
  if (!Array.isArray(optionIds) || new Set(optionIds).size !== optionIds.length ||
      optionIds.some(id => !card.options.some(option => option.id === id))) throw new Error('Choose distinct options that are part of this question.');
  if (optionIds.length > (card.kind === 'single' ? 1 : card.correctOptionIds.length)) throw new Error('Choose no more than the requested number of answers.');
  response.selectedOptionIds = [...optionIds];
  return testAttemptSchema.parse(attempt);
}
export function placeTestAnswer(input: TestAttempt, cardId: string, placements: Record<string, string>, now = Date.now()): TestAttempt {
  const attempt = openAttempt(input, now);
  if (!attempt) return completeTestAttempt(input, now);
  const { question, response } = writableResponse(attempt, cardId);
  if (isSelection(question.card)) throw new Error('This question does not take placed answers.');
  const problem = responseProblem(question.card, { selectedOptionIds: [], placements });
  if (problem) throw new Error(problem);
  response.placements = { ...placements };
  return testAttemptSchema.parse(attempt);
}
function requireDelivery(attempt: TestAttempt) {
  if (!attempt.delivery) throw new Error('This test does not use question-by-question delivery.');
  return attempt.delivery;
}
export function moveTestPosition(input: TestAttempt, position: number, now = Date.now()): TestAttempt {
  const attempt = openAttempt(input, now);
  if (!attempt) return completeTestAttempt(input, now);
  const delivery = requireDelivery(attempt);
  if (!Number.isInteger(position) || position < delivery.lockedBefore || position >= attempt.questions.length) throw new Error('That question is not available.');
  delivery.position = position;
  return testAttemptSchema.parse(attempt);
}
export function flagTestQuestion(input: TestAttempt, cardId: string, flagged: boolean, now = Date.now()): TestAttempt {
  const attempt = openAttempt(input, now);
  if (!attempt) return completeTestAttempt(input, now);
  const delivery = requireDelivery(attempt);
  if (!attempt.questions.some(question => question.card.id === cardId)) throw new Error('This question is not part of the test.');
  delivery.flaggedCardIds = delivery.flaggedCardIds.filter(id => id !== cardId);
  if (flagged) delivery.flaggedCardIds.push(cardId);
  return testAttemptSchema.parse(attempt);
}
/** The section holding a question index. Sections list every question in order. */
export function sectionAt(attempt: TestAttempt, position: number): { section: TestSection; start: number; end: number } {
  let start = 0;
  for (const section of requireDelivery(attempt).sections) {
    const end = start + section.cardIds.length;
    if (position < end) return { section, start, end };
    start = end;
  }
  throw new Error('That question is not available.');
}
/** Exam Mode closes what is left behind; Practice Mode only moves. */
function closeThrough(attempt: TestAttempt, boundary: number): TestAttempt {
  const delivery = requireDelivery(attempt);
  if (attempt.mode === 'exam') delivery.lockedBefore = Math.max(delivery.lockedBefore, boundary);
  delivery.position = Math.min(boundary, attempt.questions.length - 1);
  return testAttemptSchema.parse(attempt);
}
export function leaveTestSection(input: TestAttempt, now = Date.now()): TestAttempt {
  const attempt = openAttempt(input, now);
  if (!attempt) return completeTestAttempt(input, now);
  const { end } = sectionAt(attempt, requireDelivery(attempt).position);
  if (end >= attempt.questions.length) throw new Error('This is the last section. Finish the test instead.');
  return closeThrough(attempt, end);
}
/** A series question closes as soon as the learner moves on, so it never reaches a review screen. */
export function advanceSeriesQuestion(input: TestAttempt, now = Date.now()): TestAttempt {
  const attempt = openAttempt(input, now);
  if (!attempt) return completeTestAttempt(input, now);
  const delivery = requireDelivery(attempt);
  if (sectionAt(attempt, delivery.position).section.kind !== 'series') throw new Error('Only series questions close one at a time.');
  return closeThrough(attempt, delivery.position + 1);
}
export function revealTestAttempt(input: TestAttempt, cardId: string, now = Date.now()): TestAttempt {
  timeSchema.parse(now);
  const attempt = testAttemptSchema.parse(input);
  if (testHasExpired(attempt, now)) return completeTestAttempt(attempt, now);
  if (attempt.mode !== 'practice') throw new Error('Exam answers are available only after completion.');
  if (attempt.completedAt !== null) throw new Error('This test is already complete.');
  if (now < attempt.startedAt) throw new Error('The clock is earlier than this test start. Correct the device time before saving.');
  const response = attempt.responses.find(item => item.cardId === cardId);
  if (!response) throw new Error('This question is not part of the test.');
  response.revealed = true;
  return testAttemptSchema.parse(attempt);
}
/** Wrong and skipped questions return as untimed practice, because a shorter set is not an exam. */
export function retryMissedAttempt(input: TestAttempt, now = Date.now()): TestAttempt {
  const original = testAttemptSchema.parse(input);
  const questions = original.questions.filter(question => questionOutcome(original, question) !== 'correct');
  if (!questions.length) throw new Error('Every question was correct, so there is nothing to retry.');
  const kept = new Set(questions.map(question => question.card.id));
  // Practice never locks a section, so simulator delivery restarts open with only the kept questions.
  const delivery = original.delivery && { ...original.delivery, position: 0, flaggedCardIds: [], lockedBefore: 0,
    sections: original.delivery.sections.map(section => ({ ...section, cardIds: section.cardIds.filter(id => kept.has(id)) })).filter(section => section.cardIds.length) };
  const groups = original.groups?.filter(group => questions.some(question => question.card.groupId === group.id));
  const practice = { ...original, mode: 'practice' as const, deadlineAt: null, ...(original.delivery ? { delivery: { ...original.delivery, lockedBefore: 0 } } : {}) };
  return testAttemptSchema.parse({ ...retryAttempt(practice, now), questions, deadlineAt: null,
    responses: questions.map(question => ({ cardId: question.card.id, selectedOptionIds: [], revealed: false })),
    ...(delivery ? { delivery, groups } : {}) });
}

export function retryAttempt(input: TestAttempt, now = Date.now()): TestAttempt {
  timeSchema.parse(now);
  const original = testAttemptSchema.parse(input);
  if (original.completedAt === null) throw new Error('Finish this test before retrying it.');
  if (now < original.completedAt) throw new Error('The clock is earlier than the completed test. Correct the device time before retrying.');
  const durationMinutes = original.durationMinutes ?? (original.deadlineAt === null ? 120 : (original.deadlineAt - original.startedAt) / 60000);
  return testAttemptSchema.parse({ ...original, id: crypto.randomUUID(), retryOf: original.id,
    startedAt: now, completedAt: null, result: null, durationMinutes,
    deadlineAt: original.mode === 'exam' ? now + durationMinutes * 60000 : null,
    responses: original.questions.map(question => ({ cardId: question.card.id, selectedOptionIds: [], revealed: false })),
    ...(original.delivery ? { delivery: { ...original.delivery, position: 0, flaggedCardIds: [], lockedBefore: 0 } } : {}),
  });
}
