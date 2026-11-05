import { z } from 'zod';
import { studyPacks } from './content/catalog';
import type { Deck, WorkspaceSnapshot } from './domain';
import { addCardsToDeck, database, loadWorkspace, type TsukiakariDatabase } from './storage';
import { deckSchema, idSchema, learningCopySchema, validateCatalog } from './validation';

async function readForMutation(db: TsukiakariDatabase): Promise<WorkspaceSnapshot> {
  const workspace = await loadWorkspace(db);
  if (!await db.preferences.get('preferences')) await db.preferences.add(workspace.preferences);
  return workspace;
}
function requireDeck(workspace: WorkspaceSnapshot, deckId: string): Deck {
  const deck = workspace.decks.find(item => item.id === deckId);
  if (!deck) throw new Error('This deck no longer exists. No changes were saved.');
  return deck;
}
async function expireUndo(db: TsukiakariDatabase, workspace: WorkspaceSnapshot, matches: (log: WorkspaceSnapshot['reviewLogs'][number]) => boolean) {
  const changed = workspace.reviewLogs.filter(log => log.undoable && matches(log));
  if (changed.length) await db.reviewLogs.bulkPut(changed.map(log => ({ ...log, undoable: false })));
}

export async function renameDeck(deckId: string, name: string, db = database): Promise<void> {
  idSchema.parse(deckId);
  const validatedName = deckSchema.shape.name.parse(z.string().parse(name).trim());
  await db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const deck = requireDeck(workspace, deckId);
    await db.decks.put(deckSchema.parse({ ...deck, name: validatedName }));
  });
}

/** Archive hides a deck from study without removing its cards, schedules or history. */
export async function setDeckArchived(deckId: string, archived: boolean, db = database): Promise<void> {
  idSchema.parse(deckId); z.boolean().parse(archived);
  await db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const deck = requireDeck(workspace, deckId);
    if (Boolean(deck.archived) === archived) return;
    await db.decks.put(deckSchema.parse({ ...deck, archived }));
    await expireUndo(db, workspace, log => log.deckId === deckId);
    if (workspace.session?.deckId === deckId) await db.reviewSessions.delete('active');
  });
}


/** Permanently remove one deck's learner records after confirming its current name. */
export async function deleteDeck(deckId: string, confirmationName: string, db = database): Promise<void> {
  idSchema.parse(deckId); z.string().parse(confirmationName);
  await db.transaction('rw', db.tables, async () => {
    const workspace = await loadWorkspace(db);
    const deck = requireDeck(workspace, deckId);
    if (confirmationName !== deck.name) throw new Error('Type the deck name exactly to confirm deletion. No data was deleted.');
    const copyIds = workspace.copies.filter(copy => copy.deckId === deckId).map(copy => copy.id);
    await db.schedulerStates.bulkDelete(copyIds);
    await db.reviewLogs.where('deckId').equals(deckId).delete();
    await db.copies.bulkDelete(copyIds);
    if (workspace.session?.deckId === deckId) await db.reviewSessions.delete('active');
    await db.decks.delete(deckId);
  });
}

/** Soft removal keeps the identity and daily usage so re-adding cannot reset progress. */
export async function removeCardsFromDeck(deckId: string, copyIds: string[], db = database): Promise<void> {
  idSchema.parse(deckId);
  const requested = z.array(idSchema).min(1).refine(ids => new Set(ids).size === ids.length, 'Selected copies must be unique.').parse(copyIds);
  await db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    requireDeck(workspace, deckId);
    const copies = requested.map(id => workspace.copies.find(copy => copy.id === id && copy.deckId === deckId));
    if (copies.some(copy => !copy)) throw new Error('One or more cards do not belong to this deck. No cards were removed.');
    const changes = copies.filter(copy => copy && !copy.removed);
    if (!changes.length) return;
    await db.copies.bulkPut(changes.map(copy => learningCopySchema.parse({ ...copy!, removed: true })));
    await expireUndo(db, workspace, log => log.deckId === deckId);
    if (workspace.session?.deckId === deckId && workspace.session.copyId && requested.includes(workspace.session.copyId)) {
      await db.reviewSessions.delete('active');
    }
  });
}

const annotationSchema = z.strictObject({
  personalNote: z.string().max(20_000, 'Personal notes may contain up to 20,000 characters.'),
  tags: z.array(z.string().trim().max(60, 'Tags may contain up to 60 characters.')).max(30, 'Use up to 30 tags.'),
});

/** Annotation edits never advance a turn or overwrite its frozen answer. */
export async function saveCopyAnnotations(copyId: string, input: { personalNote: string; tags: string[] }, db = database): Promise<void> {
  idSchema.parse(copyId);
  const parsed = annotationSchema.parse(input);
  const tags = parsed.tags.filter(Boolean).filter((tag, index, all) => all.findIndex(other => other.toLocaleLowerCase('en') === tag.toLocaleLowerCase('en')) === index);
  await db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const copy = workspace.copies.find(item => item.id === copyId);
    if (!copy) throw new Error('This learning copy no longer exists. No changes were saved.');
    // Only review history can create the system tag; typed text must never gain its protection.
    const personalTags = tags.filter(tag => tag.toLocaleLowerCase('en') !== 'leech');
    const protectedTags = copy.tags.includes('leech') ? [...personalTags, 'leech'] : personalTags;
    if (protectedTags.length > 30) throw new Error('Use up to 30 tags, including the protected leech tag.');
    const changed = learningCopySchema.parse({ ...copy, personalNote: parsed.personalNote.trim(), tags: protectedTags });
    if (changed.personalNote === copy.personalNote && JSON.stringify(changed.tags) === JSON.stringify(copy.tags)) return;
    await db.copies.put(changed);
    await expireUndo(db, workspace, log => log.copyId === copyId);
  });
}

/** Validate the installed catalog and all selections before an atomic cross-pack add. */
export async function addSelectionToDeck(
  deckId: string, selections: { packId: string; cardId: string }[], db = database,
): Promise<void> {
  idSchema.parse(deckId);
  const selected = z.array(z.strictObject({ packId: idSchema, cardId: idSchema })).min(1)
    .refine(items => new Set(items.map(item => JSON.stringify([item.packId, item.cardId]))).size === items.length, 'Selected cards must be unique.')
    .parse(selections);
  const catalog = validateCatalog(studyPacks);
  for (const item of selected) {
    if (!catalog.some(pack => pack.id === item.packId && pack.cards.some(card => card.id === item.cardId))) {
      throw new Error('One or more selected cards are unavailable. No cards were added.');
    }
  }
  await db.transaction('rw', db.tables, async () => {
    await readForMutation(db);
    for (const pack of catalog) {
      const cardIds = selected.filter(item => item.packId === pack.id).map(item => item.cardId);
      if (cardIds.length) await addCardsToDeck(deckId, pack, cardIds, db);
    }
  });
}
