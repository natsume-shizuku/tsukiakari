import { describe, expect, it } from 'vitest';
import { engineeringQuestionBank as bank } from '../../src/content/engineeringQuestionBank';
import type { TestAttempt, TestExposure } from '../../src/domain';
import { allocateDomainQuotas, answerTestAttempt, completeTestAttempt, createTestAttempt, eligibleTestQuestions, retryAttempt, revealTestAttempt, scoreTestAttempt, testHasExpired } from '../../src/testEngine';
import { testAttemptSchema } from '../../src/validation';

const start = 1_800_000_000_000;
const options = { mode: 'practice' as const, count: 50, durationMinutes: 120, fixturePreview: true };
function attempt(mode: 'practice' | 'exam' = 'practice') { return createTestAttempt(bank, { ...options, mode }, [], start, () => 0.5); }
function ids(value: TestAttempt) { return value.questions.map(question => question.card.id); }
function exposure(value: TestAttempt): TestExposure[] {
  return value.questions.map(question => ({ id: JSON.stringify([value.bankId, question.card.id]), bankId: value.bankId, questionId: question.card.id, lastSeenAt: value.startedAt }));
}

describe('independent question-bank eligibility and snapshots', () => {
  it('requires explicit engineering preview, and at least 300 approved real questions', () => {
    expect(() => eligibleTestQuestions(bank)).toThrow(/published question bank/);
    expect(eligibleTestQuestions(bank, true)).toHaveLength(300);
    expect(() => eligibleTestQuestions({ ...bank, questions: bank.questions.slice(0, 49) }, true)).toThrow(/at least 50/);
    const published = { ...bank, fixture: false };
    expect(eligibleTestQuestions(published)).toHaveLength(300);
    expect(() => eligibleTestQuestions(published, true)).toThrow(/Engineering preview/);
    expect(() => eligibleTestQuestions({ ...published, questions: published.questions.slice(0, 299) })).toThrow(/at least 300/);
    const draft = structuredClone(published); draft.questions[0].status = 'draft';
    expect(() => eligibleTestQuestions(draft)).toThrow(/300 approved/);
  });
  it.each([0, 49, 50.5, 301])('rejects invalid or unavailable count %s without reducing it', count => {
    expect(() => createTestAttempt(bank, { ...options, count }, [], start)).toThrow();
  });
  it.each([0, 1.5, 1441])('rejects invalid duration %s', durationMinutes => {
    expect(() => createTestAttempt(bank, { ...options, durationMinutes }, [], start)).toThrow();
  });
  it('copies questions, domains, explanations and sources without retaining catalog references', () => {
    const input = structuredClone(bank);
    const created = createTestAttempt(input, options, [], start);
    expect(created.questions).toHaveLength(50);
    expect(new Set(ids(created)).size).toBe(50);
    expect(created.bankTitle).toBe(input.title); expect(created.bankVersion).toBe(input.version);
    const first = created.questions[0];
    input.sources[0].title = 'Changed';
    input.questions.find(question => question.id === first.card.id)!.answer = 'Changed';
    input.domains.find(domain => domain.id === first.card.domainId)!.title = 'Changed';
    expect(first.sources[0].title).not.toBe('Changed');
    expect(first.card.answer).not.toBe('Changed'); expect(first.domainTitle).not.toBe('Changed');
  });
  it('filters practice domains without silently accepting undersized or unknown selections', () => {
    const filtered = createTestAttempt(bank, { ...options, domainId: 'fixture-domain-1' }, [], start);
    expect(filtered.questions.every(question => question.card.domainId === 'fixture-domain-1')).toBe(true);
    expect(() => createTestAttempt(bank, { ...options, domainId: 'fixture-domain-3' }, [], start)).toThrow(/at least 50/);
    expect(() => createTestAttempt(bank, { ...options, domainId: 'unknown' }, [], start)).toThrow(/domain/);
    expect(() => createTestAttempt(bank, { ...options, mode: 'exam', domainId: 'fixture-domain-1' }, [], start)).toThrow(/all bank domains/);
  });
});

