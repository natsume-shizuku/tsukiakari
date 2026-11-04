import { fsrs, FSRSVersion, Rating, State } from 'ts-fsrs';
import type { Card, StepUnit } from 'ts-fsrs';
import { findPublishedCard } from './content/catalog';
import type { DeckSettings, LearningCopy, Preferences, SchedulerState, WorkspaceSnapshot } from './domain';
import { deckSettingsSchema, idSchema, schedulerStateSchema } from './validation';
import { addStudyDays, assertTimestamp, getStudyDay, studyDayAsUtcNoon, studyDayStart } from './studyDay';

export { getStudyDay, studyDayStart } from './studyDay';

export const SCHEDULER_METADATA = Object.freeze({
  algorithm: 'FSRS',
  libraryVersion: '5.4.2',
  modelVersion: 'FSRS-6.0',
  parametersVersion: 'standard-fsrs6-app-policy-v1',
});
if (FSRSVersion !== 'v5.4.2 using FSRS-6.0') throw new Error('The installed scheduler version needs an explicit compatibility review.');

const states = { new: State.New, learning: State.Learning, review: State.Review, relearning: State.Relearning } as const;
const stateNames: Record<State, SchedulerState['state']> = {
  [State.New]: 'new', [State.Learning]: 'learning', [State.Review]: 'review', [State.Relearning]: 'relearning',
};

export function initialState(copyId: string): SchedulerState {
  idSchema.parse(copyId);
  return {
    copyId, ...SCHEDULER_METADATA, state: 'new', dueAt: null,
    stability: 0, difficulty: 0, repetitions: 0, lapses: 0, elapsedDays: 0,
    scheduledDays: 0, learningStep: 0, lastReviewAt: null,
  };
}

/**
 * Use the pinned library's standard weights and deterministic intervals (no fuzz).
 * FSRS 5.4.2 measures elapsed days by UTC date boundaries, including learning.
 * Synthetic UTC-noon dates express our saved timezone's study-day calendar to that
 * calculation. Real timestamps remain in every persisted state/log; intraday
 * durations are mapped back onto the real instant, and Review dues use the local
 * day boundary. This policy is versioned separately from FSRS's model/weights.
 */
export function scheduleReview(
  before: SchedulerState,
  rating: 'again' | 'right',
  settings: DeckSettings,
  now: number,
  preferences: Preferences,
): SchedulerState {
  assertTimestamp(now);
  const checked = schedulerStateSchema.parse(before);
  const options = deckSettingsSchema.parse(settings);
  if (rating !== 'again' && rating !== 'right') throw new Error('A review must be rated Again or Right.');
  if (Object.entries(SCHEDULER_METADATA).some(([key, value]) => checked[key as keyof typeof SCHEDULER_METADATA] !== value)) {
    throw new Error('This saved schedule uses an unsupported scheduler version.');
  }
  if (checked.lastReviewAt !== null && now < checked.lastReviewAt) throw new Error('Review time cannot precede the previous review.');
  const studyDay = getStudyDay(now, preferences);
  const syntheticNow = studyDayAsUtcNoon(studyDay);
  const stepCount = checked.state === 'relearning' || checked.state === 'review'
    ? options.relearningStepsMinutes.length : options.learningStepsMinutes.length;
  // Shortening a deck's steps must not make Again accidentally graduate a card.
  const learningStep = checked.state === 'review' ? 0 : Math.min(checked.learningStep, stepCount - 1);
  const input: Card = {
    due: new Date(syntheticNow), state: states[checked.state],
    stability: checked.stability, difficulty: checked.difficulty,
    elapsed_days: checked.elapsedDays, scheduled_days: checked.scheduledDays,
    learning_steps: learningStep, reps: checked.repetitions, lapses: checked.lapses,
    ...(checked.lastReviewAt === null ? {} : {
      last_review: new Date(studyDayAsUtcNoon(getStudyDay(checked.lastReviewAt, preferences))),
    }),
  };
  const scheduler = fsrs({
    request_retention: options.desiredRetention,
    enable_fuzz: false,
    enable_short_term: true,
    learning_steps: options.learningStepsMinutes.map(minutes => `${minutes}m` as StepUnit),
    relearning_steps: options.relearningStepsMinutes.map(minutes => `${minutes}m` as StepUnit),
  });
  const { card } = scheduler.next(input, syntheticNow, rating === 'again' ? Rating.Again : Rating.Good);
  const state = stateNames[card.state];
  const dueAt = state === 'review'
    ? studyDayStart(addStudyDays(studyDay, card.scheduled_days), preferences)
    : now + (card.due.getTime() - syntheticNow);
  if (dueAt <= now) throw new Error('The scheduler returned a due time that is not in the future.');
  return schedulerStateSchema.parse({
    copyId: checked.copyId, ...SCHEDULER_METADATA, state, dueAt,
    stability: card.stability, difficulty: card.difficulty, repetitions: card.reps,
    lapses: card.lapses, elapsedDays: card.elapsed_days, scheduledDays: card.scheduled_days,
    learningStep: card.learning_steps, lastReviewAt: now,
  });
}

