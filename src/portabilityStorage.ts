import type { Deck, LearningCopy } from './domain';
import { database, loadWorkspace } from './storage';
import { parseBackup, type Backup } from './portability';

/** The UI's writer owns confirmation/safety download. No partial restore is observable. */
export async function importBackup(input: Backup, db = database): Promise<void> {
  const backup = parseBackup(input);
  await db.transaction('rw', db.tables, async () => {
    const previous = await loadWorkspace(db);
    if (backup.kind === 'full') {
      const w = backup.workspace;
      for (const table of db.tables) await table.clear();
      await db.decks.bulkAdd(w.decks);
      await db.copies.bulkAdd(w.copies);
      await db.preferences.put(w.preferences);
      await db.schedulerStates.bulkAdd(w.schedulerStates);
      await db.reviewLogs.bulkAdd(w.reviewLogs);
      if (w.session) await db.reviewSessions.put(w.session);
      await db.testAttempts.bulkAdd(w.testAttempts);
      await db.testExposures.bulkAdd(w.testExposures);
    } else if (backup.kind === 'deck') {
      const now = Date.now();
      const deck: Deck = { id:crypto.randomUUID(), name:backup.deck.name, settings:backup.deck.settings, createdAt:now };
      const copies: LearningCopy[] = backup.deck.cards.map(card => ({ ...card, id:crypto.randomUUID(), deckId:deck.id, createdAt:now, personalNote:'', tags:[], suspended:false }));
      await db.preferences.put(previous.preferences);
      await db.decks.add(deck);
      await db.copies.bulkAdd(copies);
    } else {
      const policyChanged = previous.preferences.timeZone !== backup.preferences.timeZone || previous.preferences.dayStartsAtHour !== backup.preferences.dayStartsAtHour;
      const changed = new Set<string>();
      for (const settings of backup.decks) {
        const deck = previous.decks.find(item => item.id === settings.id);
        if (deck && JSON.stringify(deck.settings) !== JSON.stringify(settings.settings)) {
          changed.add(deck.id);
          await db.decks.put({ ...deck, settings:settings.settings });
        }
      }
      await db.preferences.put(backup.preferences);
      for (const log of previous.reviewLogs) {
        if (log.undoable && (policyChanged || changed.has(log.deckId))) await db.reviewLogs.put({ ...log, undoable:false });
      }
      if (previous.session && (policyChanged || changed.has(previous.session.deckId))) await db.reviewSessions.delete('active');
    }
    await loadWorkspace(db);
  });
}
