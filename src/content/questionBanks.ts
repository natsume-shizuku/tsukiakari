import type { QuestionBank } from '../domain';
import { validateQuestionBank, validateQuestionBankReferences } from '../questionBankValidation';
import fixtureUrl from './engineering-question-bank.json?url';
import ab250Url from './published/ab250-bank.json?url';
import ab250Manifest from './published/bank-manifest.json';

export interface QuestionBankManifest {
  id: string; version: string; title: string; description: string; fixture: boolean; questionCount: number;
  domains: QuestionBank['domains'];
}
export const questionBankManifests: QuestionBankManifest[] = [{
  id: 'developer-test-fixture', version: '2.0.0', title: 'Engineering test preview',
  description: '300 arithmetic software fixtures with single and multiple answers. This is not certification material.',
  fixture: true, questionCount: 300,
  domains: [17, 32, 12, 12, 17, 10].map((weight, index) => ({
    id: 'fixture-domain-' + (index + 1), title: 'Fixture domain ' + (index + 1), weight,
  })),
}, ab250Manifest];
const assets: Record<string, string> = { 'developer-test-fixture': fixtureUrl, 'ab250-original': ab250Url };
const pending = new Map<string, Promise<QuestionBank>>();

/** Only successful/ongoing loads are cached. Retry after a network or validation failure refetches. */
export async function loadQuestionBank(id: string): Promise<QuestionBank> {
  const manifest = questionBankManifests.find(item => item.id === id);
  const url = assets[id];
  if (!manifest || !url) throw new Error('This question bank is unavailable. Your saved tests have not been changed.');
  let request = pending.get(id);
  if (!request) {
    request = (async () => {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) throw new Error('The question bank could not be downloaded. Retry when the connection is available.');
      const bank = validateQuestionBank(await response.json());
      if (bank.id !== manifest.id || bank.version !== manifest.version || bank.fixture !== manifest.fixture || bank.questions.length !== manifest.questionCount ||
          JSON.stringify(bank.domains) !== JSON.stringify(manifest.domains)) {
        throw new Error('The downloaded question bank does not match its catalog entry. Please retry or reload the website.');
      }
      // Resolve after module initialization: the catalog itself consumes manifest metadata.
      const { studyPacks } = await import('./catalog');
      validateQuestionBankReferences(bank, studyPacks);
      return bank;
    })();
    pending.set(id, request);
    void request.catch(() => { if (pending.get(id) === request) pending.delete(id); });
  }
  // Never share a mutable cached object with attempts or callers.
  return structuredClone(await request);
}