export interface DeckQueue {
  learningIds: string[];
  reviewIds: string[];
  newIds: string[];
  orderedIds: string[];
  nextDueAt: number | null;
  newUsed: number;
  reviewsUsed: number;
  newRemaining: number;
  reviewRemaining: number;
  suspendedCount: number;
}

function stableCopyOrder(a: LearningCopy, b: LearningCopy): number {
  return a.createdAt - b.createdAt || a.id.localeCompare(b.id, 'en');
}

export function getDeckQueue(workspace: WorkspaceSnapshot, deckId: string, now: number): DeckQueue {
  assertTimestamp(now);
  const deck = workspace.decks.find(candidate => candidate.id === deckId);
  if (!deck) throw new Error('The selected deck no longer exists.');
  const settings = deckSettingsSchema.parse(deck.settings);
  const today = getStudyDay(now, workspace.preferences);
  const todayLogs = workspace.reviewLogs.filter(log => !log.undone && log.deckId === deckId && log.studyDay === today);
  const newUsed = todayLogs.filter(log => log.before.state === 'new').length;
  const reviewsUsed = todayLogs.filter(log => log.before.state === 'review').length;
  const newRemaining = Math.max(0, settings.newCardsPerDay - newUsed);
  const reviewRemaining = Math.max(0, settings.maximumReviewsPerDay - reviewsUsed);
  const copies = workspace.copies.filter(copy => copy.deckId === deckId && !copy.removed);
  const statesById = new Map(workspace.schedulerStates.map(state => [state.copyId, state]));
  const available = copies.filter(copy => !deck.archived && !copy.suspended && findPublishedCard(copy));
  const learning: LearningCopy[] = [];
  const review: LearningCopy[] = [];
  const fresh: LearningCopy[] = [];
  let nextDueAt: number | null = null;
  for (const copy of available) {
    const state = statesById.get(copy.id);
    if (!state || state.state === 'new') {
      fresh.push(copy);
    } else if (state.dueAt !== null && state.dueAt <= now) {
      (state.state === 'review' ? review : learning).push(copy);
    } else if (state.dueAt !== null) {
      nextDueAt = Math.min(nextDueAt ?? state.dueAt, state.dueAt);
    }
  }
  const dueOrder = (a: LearningCopy, b: LearningCopy) =>
    statesById.get(a.id)!.dueAt! - statesById.get(b.id)!.dueAt! || stableCopyOrder(a, b);
  const learningIds = learning.sort(dueOrder).map(copy => copy.id);
  const reviewIds = review.sort(dueOrder).slice(0, reviewRemaining).map(copy => copy.id);
  const newIds = fresh.sort(stableCopyOrder).slice(0, newRemaining).map(copy => copy.id);
  return {
    learningIds, reviewIds, newIds, orderedIds: [...learningIds, ...reviewIds, ...newIds],
    nextDueAt, newUsed, reviewsUsed, newRemaining: deck.archived ? 0 : newRemaining, reviewRemaining: deck.archived ? 0 : reviewRemaining,
    suspendedCount: copies.filter(copy => copy.suspended).length,
  };
}
