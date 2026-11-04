import { describe, expect, it } from 'vitest';
import { newDeckSettings, type SchedulerState } from '../../src/domain';
import { deckSettingsSchema, reviewSessionSchema, schedulerStateSchema } from '../../src/validation';

const state: SchedulerState = {
  copyId: 'copy', algorithm: 'FSRS', libraryVersion: '5.4.2', modelVersion: 'FSRS-6.0', parametersVersion: 'standard',
  state: 'review', dueAt: 1000, stability: 2, difficulty: 5, repetitions: 1, lapses: 0,
  elapsedDays: 0, scheduledDays: 1, learningStep: 0, lastReviewAt: 500,
};

describe('review state boundaries', () => {
  it('rejects studied schedules that would silently disappear from the queue', () => {
    expect(() => schedulerStateSchema.parse({ ...state, dueAt: null })).toThrow(/valid memory/);
    expect(() => schedulerStateSchema.parse({ ...state, lastReviewAt: null })).toThrow(/valid memory/);
    expect(() => schedulerStateSchema.parse({ ...state, dueAt: 499 })).toThrow(/valid memory/);
    expect(() => schedulerStateSchema.parse({ ...state, stability: 0 })).toThrow(/valid memory/);
  });
  it('rejects impossible counters and histories disguised as new cards', () => {
    expect(() => schedulerStateSchema.parse({ ...state, lapses: 2 })).toThrow(/Lapses/);
    expect(() => schedulerStateSchema.parse({ ...state, state: 'new', dueAt: null, lastReviewAt: null })).toThrow(/new schedule/);
    expect(schedulerStateSchema.parse(state)).toEqual(state);
  });
  it('does not accept a stale answer in an empty session or a reverse session clock', () => {
    const session = { id: 'active', deckId: 'deck', copyId: null, turnId: 'turn', revealed: false, selectedOptionId: null, guessed: false, startedAt: 500, shownAt: 500 };
    expect(reviewSessionSchema.parse(session)).toEqual(session);
    expect(() => reviewSessionSchema.parse({ ...session, revealed: true })).toThrow(/waiting session/);
    expect(() => reviewSessionSchema.parse({ ...session, selectedOptionId: 'option' })).toThrow(/waiting session/);
    expect(() => reviewSessionSchema.parse({ ...session, shownAt: 499 })).toThrow(/before it starts/);
  });
  it.each([[0], [0.5], [1440], [10, 1], [10, 10], []].map(steps => ({ steps })))('rejects unsupported minute steps $steps', ({ steps }) => {
    expect(() => deckSettingsSchema.parse({ ...newDeckSettings(), learningStepsMinutes: steps })).toThrow();
    expect(() => deckSettingsSchema.parse({ ...newDeckSettings(), relearningStepsMinutes: steps })).toThrow();
  });
  it('accepts zero daily limits for a deck without disabling ongoing learning', () => {
    const settings = { ...newDeckSettings(), newCardsPerDay: 0, maximumReviewsPerDay: 0 };
    expect(deckSettingsSchema.parse(settings)).toEqual(settings);
  });
});
