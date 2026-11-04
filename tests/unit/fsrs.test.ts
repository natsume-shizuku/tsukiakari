import { describe, expect, it } from 'vitest';
import {
  createEmptyCard, default_w, fsrs, FSRSVersion, generatorParameters, Rating,
  State, TypeConvert,
} from 'ts-fsrs';
import type { CardInput, ReviewLogInput } from 'ts-fsrs';
import { checkFsrsCompatibility } from '../../src/feasibility/fsrs';

const now = new Date('2026-10-20T12:00:00.000Z');
const parameters = {
  request_retention: 0.9,
  enable_fuzz: false,
  learning_steps: ['1m', '10m', '1h'],
  relearning_steps: ['10m', '1h'],
} as const;

describe('pinned FSRS dependency feasibility', () => {
  it('reports the installed library separately from the algorithm model', () => {
    expect(FSRSVersion).toBe('v5.4.2 using FSRS-6.0');
    expect(checkFsrsCompatibility()).toEqual({
      libraryVersion: '5.4.2', modelVersion: 'FSRS-6.0',
      desiredRetention: 0.9,
      againDueAt: now.getTime() + 60_000,
      rightDueAt: now.getTime() + 600_000,
    });
  });

  it('uses all 21 standard weights and repeats deterministically', () => {
    expect(generatorParameters(parameters).w).toEqual(default_w);
    expect(default_w).toHaveLength(21);
    expect(checkFsrsCompatibility()).toEqual(checkFsrsCompatibility());
  });

  it('previews distinct Again and Good outcomes without mutating the new card', () => {
    const source = createEmptyCard(now);
    const before = structuredClone(source);
    const outcomes = fsrs(parameters).repeat(source, now);
    expect(source).toEqual(before);
    expect(outcomes[Rating.Again].log.rating).toBe(Rating.Again);
    expect(outcomes[Rating.Good].log.rating).toBe(Rating.Good);
    expect(outcomes[Rating.Again].card).not.toEqual(outcomes[Rating.Good].card);
    for (const grade of [Rating.Again, Rating.Good] as const) {
      const { card, log } = outcomes[grade];
      expect(card.state).toBe(State.Learning);
      expect(card.reps).toBe(1);
      expect(card.lapses).toBe(0);
      expect(Number.isFinite(card.stability)).toBe(true);
      expect(card.stability).toBeGreaterThan(0);
      expect(card.difficulty).toBeGreaterThanOrEqual(1);
      expect(card.difficulty).toBeLessThanOrEqual(10);
      expect(log.review.getTime()).toBe(now.getTime());
    }
  });

  it('round-trips a card and review log through JSON without changing the next result', () => {
    const scheduler = fsrs(parameters);
    const result = scheduler.next(createEmptyCard(now), now, Rating.Good);
    // This is trusted synthetic test data. Imports will need application validation.
    const serialized = JSON.parse(JSON.stringify(result)) as {
      card: CardInput; log: ReviewLogInput;
    };
    const restored = {
      card: TypeConvert.card(serialized.card),
      log: TypeConvert.review_log(serialized.log),
    };
    expect(restored).toEqual(result);
    expect(scheduler.next(restored.card, restored.card.due, Rating.Good))
      .toEqual(scheduler.next(result.card, result.card.due, Rating.Good));
    expect(scheduler.rollback(restored.card, restored.log))
      .toEqual(createEmptyCard(now));
  });
});

