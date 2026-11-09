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
interface ExamQuestionBase {
  id: string; revision: number; domainId: string;
  objectiveIds: string[]; conceptId: string; prompt: string; answer: string; explanation: string;
  sourceIds: string[]; tags: string[]; optionExplanations: Record<string, string>;
  relatedNotes: CanonicalNoteRef[]; status: 'draft' | 'approved';
  /** Case study or series this question belongs to. Grouped questions are delivered whole. */
  groupId?: string;
}
export interface SelectionQuestion extends ExamQuestionBase {
  kind: 'single' | 'multiple'; options: Option[]; correctOptionIds: string[];
}
/** Heading text for the two-column answer area shared by match and hotspot questions. */
export interface AnswerTable { title: string; rowHeading: string; answerHeading: string; }
/** Tokens stay in the tray, so one token can fill several rows or none. */
export interface MatchQuestion extends ExamQuestionBase {
  kind: 'match'; tray: string; table: AnswerTable; tokens: Option[];
  rows: { id: string; label: string; correctTokenId: string }[];
}
/** The answer area has exactly correctOrder.length positions; other tokens are distractors. */
export interface OrderQuestion extends ExamQuestionBase {
  kind: 'order'; tray: string; tokens: Option[]; correctOrder: string[];
}
export interface HotspotQuestion extends ExamQuestionBase {
  kind: 'hotspot'; table: AnswerTable;
  rows: { id: string; label: string; options: Option[]; correctOptionId: string }[];
}
export type ExamQuestion = SelectionQuestion | MatchQuestion | OrderQuestion | HotspotQuestion;
/** Blueprint formats. A series is single-answer content delivered as a one-way group. */
export type QuestionFormat = 'single' | 'multiple' | 'match' | 'order' | 'hotspot' | 'series';
export interface QuestionGroup {
  id: string; kind: 'case-study' | 'series'; title: string;
  exhibits: { id: string; title: string; body: string }[];
}
/** Declaring a blueprint opts a bank into assembled exams, per-selection scoring and exam delivery. */
export interface BankBlueprint {
  defaultCount: number; caseStudyEvery: number; seriesEvery: number;
  shares: Record<QuestionFormat, number>;
}
export interface QuestionBank {
  id: string; version: string; title: string; description: string; fixture: boolean;
  domains: { id: string; title: string; weight: number }[];
  sources: Source[]; questions: ExamQuestion[];
  groups?: QuestionGroup[]; blueprint?: BankBlueprint;
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
export interface TestResponse {
  cardId: string; selectedOptionIds: string[]; revealed: boolean;
  /** Match and hotspot: row ID to chosen ID. Order: position ID to token ID. */
  placements?: Record<string, string>;
}
export interface TestSection { id: string; kind: 'general' | 'case-study' | 'series'; title: string; groupId?: string; cardIds: string[]; }
export interface TestDelivery {
  sections: TestSection[]; position: number; flaggedCardIds: string[];
  /** Questions before this index are closed in Exam Mode. A single watermark covers sections and series. */
  lockedBefore: number;
}
export interface TestAttempt {
  id: string; bankId: string; mode: 'practice' | 'exam'; startedAt: number;
  bankTitle?: string; bankVersion?: string; fixture?: boolean; durationMinutes?: number; retryOf?: string;
  deadlineAt: number | null; completedAt: number | null; questions: TestQuestionSnapshot[];
  responses: TestResponse[];
  result: { correct: number; wrong: number; skipped: number; points?: { earned: number; possible: number } } | null;
  /** Absent on every attempt before Phase 8, which keeps one point per question and exact-set scoring. */
  scoring?: 'per-selection';
  groups?: QuestionGroup[]; delivery?: TestDelivery;
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