describe('weighted selection and shared exposure', () => {
  it('allocates exact quotas and rounds deterministically with stable ties', () => {
    expect([...allocateDomainQuotas(bank.domains, 100).values()]).toEqual([17, 32, 12, 12, 17, 10]);
    expect([...allocateDomainQuotas(bank.domains, 50).values()]).toEqual([9, 16, 6, 6, 8, 5]);
    expect([...allocateDomainQuotas(bank.domains, 51).values()]).toEqual([9, 16, 6, 6, 9, 5]);
    const ties: [number, number[]][] = [[60, [11, 19, 7, 7, 10, 6]], [70, [12, 23, 8, 8, 12, 7]], [95, [16, 31, 11, 11, 16, 10]], [120, [21, 39, 14, 14, 20, 12]], [140, [24, 45, 17, 17, 23, 14]], [160, [28, 51, 19, 19, 27, 16]], [205, [35, 66, 25, 24, 35, 20]], [230, [39, 74, 28, 27, 39, 23]], [280, [48, 90, 34, 33, 47, 28]]];
    for (const [count, quotas] of ties) expect([...allocateDomainQuotas(bank.domains, count).values()]).toEqual(quotas);
    for (let count = 50; count <= 300; count++) expect([...allocateDomainQuotas(bank.domains, count).values()].reduce((sum, quota) => sum + quota, 0)).toBe(count);
    expect(() => allocateDomainQuotas([{ id: 'a', title: 'A', weight: 99 }], 50)).toThrow();
  });
  it('prioritizes unseen questions within domain quotas across three 100-question exams', () => {
    const history: TestAttempt[] = [];
    for (let index = 0; index < 3; index++) {
      const current = createTestAttempt(bank, { ...options, mode: 'exam', count: 100 }, history, start + index, () => 0.5);
      expect(bank.domains.map(domain => current.questions.filter(q => q.card.domainId === domain.id).length)).toEqual([17, 32, 12, 12, 17, 10]);
      history.push(current);
    }
    expect(new Set(history.flatMap(ids)).size).toBe(300);
  });
  it('refuses an exam when an individual domain cannot meet its quota', () => {
    const input = structuredClone(bank);
    input.questions[0].domainId = input.domains[1].id;
    expect(() => createTestAttempt(input, { ...options, mode: 'exam', count: 300 }, [], start)).toThrow(/not have enough approved questions/);
  });
  it('uses exposure retained independently of an abandoned attempt', () => {
    const first = attempt();
    const second = createTestAttempt(bank, options, [], start + 1, () => 0.5, exposure(first));
    expect(ids(second).some(id => ids(first).includes(id))).toBe(false);
  });
  it('combines attempts and exposure, preferring unseen and then least recently used', () => {
    const history: TestAttempt[] = [];
    for (let index = 0; index < 6; index++) history.push(createTestAttempt(bank, options, history, start + index, () => 0.5));
    expect(new Set(history.flatMap(ids)).size).toBe(300);
    const retried = retryAttempt(completeTestAttempt(history[0], start + 6), start + 7);
    const next = createTestAttempt(bank, options, history, start + 8, () => 0.5, exposure(retried));
    expect(new Set(ids(next))).toEqual(new Set(ids(history[1])));
  });
  it('isolates other banks and randomizes equally exposed questions', () => {
    const first = attempt();
    const other = createTestAttempt({ ...bank, id: 'different-bank' }, options, [first], start + 1, () => 0.5, exposure(first));
    expect(ids(other)).toEqual(ids(first));
    expect(ids(createTestAttempt(bank, options, [], start, () => 0.1))).not.toEqual(ids(first));
  });
});

