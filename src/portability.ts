import { z } from 'zod';
import type { WorkspaceSnapshot } from './domain';
import { deckSchema, deckSettingsSchema, idSchema, learningCopySchema, preferencesSchema, reviewLogSchema, reviewSessionSchema, schedulerStateSchema, testAttemptSchema, testExposureSchema } from './validation';
import { getStudyDay } from './studyDay';
import { legacyTestAttemptSchema } from './legacyTestValidation';
import { migrateLegacyTestAttempt, collectTestExposures } from './testMigration';

const timestamp = z.number().int().nonnegative().max(253402300799999);
const unique = (ids: string[]) => new Set(ids).size === ids.length;
export const workspaceBackupSchema = z.strictObject({
  decks: z.array(deckSchema), copies: z.array(learningCopySchema), preferences: preferencesSchema,
  schedulerStates: z.array(schedulerStateSchema), reviewLogs: z.array(reviewLogSchema),
  session: reviewSessionSchema.nullable(), testAttempts: z.array(testAttemptSchema), testExposures: z.array(testExposureSchema),
}).superRefine((w, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  for (const key of ['decks', 'copies', 'reviewLogs', 'testAttempts', 'testExposures'] as const) {
    if (!unique(w[key].map(item => item.id))) issue('Duplicate identities in ' + key + '.');
  }
  if (!unique(w.schedulerStates.map(state => state.copyId))) issue('Duplicate schedule identities.');
  if (!unique(w.copies.map(copy => JSON.stringify([copy.deckId, copy.packId, copy.cardId])))) issue('Duplicate card membership in a deck.');
  const decks = new Map(w.decks.map(deck => [deck.id, deck]));
  const copies = new Map(w.copies.map(copy => [copy.id, copy]));
  const states = new Map(w.schedulerStates.map(state => [state.copyId, state]));
  if (w.copies.some(copy => !decks.has(copy.deckId))) issue('A card refers to a missing deck.');
  if (w.schedulerStates.some(state => !copies.has(state.copyId))) issue('A schedule refers to a missing card.');
  for (const log of w.reviewLogs) {
    const copy = copies.get(log.copyId);
    if (!copy || copy.deckId !== log.deckId || copy.packId !== log.copyAfter.packId || copy.cardId !== log.copyAfter.cardId) issue('Review history belongs to a missing or different card.');
    if (log.sessionAfter.copyId !== null && copies.get(log.sessionAfter.copyId)?.deckId !== log.deckId) issue('A review session snapshot refers to a different deck.');
    try { if (getStudyDay(log.at, log) !== log.studyDay) issue('A review study day does not match its recorded timezone and boundary.'); }
    catch { issue('A review study day is invalid.'); }
  }
  const session = w.session;
  if (session && (!decks.has(session.deckId) || decks.get(session.deckId)?.archived || (session.copyId !== null && (copies.get(session.copyId)?.deckId !== session.deckId || copies.get(session.copyId)?.removed)))) issue('The active review session refers to an unavailable deck or card.');
  if (!unique(w.reviewLogs.map(log => String(log.sequence)))) issue('Review sequence numbers conflict.');
  const latest = w.reviewLogs.reduce((n, log) => Math.max(n, log.sequence), 0);
  const undo = w.reviewLogs.filter(log => log.undoable);
  if (undo.length > 1 || undo.some(log => log.undone || log.sequence !== latest)) issue('Undo history is inconsistent.');
  for (const log of undo) {
    if (JSON.stringify(states.get(log.copyId)) !== JSON.stringify(log.after) || JSON.stringify(copies.get(log.copyId)) !== JSON.stringify(log.copyAfter)) issue('Undo snapshots do not match the current card and schedule.');
  }
  if (w.testAttempts.filter(attempt => attempt.completedAt === null).length > 1) issue('Only one unfinished test is allowed.');
});
const envelope = { format: z.literal('tsukiakari'), version: z.literal(3), exportedAt: timestamp };
const fullSchema = z.strictObject({ ...envelope, kind: z.literal('full'), workspace: workspaceBackupSchema });
const deckSchemaExport = z.strictObject({ ...envelope, kind: z.literal('deck'), deck: z.strictObject({
  name: z.string().trim().min(1), settings: deckSettingsSchema,
  cards: z.array(z.strictObject({ packId: idSchema, cardId: idSchema, contentRevision: z.number().int().positive() }))
    .refine(cards => unique(cards.map(card => JSON.stringify([card.packId, card.cardId]))), 'Deck selection contains duplicate cards.'),
}) });
const settingsSchema = z.strictObject({ ...envelope, kind: z.literal('settings'), preferences: preferencesSchema,
  decks: z.array(z.strictObject({ id: idSchema, name: z.string().trim().min(1), settings: deckSettingsSchema }))
    .refine(decks => unique(decks.map(deck => deck.id)), 'Duplicate settings deck identities.'),
});
const backupSchema = z.discriminatedUnion('kind', [fullSchema, deckSchemaExport, settingsSchema]);
export type Backup = z.infer<typeof backupSchema>;
const { testExposures: _legacyExcluded, ...legacyWorkspaceFields } = workspaceBackupSchema.shape;
const legacyWorkspaceSchema = z.strictObject({ ...legacyWorkspaceFields, testAttempts: z.array(legacyTestAttemptSchema) });
const legacyBackupSchema = z.discriminatedUnion('kind', [
  fullSchema.extend({ version: z.literal(1), workspace: legacyWorkspaceSchema }),
  deckSchemaExport.extend({ version: z.literal(1) }),
  settingsSchema.extend({ version: z.literal(1) }),
]);
export function parseBackup(input: unknown): Backup {
  const { version } = z.object({ version: z.union([z.literal(1), z.literal(2), z.literal(3)]) }).parse(input);
  if (version === 3) return backupSchema.parse(input);
  // Version 3 only adds optional records, so every version 2 file is valid as it stands.
  if (version === 2) return backupSchema.parse({ ...(input as object), version: 3 });
  const legacy = legacyBackupSchema.parse(input);
  if (legacy.kind !== 'full') return backupSchema.parse({ ...legacy, version: 3 });
  const testAttempts = legacy.workspace.testAttempts.map(migrateLegacyTestAttempt);
  return backupSchema.parse({ ...legacy, version: 3, workspace: {
    ...legacy.workspace, testAttempts, testExposures: collectTestExposures(testAttempts),
  } });
}
export function createFullBackup(workspace: WorkspaceSnapshot, now = Date.now()): Extract<Backup, {kind:'full'}> {
  return fullSchema.parse({ format:'tsukiakari', version:3, exportedAt:now, kind:'full', workspace });
}
export function createDeckBackup(workspace: WorkspaceSnapshot, deckId: string, now = Date.now()): Extract<Backup, {kind:'deck'}> {
  const checked = workspaceBackupSchema.parse(workspace);
  const deck = checked.decks.find(item => item.id === deckId);
  if (!deck) throw new Error('Choose an existing deck to export.');
  return deckSchemaExport.parse({ format:'tsukiakari', version:3, exportedAt:now, kind:'deck', deck:{ name:deck.name, settings:deck.settings,
    cards:checked.copies.filter(copy => copy.deckId === deckId && !copy.removed).map(({packId,cardId,contentRevision}) => ({packId,cardId,contentRevision})),
  } });
}
export function createSettingsBackup(workspace: WorkspaceSnapshot, now = Date.now()): Extract<Backup, {kind:'settings'}> {
  const checked = workspaceBackupSchema.parse(workspace);
  return settingsSchema.parse({ format:'tsukiakari', version:3, exportedAt:now, kind:'settings', preferences:checked.preferences,
    decks:checked.decks.map(({id,name,settings}) => ({id,name,settings})),
  });
}
