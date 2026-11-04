import { createEmptyCard, fsrs, FSRSVersion, Rating } from 'ts-fsrs';

export interface FsrsCompatibility {
  libraryVersion: string;
  modelVersion: string;
  desiredRetention: number;
  againDueAt: number;
  rightDueAt: number;
}

/**
 * An isolated dependency probe, not the production scheduler.
 * It uses a fixed, synthetic card and never reads or writes learner data.
 */
export function checkFsrsCompatibility(): FsrsCompatibility {
  const version = /^v([\d.]+) using (FSRS-[\d.]+)$/.exec(FSRSVersion);
  if (!version) throw new Error(`Unsupported FSRS version metadata: ${FSRSVersion}`);

  const now = new Date('2026-10-20T12:00:00.000Z');
  const desiredRetention = 0.9;
  const scheduler = fsrs({
    request_retention: desiredRetention,
    enable_fuzz: false,
    learning_steps: ['1m', '10m', '1h'],
    relearning_steps: ['10m', '1h'],
  });
  // Omitting w deliberately selects the library's standard parameters.
  const outcomes = scheduler.repeat(createEmptyCard(now), now);
  const againDueAt = outcomes[Rating.Again].card.due.getTime();
  // The future UI's "Right" label maps to FSRS Good, never Easy.
  const rightDueAt = outcomes[Rating.Good].card.due.getTime();

  if (!Number.isFinite(againDueAt) || !Number.isFinite(rightDueAt)
    || againDueAt <= now.getTime() || rightDueAt <= againDueAt) {
    throw new Error('FSRS returned invalid fixture intervals.');
  }

  return {
    libraryVersion: version[1], modelVersion: version[2], desiredRetention,
    againDueAt, rightDueAt,
  };
}
