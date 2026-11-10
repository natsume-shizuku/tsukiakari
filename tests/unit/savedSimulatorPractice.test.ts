import { expect, it } from 'vitest';
import raw from '../../src/content/simulator-fixture-bank.json';
import type { TestSection } from '../../src/domain';
import { validateQuestionBank } from '../../src/questionBankValidation';
import { testAttemptSchema } from '../../src/validation';
import { answerTestAttempt, completeTestAttempt, createTestAttempt, flagTestQuestion, moveTestPosition, retryAttempt } from '../../src/testEngine';

it('resumes and retries an existing 128-question practice snapshot without applying new-test assembly quotas', () => {
  const bank = validateQuestionBank(raw);
  const start = 1_800_000_000_000;
  const template = createTestAttempt(bank, { mode: 'practice', count: 50, durationMinutes: 120, fixturePreview: true }, [], start, () => 0.5);
  // Model a saved full-bank attempt from the withdrawn unlimited-practice assembler.
  // Resumption consumes its frozen delivery, not the current new-test selection path.
  const groups = structuredClone(bank.groups!).sort((a, b) => Number(a.kind === 'series') - Number(b.kind === 'series'));
  for (const group of groups) group.exhibits[0].body += '\nSaved exhibit snapshot marker.';
  const standalone = bank.questions.filter(question => question.groupId === undefined);
  const ordered = [...standalone, ...groups.flatMap(group => bank.questions.filter(question => question.groupId === group.id))];
  const questions = ordered.map(card => ({
    bankId: bank.id,
    card: structuredClone(card),
    sources: bank.sources.filter(source => card.sourceIds.includes(source.id)).map(source => ({ ...source, title: 'Saved snapshot: ' + source.title })),
    domainTitle: bank.domains.find(domain => domain.id === card.domainId)!.title,
  }));
  const sections: TestSection[] = [{ id: 'section-general', kind: 'general', title: 'Questions', cardIds: standalone.map(card => card.id) }];
  for (const group of groups) sections.push({ id: 'section-' + group.id, kind: group.kind, title: group.title, groupId: group.id,
    cardIds: questions.filter(question => question.card.groupId === group.id).map(question => question.card.id) });
  const saved = testAttemptSchema.parse({ ...template, questions, groups,
    responses: questions.map(question => ({ cardId: question.card.id, selectedOptionIds: [], revealed: false })),
    delivery: { sections, position: 0, flaggedCardIds: [], lockedBefore: 0 },
  });
  expect(saved.questions).toHaveLength(128);
  expect(saved.groups).toHaveLength(bank.groups!.length);
  expect(saved.delivery!.sections.flatMap(section => section.cardIds)).toEqual(saved.questions.map(question => question.card.id));

  let resumed = testAttemptSchema.parse(JSON.parse(JSON.stringify(saved)));
  const last = resumed.questions.length - 1;
  const card = resumed.questions[last].card;
  if (card.kind !== 'single' && card.kind !== 'multiple') throw new Error('The final saved series question must be a selection.');
  resumed = moveTestPosition(resumed, last, start + 1);
  resumed = flagTestQuestion(resumed, card.id, true, start + 2);
  resumed = answerTestAttempt(resumed, card.id, card.correctOptionIds, start + 3);
  resumed = testAttemptSchema.parse(JSON.parse(JSON.stringify(resumed)));
  expect(resumed.delivery).toMatchObject({ position: last, flaggedCardIds: [card.id], lockedBefore: 0 });
  expect(resumed.responses.find(response => response.cardId === card.id)?.selectedOptionIds).toEqual(card.correctOptionIds);
  resumed = moveTestPosition(resumed, 0, start + 4);
  expect(resumed.delivery!.position).toBe(0);
  expect(resumed.questions).toEqual(saved.questions);
  expect(resumed.groups).toEqual(saved.groups);

  const completed = completeTestAttempt(resumed, start + 5);
  expect(completed.result).toMatchObject({ correct: 1, wrong: 0, skipped: 127 });
  const retry = retryAttempt(completed, start + 6);
  expect(retry.questions).toEqual(saved.questions);
  expect(retry.groups).toEqual(saved.groups);
  expect(retry.delivery).toEqual({ sections, position: 0, flaggedCardIds: [], lockedBefore: 0 });
  expect(retry.responses.every(response => response.selectedOptionIds.length === 0 && !response.revealed)).toBe(true);
  expect(retry.scoring).toBe('per-selection');
  expect(retry.deadlineAt).toBeNull();
  expect(retry.retryOf).toBe(saved.id);
  expect(testAttemptSchema.parse(JSON.parse(JSON.stringify(retry)))).toEqual(retry);
  expect(saved.delivery).toMatchObject({ position: 0, flaggedCardIds: [], lockedBefore: 0 });
  expect(saved.responses.every(response => response.selectedOptionIds.length === 0)).toBe(true);
});
