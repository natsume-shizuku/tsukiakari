import type { QuestionBank, TestAttempt } from './domain';
import { database, loadWorkspace, type TsukiakariDatabase } from './storage';
import { answerTestAttempt, completeTestAttempt, createTestAttempt, revealTestAttempt, retryAttempt, testHasExpired, type TestOptions } from './testEngine';
import { idSchema, testAttemptSchema } from './validation';
import { collectTestExposures } from './testMigration';

function ensureNoActive(attempts: TestAttempt[]): void {
  if (attempts.some(attempt => attempt.completedAt === null)) throw new Error('Finish or abandon the current test before starting another one.');
}

/** Transactions serialize starts even when callers race. Flashcard data is never changed. */
export async function startTest(bank: QuestionBank, options: TestOptions, db = database, now = Date.now()): Promise<TestAttempt> {
  return db.transaction('rw', db.tables, async () => {
    const { testAttempts, testExposures } = await loadWorkspace(db);
    ensureNoActive(testAttempts);
    const attempt = createTestAttempt(bank, options, testAttempts, now, Math.random, testExposures);
    await db.testAttempts.add(attempt);
    await db.testExposures.bulkPut(collectTestExposures([attempt], testExposures));
    return structuredClone(attempt);
  });
}
async function updateAttempt(id: string, transform: (attempt: TestAttempt) => TestAttempt, db: TsukiakariDatabase): Promise<TestAttempt> {
  idSchema.parse(id);
  return db.transaction('rw', db.tables, async () => {
    const { testAttempts, testExposures } = await loadWorkspace(db);
    const previous = testAttempts.find(attempt => attempt.id === id);
    if (!previous) throw new Error('The test attempt was not found. No data was changed.');
    const next = testAttemptSchema.parse(transform(previous));
    if (JSON.stringify(previous) !== JSON.stringify(next)) await db.testAttempts.put(next);
    return structuredClone(next);
  });
}
export function saveTestAnswer(id: string, cardId: string, optionIds: string[], db = database, now = Date.now()): Promise<TestAttempt> {
  return updateAttempt(id, attempt => answerTestAttempt(attempt, cardId, optionIds, now), db);
}
export function revealTestAnswer(id: string, cardId: string, db = database, now = Date.now()): Promise<TestAttempt> {
  return updateAttempt(id, attempt => revealTestAttempt(attempt, cardId, now), db);
}
export function finishTestAttempt(id: string, db = database, now = Date.now()): Promise<TestAttempt> {
  return updateAttempt(id, attempt => completeTestAttempt(attempt, now), db);
}
export async function retryTestAttempt(id: string, db = database, now = Date.now()): Promise<TestAttempt> {
  idSchema.parse(id);
  return db.transaction('rw', db.tables, async () => {
    const { testAttempts, testExposures } = await loadWorkspace(db);
    ensureNoActive(testAttempts);
    const previous = testAttempts.find(attempt => attempt.id === id);
    if (!previous) throw new Error('The test attempt was not found. No data was changed.');
    const next = retryAttempt(previous, now);
    await db.testAttempts.add(next);
    await db.testExposures.bulkPut(collectTestExposures([next], testExposures));
    return structuredClone(next);
  });
}
/** Expiry is persisted by the writer on load/resume as well as by the visible timer. */
export async function expireTestAttempts(db = database, now = Date.now()): Promise<TestAttempt[]> {
  return db.transaction('rw', db.tables, async () => {
    const { testAttempts, testExposures } = await loadWorkspace(db);
    const expired = testAttempts.filter(attempt => testHasExpired(attempt, now)).map(attempt => completeTestAttempt(attempt, now));
    if (expired.length) await db.testAttempts.bulkPut(expired);
    return structuredClone(expired);
  });
}

/** Discard only an unfinished attempt after the caller has confirmed abandonment. */
export async function abandonTestAttempt(id: string, db = database): Promise<void> {
  idSchema.parse(id);
  await db.transaction('rw', db.tables, async () => {
    const { testAttempts, testExposures } = await loadWorkspace(db);
    const attempt = testAttempts.find(item => item.id === id);
    if (!attempt) throw new Error('The test attempt was not found. No data was changed.');
    if (attempt.completedAt !== null) throw new Error('A completed test cannot be abandoned. Its results have not been changed.');
    await db.testExposures.bulkPut(collectTestExposures([attempt], testExposures));
    await db.testAttempts.delete(id);
  });
}
