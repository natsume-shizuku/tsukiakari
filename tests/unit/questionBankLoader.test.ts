import { afterEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../src/content/engineering-question-bank.json';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('question-bank asset loading', () => {
  it('retries HTTP failure and shares ongoing loads while returning isolated values', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true, json: async () => structuredClone(fixture) });
    vi.stubGlobal('fetch', fetcher);
    const { loadQuestionBank } = await import('../../src/content/questionBanks');
    await expect(loadQuestionBank(fixture.id)).rejects.toThrow(/downloaded/);
    const [one, two] = await Promise.all([loadQuestionBank(fixture.id), loadQuestionBank(fixture.id)]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    one.questions[0].answer = 'Changed';
    expect(two.questions[0].answer).not.toBe('Changed');
    expect((await loadQuestionBank(fixture.id)).questions[0].answer).not.toBe('Changed');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('retries malformed JSON and rejects mismatched manifests without caching either failure', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => { throw new Error('Malformed JSON'); } })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...structuredClone(fixture), id: 'foreign-bank' }) })
      .mockResolvedValue({ ok: true, json: async () => structuredClone(fixture) });
    vi.stubGlobal('fetch', fetcher);
    const { loadQuestionBank } = await import('../../src/content/questionBanks');
    await expect(loadQuestionBank(fixture.id)).rejects.toThrow(/Malformed/);
    await expect(loadQuestionBank(fixture.id)).rejects.toThrow(/catalog entry/);
    await expect(loadQuestionBank(fixture.id)).resolves.toHaveProperty('id', fixture.id);
    expect(fetcher).toHaveBeenCalledTimes(3);
    await expect(loadQuestionBank('unknown')).rejects.toThrow(/unavailable/);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('rejects a stale bank version even when its identity and count match', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...structuredClone(fixture), version: '1.0.0' }) }));
    const { loadQuestionBank } = await import('../../src/content/questionBanks');
    await expect(loadQuestionBank(fixture.id)).rejects.toThrow(/catalog entry/);
  });
  it('rejects invalid question content and allows a later corrected download', async () => {
    const invalid = structuredClone(fixture); invalid.questions[0].correctOptionIds = ['foreign'];
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => invalid })
      .mockResolvedValue({ ok: true, json: async () => structuredClone(fixture) }));
    const { loadQuestionBank } = await import('../../src/content/questionBanks');
    await expect(loadQuestionBank(fixture.id)).rejects.toThrow();
    await expect(loadQuestionBank(fixture.id)).resolves.toHaveProperty('id', fixture.id);
  });
});

it('rejects missing canonical notes and retries a corrected bank download', async () => {
  const invalid = structuredClone(fixture);
  Object.assign(invalid.questions[0], { relatedNotes: [{ packId: 'missing-pack', noteId: 'missing-note' }] });
  const fetcher = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => invalid })
    .mockResolvedValue({ ok: true, json: async () => structuredClone(fixture) });
  vi.stubGlobal('fetch', fetcher);
  const { loadQuestionBank } = await import('../../src/content/questionBanks');
  await expect(loadQuestionBank(fixture.id)).rejects.toThrow(/canonical note/);
  await expect(loadQuestionBank(fixture.id)).resolves.toHaveProperty('id', fixture.id);
  expect(fetcher).toHaveBeenCalledTimes(2);
});