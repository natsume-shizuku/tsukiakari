import { z } from 'zod';
import type { ExamQuestion, QuestionBank, TestAttempt, TestExposure } from './domain';
import { testAttemptSchema, testExposureSchema } from './validation';
import { validateQuestionBank } from './questionBankValidation';

export interface TestOptions {
  mode: 'practice' | 'exam'; count: number; durationMinutes: number; fixturePreview?: boolean; domainId?: string;
}
const optionsSchema = z.strictObject({
  mode: z.enum(['practice', 'exam']), count: z.number().int().min(50),
  durationMinutes: z.number().int().min(1).max(1440), fixturePreview: z.boolean().optional(),
  domainId: z.string().min(1).optional(),
});
const timeSchema = z.number().int().nonnegative().max(253402300799999);

/** Eligibility belongs to the independent bank, never to a Library card count. */
export function eligibleTestQuestions(input: QuestionBank, fixturePreview = false, domainId?: string): ExamQuestion[] {
  const bank = validateQuestionBank(input);
  if (fixturePreview) {
    if (!bank.fixture) throw new Error('Engineering preview requires a fixture question bank.');
  } else if (bank.fixture || bank.questions.filter(question => question.status === 'approved').length < 300) {
    throw new Error('Choose a published question bank with at least 300 approved questions.');
  }
  if (domainId && !bank.domains.some(domain => domain.id === domainId)) throw new Error('Choose a domain from this question bank.');
  const questions = bank.questions.filter(question => question.status === 'approved' && (!domainId || question.domainId === domainId));
  if (questions.length < 50) throw new Error('This selection needs at least 50 approved questions to start a test.');
  return questions;
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error('Invalid random value.');
    const other = Math.floor(draw * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** Largest remainders win; equal fractions retain the bank's declared domain order. */
export function allocateDomainQuotas(domains: QuestionBank['domains'], count: number): Map<string, number> {
  if (!Number.isSafeInteger(count) || count < 1 || !domains.length ||
      domains.some(domain => !Number.isFinite(domain.weight) || domain.weight <= 0) ||
      new Set(domains.map(domain => domain.id)).size !== domains.length ||
      Math.abs(domains.reduce((sum, domain) => sum + domain.weight, 0) - 100) > 1e-8) {
    throw new Error('Domain quotas require a positive count and weights totaling 100 percent.');
  }
  const rows = domains.map((domain, index) => {
    // Whole-number units keep equal remainders equal, so ties follow domain order.
    const units = Math.round(count * domain.weight * 1e6);
    const remainder = units % 1e8;
    return { id: domain.id, count: (units - remainder) / 1e8, remainder, index };
  });
  const remaining = count - rows.reduce((sum, row) => sum + row.count, 0);
  const ordered = [...rows].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index++) ordered[index].count++;
  return new Map(rows.map(row => [row.id, row.count]));
}

/** Exposure is shared by bank identity, even when different study packs link to it. */
export function createTestAttempt(input: QuestionBank, inputOptions: TestOptions, history: TestAttempt[], now = Date.now(), random = Math.random, exposures: TestExposure[] = []): TestAttempt {
  timeSchema.parse(now);
  const options = optionsSchema.parse(inputOptions);
  if (options.mode === 'exam' && options.domainId) throw new Error('Timed exams cover all bank domains. Use Practice Mode to select one domain.');
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
  if (options.mode === 'exam') {
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
  const questions = shuffle(selected, random).map(card => ({
    bankId: bank.id, card, sources: bank.sources.filter(source => card.sourceIds.includes(source.id)),
    domainTitle: bank.domains.find(domain => domain.id === card.domainId)!.title,
  }));
  return testAttemptSchema.parse({
    id: crypto.randomUUID(), bankId: bank.id, bankTitle: bank.title, bankVersion: bank.version, fixture: bank.fixture,
    mode: options.mode, startedAt: now, durationMinutes: options.durationMinutes,
    deadlineAt: options.mode === 'exam' ? now + options.durationMinutes * 60000 : null,
    completedAt: null, questions,
    responses: questions.map(question => ({ cardId: question.card.id, selectedOptionIds: [], revealed: false })), result: null,
  });
}

export function scoreTestAttempt(attempt: TestAttempt): NonNullable<TestAttempt['result']> {
  const result = { correct: 0, wrong: 0, skipped: 0 };
  for (const question of attempt.questions) {
    const selected = attempt.responses.find(response => response.cardId === question.card.id)?.selectedOptionIds ?? [];
    if (!selected.length) result.skipped++;
    else if (selected.length === question.card.correctOptionIds.length && selected.every(id => question.card.correctOptionIds.includes(id))) result.correct++;
    else result.wrong++;
  }
  return result;
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
export function answerTestAttempt(input: TestAttempt, cardId: string, optionIds: string[], now = Date.now()): TestAttempt {
  timeSchema.parse(now);
  const attempt = testAttemptSchema.parse(input);
  if (testHasExpired(attempt, now)) return completeTestAttempt(attempt, now);
  if (attempt.completedAt !== null) throw new Error('This test is complete. Saved answers cannot be changed.');
  if (now < attempt.startedAt) throw new Error('The clock is earlier than this test start. Correct the device time before saving.');
  const question = attempt.questions.find(item => item.card.id === cardId);
  const response = attempt.responses.find(item => item.cardId === cardId);
  if (!question || !response) throw new Error('This question is not part of the test.');
  if (response.revealed) throw new Error('This answer has been revealed and cannot be changed.');
  if (!Array.isArray(optionIds) || new Set(optionIds).size !== optionIds.length ||
      optionIds.some(id => !question.card.options.some(option => option.id === id))) throw new Error('Choose distinct options that are part of this question.');
  if (optionIds.length > (question.card.kind === 'single' ? 1 : question.card.correctOptionIds.length)) throw new Error('Choose no more than the requested number of answers.');
  response.selectedOptionIds = [...optionIds];
  return testAttemptSchema.parse(attempt);
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
  });
}