describe('responses, deadlines and exact-set scoring', () => {
  it('scores correct, wrong, partial and skipped responses against frozen answers', () => {
    let current = attempt();
    const single = current.questions.find(q => q.card.kind === 'single')!;
    const multiple = current.questions.find(q => q.card.kind === 'multiple')!;
    current = answerTestAttempt(current, single.card.id, single.card.correctOptionIds, start + 1);
    current = answerTestAttempt(current, multiple.card.id, [multiple.card.correctOptionIds[0]], start + 2);
    expect(scoreTestAttempt(current)).toEqual({ correct: 1, wrong: 1, skipped: 48 });
    current = answerTestAttempt(current, multiple.card.id, [...multiple.card.correctOptionIds].reverse(), start + 3);
    expect(completeTestAttempt(current, start + 4).result).toEqual({ correct: 2, wrong: 0, skipped: 48 });
  });
  it('rejects duplicate, foreign, over-count and multiple choices on a single-answer item', () => {
    const current = attempt();
    const single = current.questions.find(q => q.card.kind === 'single')!.card;
    const multiple = current.questions.find(q => q.card.kind === 'multiple')!.card;
    expect(() => answerTestAttempt(current, single.id, [single.options[0].id, single.options[1].id], start + 1)).toThrow(/requested number/);
    expect(() => answerTestAttempt(current, multiple.id, [multiple.options[0].id, multiple.options[0].id], start + 1)).toThrow(/distinct/);
    expect(() => answerTestAttempt(current, multiple.id, multiple.options.slice(0, 3).map(option => option.id), start + 1)).toThrow(/requested number/);
    expect(() => answerTestAttempt(current, single.id, ['foreign'], start + 1)).toThrow(/part of/);
    expect(() => answerTestAttempt(current, 'missing', [], start + 1)).toThrow(/not part/);
  });
  it('preserves partial multi-answer drafts and can clear answers before reveal', () => {
    const initial = attempt(); const question = initial.questions.find(q => q.card.kind === 'multiple')!.card;
    const selected = answerTestAttempt(initial, question.id, [question.correctOptionIds[0]], start + 1);
    expect(initial.responses.find(r => r.cardId === question.id)!.selectedOptionIds).toEqual([]);
    expect(selected.responses.find(r => r.cardId === question.id)!.selectedOptionIds).toHaveLength(1);
    const cleared = answerTestAttempt(selected, question.id, [], start + 2);
    expect(cleared.responses.find(r => r.cardId === question.id)!.selectedOptionIds).toEqual([]);
    const revealed = revealTestAttempt(selected, question.id, start + 3);
    expect(() => answerTestAttempt(revealed, question.id, [], start + 4)).toThrow(/revealed/);
    const other = initial.questions.find(q => q.card.id !== question.id)!;
    const skipped = revealTestAttempt(revealed, other.card.id, start + 4);
    expect(() => answerTestAttempt(skipped, other.card.id, other.card.correctOptionIds, start + 5)).toThrow(/revealed/);
  });
  it('never reveals exam answers individually and rejects missing questions', () => {
    const current = attempt('exam');
    expect(() => revealTestAttempt(current, current.questions[0].card.id, start + 1)).toThrow(/only after completion/);
    expect(() => revealTestAttempt(attempt(), 'missing', start + 1)).toThrow(/not part/);
  });
  it('accepts pre-deadline answers but finalizes before applying a late response', () => {
    const current = attempt('exam'); const question = current.questions[0].card;
    const before = answerTestAttempt(current, question.id, question.correctOptionIds, current.deadlineAt! - 1);
    expect(before.completedAt).toBeNull(); expect(testHasExpired(before, current.deadlineAt!)).toBe(true);
    const late = answerTestAttempt(before, question.id, [], current.deadlineAt!);
    expect(late.completedAt).toBe(current.deadlineAt);
    expect(late.responses[0].selectedOptionIds).toEqual(question.correctOptionIds);
    expect(late.result).toEqual({ correct: 1, wrong: 0, skipped: 49 });
  });
  it('completion is idempotent and practice has no deadline', () => {
    const current = attempt();
    expect(testHasExpired(current, start + 100000000)).toBe(false);
    const finished = completeTestAttempt(current, start + 1);
    expect(completeTestAttempt(finished, start + 100)).toEqual(finished);
    expect(() => answerTestAttempt(finished, finished.questions[0].card.id, [], start + 2)).toThrow(/complete/);
    expect(() => completeTestAttempt(current, start - 1)).toThrow(/clock/);
  });
  it('retries retain snapshots, mode and duration in a separate attempt', () => {
    const current = attempt('exam');
    const answered = answerTestAttempt(current, current.questions[0].card.id, current.questions[0].card.correctOptionIds, start + 1);
    const finished = completeTestAttempt(answered, start + 2);
    const retried = retryAttempt(finished, start + 3);
    expect(retried.id).not.toBe(finished.id); expect(retried.retryOf).toBe(finished.id);
    expect(retried.questions).toEqual(finished.questions); expect(retried.mode).toBe('exam');
    expect(retried.deadlineAt).toBe(start + 3 + 120 * 60000);
    expect(retried.responses.every(r => !r.selectedOptionIds.length && !r.revealed)).toBe(true);
    expect(() => retryAttempt(current, start + 3)).toThrow(/Finish/);
    retried.questions[0].card.answer = 'Edited';
    expect(finished.questions[0].card.answer).not.toBe('Edited');
  });
});

describe('historical attempt validation', () => {
  it('does not need the current bank to validate preserved snapshot metadata', () => {
    const current = attempt('exam');
    delete current.bankTitle; delete current.bankVersion; delete current.fixture; delete current.durationMinutes;
    expect(testAttemptSchema.parse(current)).toEqual(current);
    expect(retryAttempt(completeTestAttempt(current, start + 1), start + 2).durationMinutes).toBe(120);
  });
  it.each(['duplicate', 'foreign-bank', 'missing-source', 'unknown-option', 'duplicate-response', 'exam-reveal', 'result', 'early-time', 'late-time', 'wrong-duration'])(
    'rejects malformed snapshot invariant: %s', variant => {
      const current = completeTestAttempt(attempt('exam'), start + 1);
      if (variant === 'duplicate') current.questions[1] = structuredClone(current.questions[0]);
      if (variant === 'foreign-bank') current.questions[0].bankId = 'foreign';
      if (variant === 'missing-source') current.questions[0].sources[0].id = 'foreign';
      if (variant === 'unknown-option') current.responses[0].selectedOptionIds = ['foreign'];
      if (variant === 'duplicate-response') current.responses[1] = structuredClone(current.responses[0]);
      if (variant === 'exam-reveal') current.responses[0].revealed = true;
      if (variant === 'result') current.result!.correct++;
      if (variant === 'early-time') current.completedAt = start - 1;
      if (variant === 'late-time') current.completedAt = current.deadlineAt! + 1;
      if (variant === 'wrong-duration') current.durationMinutes = 1;
      expect(() => testAttemptSchema.parse(current)).toThrow();
    });
});
