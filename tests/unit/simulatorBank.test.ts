import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validateQuestionBank, validateQuestionBankReferences } from '../../src/questionBankValidation';
import { validatePack } from '../../src/validation';
import { assembleBlueprintExam, maxBlueprintCount } from '../../src/examAssembly';
import { allocateDomainQuotas } from '../../src/testSelection';
import { questionBankManifests, visibleBankManifests } from '../../src/content/questionBanks';
import packData from '../../src/content/published/study-pack.json';
import bankManifest from '../../src/content/published/simulator-manifest.json';

const helper = '../../scripts/simulator-review-utils.mjs';
const { approvedPart, validateSimulatorManifest } = await import(helper);
const bank = validateQuestionBank(JSON.parse(readFileSync('src/content/published/ab250-simulator-bank.json', 'utf8')));
const source = JSON.parse(readFileSync('src/content/simulator/manifest.json', 'utf8'));
function seeded(seed: number) {
  let state = seed * 9301 + 49297;
  return () => { state = (state * 9301 + 49297) % 233280; return state / 233280; };
}

describe('published AB-250 simulator bank', () => {
  it('is a validated, approved, real bank that matches its catalog entry', () => {
    expect(bank.fixture).toBe(false);
    expect(bank.id).toBe('ab250-simulator');
    expect(bank.questions.length).toBe(bankManifest.questionCount);
    expect(bank.version).toBe(bankManifest.version);
    expect(bank.questions.every(question => question.status === 'approved')).toBe(true);
    expect(() => validateQuestionBankReferences(bank, [validatePack(packData)])).not.toThrow();
    expect(questionBankManifests.some(item => item.id === bank.id)).toBe(true);
    expect(visibleBankManifests.some(item => item.id === bank.id)).toBe(true);
  });
  it('builds exams of at least 50 questions with domains on quota and groups whole', () => {
    const largest = maxBlueprintCount(bank);
    expect(largest).toBeGreaterThanOrEqual(50);
    for (const count of [50, largest]) {
      const quotas = allocateDomainQuotas(bank.domains, count);
      for (let seed = 0; seed < 60; seed++) {
        const exam = assembleBlueprintExam(bank, count, new Map(), seeded(seed));
        expect(new Set(exam.questions.map(question => question.id)).size).toBe(count);
        for (const domain of bank.domains) expect(Math.abs(exam.questions.filter(question => question.domainId === domain.id).length - quotas.get(domain.id)!)).toBeLessThanOrEqual(1);
        for (const group of exam.groups) expect(exam.questions.filter(question => question.groupId === group.id)).toHaveLength(bank.questions.filter(question => question.groupId === group.id).length);
      }
    }
  });
});

describe('partial simulator batches', () => {
  const bundle = {
    sources: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
    questions: [{ id: 'q1', sourceIds: ['s1'] }, { id: 'q2', sourceIds: ['s2'] }, { id: 'q3', sourceIds: ['s3'], groupId: 'g1' }, { id: 'q4', sourceIds: ['s3'], groupId: 'g1' }],
    editorial: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }],
    groups: [{ id: 'g1' }],
  };
  it('keeps only approved questions and the sources they cite', () => {
    const reviews = ['q1', 'q3', 'q4'].map(id => ({ id, decision: 'approved' })).concat([{ id: 'q2', decision: 'needs-revision' }]);
    const part = approvedPart(bundle, reviews);
    expect(part.bundle.questions.map((question: { id: string }) => question.id)).toEqual(['q1', 'q3', 'q4']);
    expect(part.bundle.sources.map((item: { id: string }) => item.id)).toEqual(['s1', 's3']);
    expect(part.bundle.editorial).toHaveLength(3);
    expect(part.reviews).toHaveLength(3);
  });
  it('never splits a group and is refused in a release', () => {
    const reviews = [{ id: 'q1', decision: 'approved' }, { id: 'q3', decision: 'approved' }, { id: 'q4', decision: 'needs-revision' }];
    expect(() => approvedPart(bundle, reviews)).toThrow(/split/);
    const batches = source.batches.map((batch: object, index: number) => ({ ...batch, partial: index === 0 }));
    expect(() => validateSimulatorManifest({ ...source, release: true, batches })).toThrow(/partial/);
    expect(() => validateSimulatorManifest({ ...source, release: false, batches })).not.toThrow();
  });
});
