import type { LearningCopy, StudyCuration } from '../domain';
import { fixturePack } from './fixtures';
import { collectionFixturePack } from './collectionFixtures';
import { createCurationRegistry } from './curations';
import { fixturesVisible } from './fixtureVisibility';
import { questionBankManifests } from './questionBanks';
import { validatePack } from '../validation';
import publishedPackData from './published/study-pack.json';
import publishedCurations from './published/curations.json';

/** Canonical ownership remains stable for reviews, stored copies and backups. */
export const studyPacks = [fixturePack, collectionFixturePack, validatePack(publishedPackData)];
const originalCurations: StudyCuration[] = [fixturePack, collectionFixturePack].map(pack => ({
  id: pack.id, version: pack.version, title: pack.title, description: pack.description, fixture: pack.fixture,
  topics: pack.topics,
  cards: pack.cards.map(card => ({ packId: pack.id, cardId: card.id, topicId: card.topicId })),
  notes: pack.notes.map(note => ({ packId: pack.id, noteId: note.id })),
  questionBankIds: pack.id === fixturePack.id ? ['developer-test-fixture'] : [],
}));
const sharedFixture: StudyCuration = {
  id: 'developer-shared-foundations', version: '1.0.0', title: 'Shared foundations preview',
  description: 'Engineering preview of one set of cards appearing in several study packs. The cards and notes retain their original identities, so adding overlapping packs does not duplicate them in your deck.',
  fixture: true,
  topics: [{ id: 'shared-foundations', title: 'Shared foundations' }, { id: 'shared-addition', title: 'More addition' }],
  cards: [
    ...fixturePack.cards.map(card => ({ packId: fixturePack.id, cardId: card.id, topicId: 'shared-foundations' })),
    ...collectionFixturePack.cards.slice(0, 2).map(card => ({ packId: collectionFixturePack.id, cardId: card.id, topicId: 'shared-addition' })),
  ],
  notes: [
    ...fixturePack.notes.map(note => ({ packId: fixturePack.id, noteId: note.id })),
    { packId: collectionFixturePack.id, noteId: collectionFixturePack.notes[0].id },
  ],
  questionBankIds: ['developer-test-fixture'],
};
export const curationRegistry = createCurationRegistry(studyPacks, [...publishedCurations, ...originalCurations, sharedFixture], questionBankManifests.map(bank => bank.id));
export const studyCurations = curationRegistry.curations;
export const resolveCurationCards = curationRegistry.resolveCurationCards;
export const resolveCurationNotes = curationRegistry.resolveCurationNotes;
export const cardCurations = curationRegistry.cardCurations;
export const noteCurations = curationRegistry.noteCurations;
export const matchesCurationCard = curationRegistry.matchesCurationCard;
export const canonicalCards = curationRegistry.allCards;
export const canonicalNotes = curationRegistry.allNotes;
/** What learners browse. Saved cards still resolve through the canonical lists above. */
export const visibleCurations = fixturesVisible ? studyCurations : studyCurations.filter(curation => !curation.fixture);
export const browsableCards = fixturesVisible ? canonicalCards : canonicalCards.filter(({ pack }) => !pack.fixture);
export const browsableNotes = fixturesVisible ? canonicalNotes : canonicalNotes.filter(({ pack }) => !pack.fixture);

/** Accept only canonical identity, never a visible curation ID substituted for ownership. */
export function findPublishedCard(copy: Pick<LearningCopy, 'packId' | 'cardId'>) {
  return curationRegistry.resolveCard(copy);
}
