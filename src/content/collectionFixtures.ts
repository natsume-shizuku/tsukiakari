import type { PublishedCard, StudyNote, StudyPack } from '../domain';
import { validatePack } from '../validation';

const sourceId = 'collection-source-addition';
const topicIds = ['collection-addition-1', 'collection-addition-2', 'collection-addition-3', 'collection-addition-4'];
const number = (value: number) => String(value).padStart(3, '0');
const operands = (index: number) => ({ left: index + 11, right: index % 9 + 1 });

/**
 * Deterministic engineering examples for browsing large collections.
 * Sequence numbers are permanent identities: append examples rather than reordering or renumbering.
 * These are not real study-pack content and cannot enable exams.
 */
const notes: StudyNote[] = Array.from({ length: 40 }, (_, index) => {
  const first = index * 3;
  const examples = Array.from({ length: 3 }, (_, offset) => {
    const { left, right } = operands(first + offset);
    return `${left} + ${right} = ${left + right}`;
  });
  return {
    id: `collection-note-${number(index + 1)}`,
    title: `Collection fixture note ${number(index + 1)}: addition examples`,
    body: `Engineering fixture for browsing and searching notes. Adding quantities gives their sum. Examples: ${examples.join('; ')}. This note supports three sample cards and is not a published study lesson.`,
    sourceIds: [sourceId],
  };
});

const cards: PublishedCard[] = Array.from({ length: 120 }, (_, index) => {
  const { left, right } = operands(index);
  const sum = left + right;
  const id = `collection-card-${number(index + 1)}`;
  const common = {
    id, revision: 1, topicId: topicIds[Math.floor(index / 30)],
    prompt: `Collection fixture: What is ${left} + ${right}?`,
    answer: String(sum),
    explanation: `Combining ${left} items with ${right} more gives ${sum} items. This is an engineering example for collection navigation.`,
    sourceIds: [sourceId], noteIds: [notes[Math.floor(index / 3)].id],
    tags: ['developer-fixture', `addition-set-${Math.floor(index / 30) + 1}`],
  };
  if (index % 2 === 0) return { ...common, kind: 'recall' };
  const answerPosition = Math.floor(index / 2) % 4;
  const offsets = [-2, -1, 1];
  const options = Array.from({ length: 4 }, (_, optionIndex) => ({
    id: `${id}-option-${optionIndex + 1}`,
    text: String(optionIndex === answerPosition ? sum : sum + offsets[optionIndex < answerPosition ? optionIndex : optionIndex - 1]),
  }));
  return { ...common, kind: 'mcq', options, correctOptionId: options[answerPosition].id };
});

export const collectionFixturePack: StudyPack = validatePack({
  id: 'developer-collection-fixture', version: '1.0.0',
  title: 'Collection fixtures',
  description: '120 sample cards and 40 reference notes for trying search, filters, pagination, and multi-pack decks. Engineering examples only; not a published or verified study pack.',
  fixture: true, examEnabled: false,
  topics: topicIds.map((id, index) => ({ id, title: `Addition set ${index + 1}` })),
  sources: [{ id: sourceId, title: 'Wolfram MathWorld: Addition', url: 'https://mathworld.wolfram.com/Addition.html' }],
  notes, cards,
});
