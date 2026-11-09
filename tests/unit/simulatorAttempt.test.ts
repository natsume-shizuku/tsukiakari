import { describe, expect, it } from 'vitest';
import raw from '../../src/content/simulator-fixture-bank.json';
import type { MatchQuestion, OrderQuestion, QuestionBank, TestAttempt } from '../../src/domain';
import { createFullBackup, parseBackup } from '../../src/portability';
import { engineeringQuestionBank } from '../../src/content/engineeringQuestionBank';
import { validateQuestionBank } from '../../src/questionBankValidation';
import { advanceSeriesQuestion, answerTestAttempt, completeTestAttempt, createTestAttempt, eligibleTestQuestions, flagTestQuestion, leaveTestSection, moveTestPosition, placeTestAnswer, questionOutcome, retryAttempt, retryMissedAttempt, sectionAt, testHasExpired } from '../../src/testEngine';
import { orderPositionId } from '../../src/testGrading';
import { collectTestExposures } from '../../src/testMigration';
import { testAttemptSchema } from '../../src/validation';
import { defaultPreferences } from '../../src/domain';

const bank = validateQuestionBank(raw);
const start = 1_800_000_000_000;
const options = { mode: 'exam' as const, count: 50, durationMinutes: 120, fixturePreview: true };
function create(mode: 'exam' | 'practice' = 'exam') {
  let state = 7;
  return createTestAttempt(bank, { ...options, mode }, [], start, () => { state = (state * 9301 + 49297) % 233280; return state / 233280; });
}
const findCard = <T,>(attempt: TestAttempt, kind: string) => attempt.questions.find(question => question.card.kind === kind)!.card as T;
const sectionStart = (attempt: TestAttempt, kind: string) => {
  let index = 0;
  for (const section of attempt.delivery!.sections) { if (section.kind === kind) return index; index += section.cardIds.length; }
  throw new Error('No section of that kind.');
};

