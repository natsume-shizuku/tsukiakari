import { z } from 'zod';
import { findPublishedCard } from './content/catalog';
import type { DeckSettings, LearningCopy, ReviewLog, ReviewSession, WorkspaceSnapshot } from './domain';
import { getDeckQueue, getStudyDay, initialState, scheduleReview } from './scheduling';
import { database, loadWorkspace, type TsukiakariDatabase } from './storage';
import {
  deckSchema, deckSettingsSchema, idSchema, learningCopySchema,
  reviewLogSchema, reviewSessionSchema, schedulerStateSchema,
} from './validation';

const nowSchema = z.number().int().nonnegative().max(253402300799999);
const submissionSchema = z.strictObject({
  turnId: idSchema, rating: z.enum(['again', 'right']),
  durationMs: z.number().int().min(0).max(86_400_000),
});
type ReviewSubmission = z.infer<typeof submissionSchema>;

/** All review mutations share the same IndexedDB transaction and the app's writer lock. */
async function readForMutation(db: TsukiakariDatabase): Promise<WorkspaceSnapshot> {
  const workspace = await loadWorkspace(db);
  if (!await db.preferences.get('preferences')) await db.preferences.add(workspace.preferences);
  return workspace;
}
function requireDeck(workspace: WorkspaceSnapshot, deckId: string) {
  const deck = workspace.decks.find(item => item.id === deckId);
  if (!deck) throw new Error('This deck no longer exists. No changes were saved.');
  if (deck.archived) throw new Error('Restore this archived deck before studying it.');
  return deck;
}
function requireContent(copy: LearningCopy) {
  const published = findPublishedCard(copy);
  if (!published) throw new Error('This card’s published content is unavailable. No changes were saved.');
  return published;
}
function requireTurn(workspace: WorkspaceSnapshot, turnId: string): ReviewSession {
  const session = workspace.session;
  if (!session || session.turnId !== turnId) throw new Error('This review has already changed. Reload the current card before trying again.');
  return session;
}
function requireCurrent(workspace: WorkspaceSnapshot, turnId: string) {
  const session = requireTurn(workspace, turnId);
  if (session.copyId === null) throw new Error('There is no current review card.');
  const copy = workspace.copies.find(item => item.id === session.copyId);
  if (!copy || copy.deckId !== session.deckId) throw new Error('This review’s card is unavailable. No changes were saved.');
  if (copy.removed) throw new Error('This card was removed from the deck. No changes were saved.');
  if (copy.suspended) throw new Error('This card is suspended. No changes were saved.');
  const deck = requireDeck(workspace, session.deckId);
  return { session, copy, deck, ...requireContent(copy) };
}
function nextSession(workspace: WorkspaceSnapshot, deckId: string, now: number, startedAt: number): ReviewSession {
  return reviewSessionSchema.parse({
    id: 'active', deckId, copyId: getDeckQueue(workspace, deckId, now).orderedIds[0] ?? null,
    turnId: crypto.randomUUID(), revealed: false, selectedOptionId: null,
    guessed: false, startedAt, shownAt: now,
  });
}
async function invalidateUndo(db: TsukiakariDatabase, workspace: WorkspaceSnapshot, deckId?: string): Promise<void> {
  const changes = workspace.reviewLogs.filter(log => log.undoable && (deckId === undefined || log.deckId === deckId));
  if (changes.length) await db.reviewLogs.bulkPut(changes.map(log => ({ ...log, undoable: false })));
}
function checkClock(now: number, session: ReviewSession): void {
  if (now < session.shownAt) throw new Error('The device clock is earlier than this review. Correct the clock before continuing.');
}

/** Resume the same deck without losing its revealed answer; another deck starts a new turn. */
export async function startReview(deckId: string, now = Date.now(), db = database): Promise<ReviewSession> {
  idSchema.parse(deckId); nowSchema.parse(now);
  return db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    requireDeck(workspace, deckId);
    // Imported decks may contain unavailable references; the queue excludes only those cards.
    if (workspace.session?.deckId === deckId) {
      checkClock(now, workspace.session);
      if (workspace.session.copyId !== null) { requireCurrent(workspace, workspace.session.turnId); return workspace.session; }
      const resumed = nextSession(workspace, deckId, now, workspace.session.startedAt);
      if (resumed.copyId === null) return workspace.session;
      await db.reviewSessions.put(resumed);
      return resumed;
    }
    await invalidateUndo(db, workspace);
    const session = nextSession(workspace, deckId, now, now);
    await db.reviewSessions.put(session);
    return session;
  });
}

