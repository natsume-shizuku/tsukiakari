import type { LearningCopy, WorkspaceSnapshot } from './domain';

export interface Mistake {
  copy: LearningCopy;
  againCount: number;
  lastAgainAt: number;
  lastRating: 'again' | 'right';
  leech: boolean;
  lapses: number;
}

/** Browsing is pure. Only committed flashcard events contribute to this list. */
export function getMistakes(workspace: WorkspaceSnapshot): Mistake[] {
  const activeDecks = new Set(workspace.decks.filter(deck => !deck.archived).map(deck => deck.id));
  const logsByCopy = new Map<string, WorkspaceSnapshot['reviewLogs']>();
  for (const log of workspace.reviewLogs) {
    if (log.undone) continue;
    const logs = logsByCopy.get(log.copyId) ?? [];
    logs.push(log);
    logsByCopy.set(log.copyId, logs);
  }
  const states = new Map(workspace.schedulerStates.map(state => [state.copyId, state]));
  return workspace.copies.filter(copy => !copy.removed && activeDecks.has(copy.deckId)).flatMap(copy => {
    const logs = (logsByCopy.get(copy.id) ?? []).filter(log => log.deckId === copy.deckId);
    const again = logs.filter(log => log.rating === 'again');
    if (!again.length) return [];
    const latest = logs.reduce((last, log) => log.sequence > last.sequence ? log : last);
    return [{
      copy, againCount: again.length, lastAgainAt: again.reduce((latest, log) => Math.max(latest, log.at), 0),
      lastRating: latest.rating, leech: copy.tags.includes('leech'),
      lapses: states.get(copy.id)?.lapses ?? 0,
    }];
  }).sort((a, b) => b.lastAgainAt - a.lastAgainAt || a.copy.id.localeCompare(b.copy.id, 'en'));
}
