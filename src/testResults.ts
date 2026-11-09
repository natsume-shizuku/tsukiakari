import type { CanonicalNoteRef, StudyPack, TestAttempt } from './domain';
import { gradeQuestion } from './testGrading';

export interface TestDomainResult {
  domainId: string; title: string; total: number; correct: number; wrong: number; skipped: number;
  revealed: number; correctWithoutReveal: number; relatedNotes: CanonicalNoteRef[]; unlinkedQuestions: number;
}
export interface LearningResources {
  notes: { packId: string; noteId: string; title: string }[];
  cards: { packId: string; cardId: string; prompt: string }[];
  unavailableNotes: CanonicalNoteRef[];
}
const noteKey = (ref: CanonicalNoteRef) => JSON.stringify([ref.packId, ref.noteId]);

/** Aggregate one completed attempt against its recorded key and domain, never the live bank. */
export function getTestDomainResults(attempt: TestAttempt): TestDomainResult[] {
  if (attempt.completedAt === null) return [];
  const responses = new Map(attempt.responses.map(response => [response.cardId, response]));
  const groups = new Map<string, TestDomainResult>();
  const notesByDomain = new Map<string, Set<string>>();
  for (const question of attempt.questions) {
    const { card } = question;
    let group = groups.get(card.domainId);
    if (!group) {
      group = { domainId: card.domainId, title: question.domainTitle, total: 0, correct: 0, wrong: 0, skipped: 0,
        revealed: 0, correctWithoutReveal: 0, relatedNotes: [], unlinkedQuestions: 0 };
      groups.set(card.domainId, group);
      notesByDomain.set(card.domainId, new Set());
    }
    const response = responses.get(card.id);
    const { state } = gradeQuestion(card, response, attempt.scoring);
    group.total++;
    if (state === 'skipped') group.skipped++;
    else if (state === 'correct') {
      group.correct++;
      if (!response?.revealed) group.correctWithoutReveal++;
    } else group.wrong++;
    if (response?.revealed) group.revealed++;
    if (!card.relatedNotes.length) group.unlinkedQuestions++;
    const seen = notesByDomain.get(card.domainId)!;
    for (const ref of card.relatedNotes) {
      const key = noteKey(ref);
      if (!seen.has(key)) { seen.add(key); group.relatedNotes.push({ ...ref }); }
    }
  }
  return [...groups.values()];
}

/** Learning links use current installed material, scoped by the saved canonical references. */
export function getLearningResources(refs: CanonicalNoteRef[], packs: StudyPack[]): LearningResources {
  const result: LearningResources = { notes: [], cards: [], unavailableNotes: [] };
  const seenNotes = new Set<string>(), seenCards = new Set<string>();
  const packsById = new Map(packs.map(pack => [pack.id, pack]));
  for (const ref of refs) {
    const key = noteKey(ref);
    if (seenNotes.has(key)) continue;
    seenNotes.add(key);
    const pack = packsById.get(ref.packId), note = pack?.notes.find(item => item.id === ref.noteId);
    if (!pack || !note) { result.unavailableNotes.push({ ...ref }); continue; }
    result.notes.push({ packId: pack.id, noteId: note.id, title: note.title });
    for (const card of pack.cards) {
      if (!card.noteIds.includes(note.id)) continue;
      const cardKey = JSON.stringify([pack.id, card.id]);
      if (seenCards.has(cardKey)) continue;
      seenCards.add(cardKey);
      result.cards.push({ packId: pack.id, cardId: card.id, prompt: card.prompt });
    }
  }
  return result;
}
