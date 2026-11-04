import type { StudyPack } from '../domain';
import { validatePack } from '../validation';

/** Original engineering fixtures only. These are not a published or verified study pack. */
export const fixturePack: StudyPack = validatePack({
  id: 'developer-foundation-fixture', version: '1.0.0',
  title: 'Foundation fixtures',
  description: 'Developer fixtures for testing storage, references, and deck membership. Not a published or verified study pack.',
  fixture: true, examEnabled: false,
  topics: [{ id: 'fixture-addition', title: 'Addition fixtures' }, { id: 'fixture-shapes', title: 'Shape fixtures' }],
  sources: [
    { id: 'fixture-source-addition', title: 'Wolfram MathWorld: Addition', url: 'https://mathworld.wolfram.com/Addition.html' },
    { id: 'fixture-source-square', title: 'Wolfram MathWorld: Square', url: 'https://mathworld.wolfram.com/Square.html' },
  ],
  notes: [
    { id: 'fixture-note-addition', title: 'Fixture note: combining quantities', body: 'Developer fixture. Adding quantities gives their sum. This note exists to exercise source and note links.', sourceIds: ['fixture-source-addition'] },
    { id: 'fixture-note-square', title: 'Fixture note: a square', body: 'Developer fixture. A square has four equal sides and four right angles. This note exists to exercise source and note links.', sourceIds: ['fixture-source-square'] },
  ],
  cards: [
    { id: 'fixture-add-two-three', revision: 1, topicId: 'fixture-addition', kind: 'recall', prompt: 'Fixture: What is 2 + 3?', answer: '5', explanation: 'Combining two items with three more gives five items.', sourceIds: ['fixture-source-addition'], noteIds: ['fixture-note-addition'], tags: ['developer-fixture'] },
    { id: 'fixture-name-sum', revision: 1, topicId: 'fixture-addition', kind: 'recall', prompt: 'Fixture: What do we call the result of addition?', answer: 'The sum.', explanation: 'The quantities being added combine into a total called the sum.', sourceIds: ['fixture-source-addition'], noteIds: ['fixture-note-addition'], tags: ['developer-fixture'] },
    { id: 'fixture-square-sides', revision: 1, topicId: 'fixture-shapes', kind: 'recall', prompt: 'Fixture: How many sides does a square have?', answer: 'Four.', explanation: 'A square is a four-sided polygon with equal sides and right angles.', sourceIds: ['fixture-source-square'], noteIds: ['fixture-note-square'], tags: ['developer-fixture'] },
    { id: 'fixture-square-identify', revision: 1, topicId: 'fixture-shapes', kind: 'mcq', prompt: 'Fixture: Which description defines a square?', answer: 'Four equal sides and four right angles.', explanation: 'Both equal side lengths and right angles distinguish a square.', sourceIds: ['fixture-source-square'], noteIds: ['fixture-note-square'], tags: ['developer-fixture'], options: [{ id: 'square-three-sides', text: 'Three equal sides.' }, { id: 'square-equal-right', text: 'Four equal sides and four right angles.' }, { id: 'square-five-sides', text: 'Five equal sides.' }, { id: 'square-no-sides', text: 'A curved boundary with no straight sides.' }], correctOptionId: 'square-equal-right' },
  ],
});
