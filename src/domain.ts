/** Published material and learner records deliberately have separate identities. */
export type Theme = 'dark' | 'light' | 'system';
export interface Source { id: string; title: string; url: string; }
export interface Topic { id: string; title: string; }
export interface StudyNote { id: string; title: string; body: string; sourceIds: string[]; }
export interface Option { id: string; text: string; }
export interface PublishedCard {
  id: string; revision: number; topicId: string; kind: 'recall' | 'mcq';
  prompt: string; answer: string; explanation: string; sourceIds: string[]; noteIds: string[];
  tags: string[]; options?: Option[]; correctOptionId?: string;
}
export interface StudyPack {
  id: string; version: string; title: string; description: string;
  fixture: boolean; examEnabled: boolean;
  topics: Topic[]; sources: Source[]; notes: StudyNote[]; cards: PublishedCard[];
}
export interface CanonicalCardRef { packId: string; cardId: string; }
export interface CanonicalNoteRef { packId: string; noteId: string; }
export interface StudyCuration {
  id: string; version: string; title: string; description: string; fixture: boolean;
  topics: Topic[]; cards: (CanonicalCardRef & { topicId: string })[];
  notes: CanonicalNoteRef[]; questionBankIds: string[];
}
export interface ExamQuestion {
  id: string; revision: number; kind: 'single' | 'multiple'; domainId: string;
  objectiveIds: string[]; conceptId: string; prompt: string; answer: string; explanation: string;
  sourceIds: string[]; tags: string[]; options: Option[]; correctOptionIds: string[];
  optionExplanations: Record<string, string>; relatedNotes: CanonicalNoteRef[];
  status: 'draft' | 'approved';
}
export interface QuestionBank {
  id: string; version: string; title: string; description: string; fixture: boolean;
  domains: { id: string; title: string; weight: number }[];
  sources: Source[]; questions: ExamQuestion[];
}
export interface TestExposure { id: string; bankId: string; questionId: string; lastSeenAt: number; }
export interface DeckSettings {
  newCardsPerDay: number; maximumReviewsPerDay: number; learningStepsMinutes: number[];
  relearningStepsMinutes: number[]; desiredRetention: number; leechThreshold: number;
  leechAction: 'suspend' | 'tag';
}
export interface Deck { id: string; name: string; createdAt: number; settings: DeckSettings; archived?: boolean; }
export interface LearningCopy {
  id: string; deckId: string; packId: string; cardId: string; contentRevision: number;
  createdAt: number; personalNote: string; tags: string[]; suspended: boolean; removed?: boolean;
}
export interface SchedulerState {
  copyId: string; algorithm: string; libraryVersion: string; modelVersion: string; parametersVersion: string;
  state: 'new' | 'learning' | 'review' | 'relearning'; dueAt: number | null;
  stability: number; difficulty: number; repetitions: number; lapses: number; elapsedDays: number; scheduledDays: number;
  learningStep: number; lastReviewAt: number | null;
}
export interface ReviewLog {
  id: string; copyId: string; deckId: string; at: number; studyDay: string;
  rating: 'again' | 'right'; durationMs: number; undone: boolean; contentRevision: number;
  before: SchedulerState; after: SchedulerState; settings: DeckSettings;
  sequence: number; undoable: boolean; timeZone: string; dayStartsAtHour: number;
  copyBefore: LearningCopy; copyAfter: LearningCopy;
  sessionBefore: ReviewSession; sessionAfter: ReviewSession;
}
export interface ReviewSession {
  id: 'active'; deckId: string; copyId: string | null; turnId: string;
  revealed: boolean; selectedOptionId: string | null; guessed: boolean;
  startedAt: number; shownAt: number;
}
export interface TestQuestionSnapshot {
  bankId: string; card: ExamQuestion; sources: Source[]; domainTitle: string;
}
export interface TestAttempt {
  id: string; bankId: string; mode: 'practice' | 'exam'; startedAt: number;
  bankTitle?: string; bankVersion?: string; fixture?: boolean; durationMinutes?: number; retryOf?: string;
  deadlineAt: number | null; completedAt: number | null; questions: TestQuestionSnapshot[];
  responses: { cardId: string; selectedOptionIds: string[]; revealed: boolean }[];
  result: { correct: number; wrong: number; skipped: number } | null;
}
export interface Preferences {
  id: 'preferences'; theme: Theme; timeZone: string; dayStartsAtHour: number;
}
export interface WorkspaceSnapshot {
  decks: Deck[]; copies: LearningCopy[]; preferences: Preferences;
  schedulerStates: SchedulerState[]; reviewLogs: ReviewLog[]; session: ReviewSession | null;
  testAttempts: TestAttempt[]; testExposures: TestExposure[];
}
export const DEFAULT_DECK_SETTINGS: Readonly<DeckSettings> = Object.freeze({
  newCardsPerDay: 20, maximumReviewsPerDay: 9999,
  learningStepsMinutes: [1, 10, 60], relearningStepsMinutes: [10, 60],
  desiredRetention: 0.9, leechThreshold: 10, leechAction: 'suspend',
});
export function newDeckSettings(): DeckSettings { return structuredClone(DEFAULT_DECK_SETTINGS); }
function isUsableTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
}
/** Browsers cannot name a host zone their time data doesn't include, so fall back to the offset they report. */
export function detectTimeZone(now = new Date()): string {
  const named: unknown = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (isUsableTimeZone(named)) return named;
  const minutes = now.getTimezoneOffset();
  if (minutes === 0) return 'UTC';
  const behindUtc = minutes > 0;
  const hours = Math.abs(minutes) / 60;
  if (Number.isInteger(hours) && hours <= (behindUtc ? 12 : 14)) return `Etc/GMT${behindUtc ? '+' : '-'}${hours}`;
  const clock = [Math.floor(hours), Math.abs(minutes) % 60].map(part => String(part).padStart(2, '0')).join(':');
  const offset = `${behindUtc ? '-' : '+'}${clock}`;
  return isUsableTimeZone(offset) ? offset : 'UTC';
}
/** Etc/GMT names use the reverse of the usual sign, so show them as UTC offsets. */
export function timeZoneLabel(timeZone: string): string {
  const fixed = /^Etc\/GMT([+-])(\d{1,2})$/.exec(timeZone);
  return fixed ? `UTC${fixed[1] === '+' ? '-' : '+'}${fixed[2].padStart(2, '0')}:00` : timeZone;
}
export function defaultPreferences(): Preferences {
  return { id: 'preferences', theme: 'system', timeZone: detectTimeZone(), dayStartsAtHour: 5 };
}