/** A waiting session is refreshed on focus, rollover, or its next learning step. */
export async function refreshReview(turnId: string, now = Date.now(), db = database): Promise<ReviewSession> {
  idSchema.parse(turnId); nowSchema.parse(now);
  return db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const current = requireTurn(workspace, turnId);
    checkClock(now, current);
    requireDeck(workspace, current.deckId);
    if (current.copyId !== null) { requireCurrent(workspace, turnId); return current; }
    const next = nextSession(workspace, current.deckId, now, current.startedAt);
    if (next.copyId === null) return current;
    const copy = workspace.copies.find(item => item.id === next.copyId)!;
    requireContent(copy);
    await db.reviewSessions.put(next);
    return next;
  });
}

/** Freeze an MCQ selection before disclosing its answer. No scheduling happens here. */
export async function revealReview(turnId: string, selectedOptionId: string | null, guessed: boolean, db = database): Promise<ReviewSession> {
  idSchema.parse(turnId); z.boolean().parse(guessed); idSchema.nullable().parse(selectedOptionId);
  return db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const { session, card } = requireCurrent(workspace, turnId);
    if (session.revealed) throw new Error('This answer is already revealed. Its selection cannot be changed.');
    if (card.kind === 'recall' && (selectedOptionId !== null || guessed)) throw new Error('Recall cards do not have multiple-choice responses.');
    if (card.kind === 'mcq' && !card.options?.some(option => option.id === selectedOptionId)) throw new Error('Select an answer before revealing this question.');
    const revealed = reviewSessionSchema.parse({ ...session, revealed: true, selectedOptionId, guessed });
    await db.reviewSessions.put(revealed);
    return revealed;
  });
}

/** Schedule, leech state, audit log, quotas, and the next turn commit together. */
export async function submitReview(input: ReviewSubmission, now = Date.now(), db = database): Promise<ReviewSession> {
  const submission = submissionSchema.parse(input); nowSchema.parse(now);
  return db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const { session, copy, deck, card } = requireCurrent(workspace, submission.turnId);
    checkClock(now, session);
    if (!session.revealed) throw new Error('Reveal the answer before rating this card.');
    if (card.kind === 'mcq' && submission.rating === 'right' && session.selectedOptionId !== card.correctOptionId) throw new Error('An incorrect multiple-choice answer must be rated Again.');
    if (!getDeckQueue(workspace, deck.id, now, copy.id).orderedIds.includes(copy.id)) throw new Error('This card is not currently eligible under this deck’s daily limits. No review was saved.');
    const before = workspace.schedulerStates.find(state => state.copyId === copy.id) ?? initialState(copy.id);
    const after = schedulerStateSchema.parse(scheduleReview(before, submission.rating, deck.settings, now, workspace.preferences));
    const qualifyingLeech = before.state === 'review' && submission.rating === 'again' && after.lapses >= deck.settings.leechThreshold;
    const copyAfter = learningCopySchema.parse({
      ...copy, contentRevision: card.revision,
      tags: qualifyingLeech ? [...new Set([...copy.tags, 'leech'])] : copy.tags,
      suspended: qualifyingLeech && deck.settings.leechAction === 'suspend' ? true : copy.suspended,
    });
    const sequence = workspace.reviewLogs.reduce((latest, log) => Math.max(latest, log.sequence), 0) + 1;
    const log: ReviewLog = {
      id: crypto.randomUUID(), copyId: copy.id, deckId: deck.id, at: now,
      studyDay: getStudyDay(now, workspace.preferences), rating: submission.rating,
      durationMs: submission.durationMs, undone: false, undoable: true, sequence,
      contentRevision: card.revision, before, after, settings: structuredClone(deck.settings),
      timeZone: workspace.preferences.timeZone, dayStartsAtHour: workspace.preferences.dayStartsAtHour,
      copyBefore: copy, copyAfter, sessionBefore: session, sessionAfter: session,
    };
    const updated: WorkspaceSnapshot = {
      ...workspace,
      copies: workspace.copies.map(item => item.id === copy.id ? copyAfter : item),
      schedulerStates: [...workspace.schedulerStates.filter(state => state.copyId !== copy.id), after],
      reviewLogs: [...workspace.reviewLogs.map(previous => ({ ...previous, undoable: false })), log],
    };
    const next = nextSession(updated, deck.id, now, session.startedAt);
    log.sessionAfter = next;
    const validatedLog = reviewLogSchema.parse(log);
    await db.schedulerStates.put(after);
    await db.copies.put(copyAfter);
    await invalidateUndo(db, workspace);
    await db.reviewLogs.add(validatedLog);
    await db.reviewSessions.put(next);
    return next;
  });
}

