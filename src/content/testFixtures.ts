import type { PublishedCard, StudyPack } from '../domain';
import { validatePack } from '../validation';

/** Software fixtures only, kept outside the installed study catalog. */
const cards: PublishedCard[] = Array.from({ length: 300 }, (_, index) => {
  const serial = String(index + 1).padStart(3, '0');
  const left = index + 101;
  const right = (index % 19) + 1;
  const answer = left + right;
  const correctPosition = index % 4;
  const values = [answer - 2, answer - 1, answer + 1];
  values.splice(correctPosition, 0, answer);
  return {
    id: `test-fixture-card-${serial}`, revision: 1, topicId: 'test-fixture-addition', kind: 'mcq',
    prompt: `Engineering fixture: What is ${left} + ${right}?`,
    answer: String(answer), explanation: `${left} + ${right} = ${answer}. Adding these two quantities gives their sum.`,
    sourceIds: ['test-fixture-source-addition'], noteIds: [], tags: ['developer-fixture', 'test-preview'],
    options: values.map((value, option) => ({ id: `test-fixture-${serial}-option-${option + 1}`, text: String(value) })),
    correctOptionId: `test-fixture-${serial}-option-${correctPosition + 1}`,
  };
});

export const testFixturePack: StudyPack = validatePack({
  id: 'developer-test-fixture', version: '1.0.0', title: 'Engineering test preview',
  description: '300 arithmetic software fixtures for trying test controls. This is not a published study pack or an exam question bank.',
  fixture: true, examEnabled: false,
  topics: [{ id: 'test-fixture-addition', title: 'Test preview addition' }],
  sources: [{ id: 'test-fixture-source-addition', title: 'Wolfram MathWorld: Addition', url: 'https://mathworld.wolfram.com/Addition.html' }],
  notes: [], cards,
});
