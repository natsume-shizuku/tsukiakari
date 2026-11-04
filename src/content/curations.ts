import { z } from 'zod';
import type { CanonicalCardRef, CanonicalNoteRef, StudyCuration, StudyPack } from '../domain';
import { idSchema, validateCatalog } from '../validation';

const text = z.string().refine(value => value.trim().length > 0, 'Text must not be blank.');
const cardKey = (ref: CanonicalCardRef) => JSON.stringify([ref.packId, ref.cardId]);
const noteKey = (ref: CanonicalNoteRef) => JSON.stringify([ref.packId, ref.noteId]);
const unique = (values: string[]) => new Set(values).size === values.length;
const curationSchema = z.strictObject({
  id: idSchema, version: text, title: text, description: text, fixture: z.boolean(),
  topics: z.array(z.strictObject({ id: idSchema, title: text })).min(1),
  cards: z.array(z.strictObject({ packId: idSchema, cardId: idSchema, topicId: idSchema })).min(1),
  notes: z.array(z.strictObject({ packId: idSchema, noteId: idSchema })),
  questionBankIds: z.array(idSchema),
}).superRefine((curation, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!unique(curation.topics.map(topic => topic.id))) issue('Curation topics must be unique.');
  if (!unique(curation.cards.map(cardKey))) issue('Canonical cards must occur only once in a curation.');
  if (!unique(curation.notes.map(noteKey))) issue('Canonical notes must occur only once in a curation.');
  if (!unique(curation.questionBankIds)) issue('Question-bank links must be unique.');
  if (curation.cards.some(card => !curation.topics.some(topic => topic.id === card.topicId))) issue('Every curation card needs a registered curation topic.');
});

/** Validate the complete graph before exposing any collection. Never invent missing content. */
export function createCurationRegistry(inputPacks: StudyPack[], inputCurations: StudyCuration[], bankIds: string[] = []) {
  const packs = validateCatalog(inputPacks);
  const curations = z.array(curationSchema).refine(items => unique(items.map(item => item.id)), 'Curation IDs must be unique.').parse(inputCurations);
  const packsById = new Map(packs.map(pack => [pack.id, pack]));
  const resolveCard = (ref: CanonicalCardRef) => {
    const pack = packsById.get(ref.packId);
    const card = pack?.cards.find(item => item.id === ref.cardId);
    return pack && card ? { pack, card } : undefined;
  };
  const resolveNote = (ref: CanonicalNoteRef) => {
    const pack = packsById.get(ref.packId);
    const note = pack?.notes.find(item => item.id === ref.noteId);
    return pack && note ? { pack, note } : undefined;
  };
  for (const curation of curations) {
    if (curation.questionBankIds.some(id => !bankIds.includes(id))) throw new Error('Curation refers to an unavailable question bank.');
    for (const ref of curation.cards) {
      const resolved = resolveCard(ref);
      if (!resolved) throw new Error('Curation refers to an unavailable canonical card.');
      if (!curation.fixture && resolved.pack.fixture) throw new Error('Real curations must not include fixture cards.');
      if (resolved.card.noteIds.some(noteId => !curation.notes.some(note => note.packId === ref.packId && note.noteId === noteId))) throw new Error('Curation must include the reference notes used by its cards.');
    }
    for (const ref of curation.notes) {
      const resolved = resolveNote(ref);
      if (!resolved) throw new Error('Curation refers to an unavailable canonical note.');
      if (!curation.fixture && resolved.pack.fixture) throw new Error('Real curations must not include fixture notes.');
    }
  }
  const requireCuration = (id: string) => {
    const curation = curations.find(item => item.id === id);
    if (!curation) throw new Error('The selected study pack is unavailable.');
    return curation;
  };
  const cardCurations = (ref: CanonicalCardRef) => curations.filter(curation => curation.cards.some(card => cardKey(card) === cardKey(ref)));
  const noteCurations = (ref: CanonicalNoteRef) => curations.filter(curation => curation.notes.some(note => noteKey(note) === noteKey(ref)));
  const resolveCurationCards = (id: string) => {
    const curation = requireCuration(id);
    return curation.cards.map(ref => ({ ...resolveCard(ref)!, topic: curation.topics.find(topic => topic.id === ref.topicId)! }));
  };
  const resolveCurationNotes = (id: string) => requireCuration(id).notes.map(ref => resolveNote(ref)!);
  const matchesCurationCard = (ref: CanonicalCardRef, curationId: string, topicId?: string) => {
    const curation = curations.find(item => item.id === curationId);
    return Boolean(curation?.cards.some(card => cardKey(card) === cardKey(ref) && (!topicId || card.topicId === topicId)));
  };
  return {
    packs, curations, resolveCard, resolveNote, cardCurations, noteCurations, resolveCurationCards, resolveCurationNotes, matchesCurationCard,
    // Canonical ownership, not visible collection membership, determines identity.
    allCards: packs.flatMap(pack => pack.cards.map(card => ({ pack, card }))),
    allNotes: packs.flatMap(pack => pack.notes.map(note => ({ pack, note }))),
  };
}