/** One-level undo retains an audit record and cannot revive an older undo command. */
export async function undoLastReview(now = Date.now(), db = database): Promise<ReviewSession> {
  nowSchema.parse(now);
  return db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const log = workspace.reviewLogs.find(item => item.undoable && !item.undone);
    if (!log) throw new Error('There is no review available to undo.');
    if (now < log.at) throw new Error('The device clock is earlier than this review. Correct the clock before undoing it.');
    requireDeck(workspace, log.deckId);
    if (workspace.copies.find(copy => copy.id === log.copyId)?.removed) throw new Error('This card was removed from its deck. Undo is unavailable.');
    const currentState = workspace.schedulerStates.find(state => state.copyId === log.copyId);
    const currentCopy = workspace.copies.find(copy => copy.id === log.copyId);
    if (JSON.stringify(currentState) !== JSON.stringify(log.after) || JSON.stringify(currentCopy) !== JSON.stringify(log.copyAfter)) throw new Error('This card changed after its review. Undo is unavailable; your data has not been changed.');
    const restored = reviewSessionSchema.parse({ ...log.sessionBefore, turnId: crypto.randomUUID(), shownAt: now });
    await db.schedulerStates.put(log.before);
    await db.copies.put(log.copyBefore);
    await db.reviewLogs.put(reviewLogSchema.parse({ ...log, undone: true, undoable: false }));
    await db.reviewSessions.put(restored);
    return restored;
  });
}

/** New settings affect later answers in this deck, without rewriting existing schedules. */
export async function saveDeckSettings(deckId: string, settings: DeckSettings, db = database): Promise<void> {
  idSchema.parse(deckId);
  const validated = deckSettingsSchema.parse(settings);
  await db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const deck = requireDeck(workspace, deckId);
    if (JSON.stringify(deck.settings) === JSON.stringify(validated)) return;
    await db.decks.put(deckSchema.parse({ ...deck, settings: validated }));
    await invalidateUndo(db, workspace, deckId);
    if (workspace.session?.deckId === deckId) await db.reviewSessions.delete('active');
  });
}

/** Suspension preserves schedules and history; unsuspension keeps the leech tag and lapse count. */
export async function setCopySuspended(copyId: string, suspended: boolean, now = Date.now(), db = database): Promise<void> {
  idSchema.parse(copyId); z.boolean().parse(suspended); nowSchema.parse(now);
  await db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const copy = workspace.copies.find(item => item.id === copyId);
    if (!copy) throw new Error('This learning copy no longer exists.');
    if (copy.suspended === suspended) return;
    const changed = learningCopySchema.parse({ ...copy, suspended });
    await db.copies.put(changed);
    await invalidateUndo(db, workspace, copy.deckId);
    const current = workspace.session;
    if (current?.deckId === copy.deckId && (current.copyId === copyId || current.copyId === null)) {
      checkClock(now, current);
      const updated = { ...workspace, copies: workspace.copies.map(item => item.id === copyId ? changed : item) };
      const next = nextSession(updated, current.deckId, now, current.startedAt);
      await db.reviewSessions.put(next);
    }
  });
}

/** Explicit recovery after importing a session whose published content is not installed. */
export async function skipUnavailableReview(turnId: string, now = Date.now(), db = database): Promise<ReviewSession> {
  idSchema.parse(turnId); nowSchema.parse(now);
  return db.transaction('rw', db.tables, async () => {
    const workspace = await readForMutation(db);
    const current = requireTurn(workspace, turnId);
    checkClock(now, current); requireDeck(workspace, current.deckId);
    const copy = workspace.copies.find(item => item.id === current.copyId);
    if (!copy || findPublishedCard(copy)) throw new Error('Only unavailable published content can be skipped this way.');
    await invalidateUndo(db, workspace);
    const next = nextSession(workspace, current.deckId, now, current.startedAt);
    await db.reviewSessions.put(next);
    return next;
  });
}