describe('simulator attempts', () => {
  it('freezes blueprint delivery, case text and per-selection scoring', () => {
    const attempt = create();
    expect(attempt.scoring).toBe('per-selection');
    expect(attempt.questions).toHaveLength(50);
    expect(attempt.groups).toHaveLength(2);
    expect(attempt.groups!.find(group => group.kind === 'case-study')!.exhibits.length).toBeGreaterThan(1);
    expect(attempt.delivery).toMatchObject({ position: 0, flaggedCardIds: [], lockedBefore: 0 });
    expect(attempt.delivery!.sections.map(section => section.kind)).toEqual(['general', 'case-study', 'series']);
  });
  it('leaves banks without a blueprint on the original path', () => {
    const attempt = createTestAttempt(engineeringQuestionBank, { mode: 'practice', count: 50, durationMinutes: 120, fixturePreview: true }, [], start);
    expect(attempt.scoring).toBeUndefined();
    expect(attempt.delivery).toBeUndefined();
    expect(attempt.groups).toBeUndefined();
  });
  it('exempts only blueprint banks from the 300-question rule', () => {
    const published: QuestionBank = { ...bank, fixture: false };
    expect(eligibleTestQuestions(published)).toHaveLength(128);
    expect(() => eligibleTestQuestions({ ...published, blueprint: undefined })).toThrow(/300 approved/);
  });
  it('saves placed answers and rejects them on selection questions', () => {
    const attempt = create();
    const card = findCard<MatchQuestion>(attempt, 'match');
    const placements = { [card.rows[0].id]: card.rows[0].correctTokenId };
    const saved = placeTestAnswer(attempt, card.id, placements, start + 1);
    expect(saved.responses.find(response => response.cardId === card.id)?.placements).toEqual(placements);
    const selection = attempt.questions.find(question => question.card.kind === 'single')!.card;
    expect(() => placeTestAnswer(attempt, selection.id, {}, start + 1)).toThrow(/does not take placed answers/);
    expect(() => answerTestAttempt(attempt, card.id, [card.tokens[0].id], start + 1)).toThrow(/placed answers/);
  });
  it('scores points on completion and validates them', () => {
    const attempt = create();
    const card = findCard<MatchQuestion>(attempt, 'match');
    const order = findCard<OrderQuestion>(attempt, 'order');
    let current = placeTestAnswer(attempt, card.id, { [card.rows[0].id]: card.rows[0].correctTokenId }, start + 1);
    current = placeTestAnswer(current, order.id, Object.fromEntries(order.correctOrder.map((id, index) => [orderPositionId(index), id])), start + 2);
    const done = completeTestAttempt(current, start + 3);
    expect(done.result).toMatchObject({ correct: 1, wrong: 1, skipped: 48 });
    expect(done.result!.points!.earned).toBe(2);
    expect(done.result!.points!.possible).toBeGreaterThan(50);
    expect(() => testAttemptSchema.parse({ ...done, result: { ...done.result, points: { earned: 99, possible: 99 } } })).toThrow(/Results must match/);
  });
  it('moves within open questions and flags for review', () => {
    const attempt = create();
    const moved = moveTestPosition(attempt, 5, start + 1);
    expect(moved.delivery!.position).toBe(5);
    const flagged = flagTestQuestion(moved, moved.questions[5].card.id, true, start + 2);
    expect(flagged.delivery!.flaggedCardIds).toEqual([moved.questions[5].card.id]);
    expect(flagTestQuestion(flagged, moved.questions[5].card.id, false, start + 3).delivery!.flaggedCardIds).toEqual([]);
    expect(() => moveTestPosition(attempt, 50, start + 1)).toThrow(/not available/);
    expect(() => moveTestPosition(attempt, -1, start + 1)).toThrow(/not available/);
  });
  it('locks a section in Exam Mode once the learner leaves it', () => {
    const attempt = create();
    const { end } = sectionAt(attempt, 0);
    const left = leaveTestSection(attempt, start + 1);
    expect(left.delivery).toMatchObject({ position: end, lockedBefore: end });
    expect(() => moveTestPosition(left, 0, start + 2)).toThrow(/not available/);
    const closed = left.questions[0].card;
    expect(() => placeTestAnswer(left, closed.id, {}, start + 2)).toThrow(/closed/);
    if (closed.kind === 'single' || closed.kind === 'multiple') expect(() => answerTestAttempt(left, closed.id, [], start + 2)).toThrow(/closed/);
  });
  it('leaves Practice Mode free to move anywhere', () => {
    const attempt = create('practice');
    const left = leaveTestSection(attempt, start + 1);
    expect(left.delivery!.lockedBefore).toBe(0);
    expect(moveTestPosition(left, 0, start + 2).delivery!.position).toBe(0);
  });
  it('closes a series one question at a time in Exam Mode', () => {
    const attempt = create();
    const first = sectionStart(attempt, 'series');
    let current: TestAttempt = { ...attempt, delivery: { ...attempt.delivery!, position: first, lockedBefore: first } };
    current = advanceSeriesQuestion(current, start + 1);
    expect(current.delivery).toMatchObject({ position: first + 1, lockedBefore: first + 1 });
    expect(() => moveTestPosition(current, first, start + 2)).toThrow(/not available/);
    for (let step = 0; step < 3; step++) current = advanceSeriesQuestion(current, start + 3 + step);
    expect(current.delivery).toMatchObject({ position: 49, lockedBefore: 50 });
    expect(() => advanceSeriesQuestion(attempt, start + 1)).toThrow(/series/);
  });
  it('finalizes instead of writing after the deadline', () => {
    const attempt = create();
    const late = start + 121 * 60000;
    expect(testHasExpired(attempt, late)).toBe(true);
    expect(moveTestPosition(attempt, 1, late).completedAt).toBe(attempt.deadlineAt);
    expect(flagTestQuestion(attempt, attempt.questions[0].card.id, true, late).completedAt).toBe(attempt.deadlineAt);
    expect(placeTestAnswer(attempt, findCard<MatchQuestion>(attempt, 'match').id, {}, late).completedAt).toBe(attempt.deadlineAt);
  });
  it('resets delivery on retry while keeping the frozen questions', () => {
    const attempt = create();
    const left = leaveTestSection(flagTestQuestion(attempt, attempt.questions[0].card.id, true, start + 1), start + 2);
    const done = completeTestAttempt(left, start + 3);
    const retry = retryAttempt(done, start + 4);
    expect(retry.delivery).toMatchObject({ position: 0, flaggedCardIds: [], lockedBefore: 0 });
    expect(retry.questions).toEqual(done.questions);
    expect(retry.groups).toEqual(done.groups);
    expect(retry.scoring).toBe('per-selection');
  });
  it('counts a partly correct question as wrong for filters, and retries it with what else was missed', () => {
    const attempt = create();
    const card = attempt.questions.find(question => question.card.kind === 'match' && question.card.rows.length === 2)!.card as MatchQuestion;
    const [right, wrong] = card.rows;
    const partial = placeTestAnswer(attempt, card.id, { [right.id]: right.correctTokenId, [wrong.id]: card.tokens.find(token => token.id !== wrong.correctTokenId)!.id }, start + 1);
    const left = leaveTestSection(partial, start + 2);
    const done = completeTestAttempt(left, start + 3);
    const question = done.questions.find(item => item.card.id === card.id)!;
    expect(questionOutcome(done, question)).toBe('wrong');
    const retry = retryMissedAttempt(done, start + 4);
    expect(retry.mode).toBe('practice');
    expect(retry.deadlineAt).toBeNull();
    expect(retry.delivery).toMatchObject({ position: 0, flaggedCardIds: [], lockedBefore: 0 });
    expect(retry.delivery!.sections.flatMap(section => section.cardIds)).toEqual(retry.questions.map(item => item.card.id));
    expect(retry.questions.some(item => item.card.id === card.id)).toBe(true);
  });
  it('drops sections and groups a missed-question retry no longer needs', () => {
    const attempt = create('practice');
    const series = attempt.delivery!.sections.find(section => section.kind === 'series')!;
    const caseStudy = attempt.delivery!.sections.find(section => section.kind === 'case-study')!;
    let current = attempt;
    for (const id of series.cardIds) {
      const card = attempt.questions.find(question => question.card.id === id)!.card;
      if (card.kind === 'single') current = answerTestAttempt(current, id, card.correctOptionIds, start + 1);
    }
    const retry = retryMissedAttempt(completeTestAttempt(current, start + 2), start + 3);
    expect(retry.delivery!.sections.some(section => section.kind === 'series')).toBe(false);
    expect(retry.groups!.map(group => group.id)).toEqual([caseStudy.groupId]);
  });
  it('lets practice run shorter than a case study but keeps the exam minimum', () => {
    const short = createTestAttempt(bank, { ...options, mode: 'practice', count: 8 }, [], start, () => 0.5);
    expect(short.questions).toHaveLength(8);
    expect(short.groups).toEqual([]);
    expect(short.delivery!.sections.map(section => section.kind)).toEqual(['general']);
    expect(createTestAttempt(bank, { ...options, mode: 'practice', count: 1 }, [], start, () => 0.5).questions).toHaveLength(1);
    expect(() => createTestAttempt(bank, { ...options, count: 49 }, [], start)).toThrow(/at least 50/);
  });
  it('keeps case-study text when one domain is practiced on its own', () => {
    const domainId = bank.domains[1].id;
    const attempt = createTestAttempt(bank, { ...options, mode: 'practice', count: 30, domainId }, [], start, () => 0.5);
    expect(attempt.questions.every(question => question.card.domainId === domainId)).toBe(true);
    const grouped = attempt.questions.filter(question => question.card.groupId);
    expect(new Set(attempt.groups!.map(group => group.id))).toEqual(new Set(grouped.map(question => question.card.groupId)));
  });
  it('shuffles choices per attempt without changing any answer, and leaves Yes then No alone', () => {
    const first = create(), source = new Map(bank.questions.map(question => [question.id, question]));
    let moved = 0;
    for (const { card } of first.questions) {
      const original = source.get(card.id)!;
      if (card.kind === 'match' || card.kind === 'order') {
        expect([...card.tokens].sort((a, b) => a.id.localeCompare(b.id))).toEqual([...(original as typeof card).tokens].sort((a, b) => a.id.localeCompare(b.id)));
        if (JSON.stringify(card.tokens) !== JSON.stringify((original as typeof card).tokens)) moved++;
      }
      if (card.kind === 'match') expect(card.rows).toEqual((original as typeof card).rows);
      if (card.kind === 'order') expect(card.correctOrder).toEqual((original as typeof card).correctOrder);
      if (card.kind === 'hotspot') card.rows.forEach((row, index) => expect(row.correctOptionId).toBe((original as typeof card).rows[index].correctOptionId));
      if (card.kind === 'single' || card.kind === 'multiple') {
        expect(card.correctOptionIds).toEqual((original as typeof card).correctOptionIds);
        if (card.options.length === 2) expect(card.options.map(option => option.text)).toEqual(['Yes', 'No']);
      }
    }
    expect(moved).toBeGreaterThan(0);
    const retried = retryAttempt(completeTestAttempt(first, start + 1), start + 2);
    expect(retried.questions).toEqual(first.questions);
  });
  it('rejects inconsistent saved delivery', () => {
    const attempt = create();
    expect(() => testAttemptSchema.parse({ ...attempt, delivery: { ...attempt.delivery!, position: 50 } })).toThrow();
    expect(() => testAttemptSchema.parse({ ...attempt, delivery: { ...attempt.delivery!, flaggedCardIds: ['unknown'] } })).toThrow();
    expect(() => testAttemptSchema.parse({ ...attempt, delivery: { ...attempt.delivery!, sections: attempt.delivery!.sections.slice(1) } })).toThrow();
    expect(() => testAttemptSchema.parse({ ...attempt, groups: [] })).toThrow();
    const practice = create('practice');
    expect(() => testAttemptSchema.parse({ ...practice, delivery: { ...practice.delivery!, lockedBefore: 3 } })).toThrow();
  });
  it('round-trips through a version 3 backup', () => {
    const attempt = placeTestAnswer(create('practice'), findCard<MatchQuestion>(create('practice'), 'match').id, {}, start + 1);
    const workspace = { decks: [], copies: [], preferences: defaultPreferences(), schedulerStates: [], reviewLogs: [], session: null, testAttempts: [attempt], testExposures: collectTestExposures([attempt]) };
    const backup = createFullBackup(workspace, start + 2);
    expect(backup.version).toBe(3);
    expect(parseBackup(JSON.parse(JSON.stringify(backup)))).toEqual(backup);
  });
  it('still imports a version 2 file and upgrades it', () => {
    const workspace = { decks: [], copies: [], preferences: defaultPreferences(), schedulerStates: [], reviewLogs: [], session: null, testAttempts: [], testExposures: [] };
    const backup = createFullBackup(workspace, start);
    const parsed = parseBackup({ ...JSON.parse(JSON.stringify(backup)), version: 2 });
    expect(parsed.version).toBe(3);
    expect(() => parseBackup({ ...backup, version: 4 })).toThrow();
  });
});
