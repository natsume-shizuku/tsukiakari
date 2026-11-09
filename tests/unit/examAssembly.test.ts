import { describe, expect, it } from 'vitest';
import raw from '../../src/content/simulator-fixture-bank.json';
import type { QuestionBank } from '../../src/domain';
import { assembleBlueprintExam, maxBlueprintCount } from '../../src/examAssembly';
import { validateQuestionBank } from '../../src/questionBankValidation';
import { questionFormat } from '../../src/testGrading';
import { allocateDomainQuotas } from '../../src/testSelection';

const bank = validateQuestionBank(raw);
function seeded(seed: number) {
  let state = seed * 9301 + 49297;
  return () => { state = (state * 9301 + 49297) % 233280; return state / 233280; };
}
const assemble = (count: number, seed = 1, seen: ReadonlyMap<string, number> = new Map(), input: QuestionBank = bank) => assembleBlueprintExam(input, count, seen, seeded(seed));
const formats = (questions: QuestionBank['questions']) => {
  const counts: Record<string, number> = {};
  for (const question of questions) { const format = questionFormat(question, bank.groups); counts[format] = (counts[format] ?? 0) + 1; }
  return counts;
};

describe('simulator fixture bank', () => {
  it('matches the planned first release in every format', () => {
    expect(bank.fixture).toBe(true);
    expect(bank.questions).toHaveLength(128);
    expect(formats(bank.questions)).toEqual({ match: 32, order: 7, hotspot: 34, multiple: 27, single: 20, series: 8 });
    expect(bank.groups?.filter(group => group.kind === 'case-study')).toHaveLength(3);
    for (const group of bank.groups!.filter(item => item.kind === 'case-study')) expect(bank.questions.filter(question => question.groupId === group.id)).toHaveLength(9);
    const byDomain = bank.domains.map(domain => bank.questions.filter(question => question.domainId === domain.id).length);
    expect(byDomain).toEqual([22, 41, 15, 15, 22, 13]);
  });
  it('marks every question as an engineering fixture', () => {
    expect(bank.questions.every(question => question.prompt.includes('Engineering fixture') || question.groupId?.startsWith('fixture-series'))).toBe(true);
    expect(bank.questions.every(question => question.tags.includes('developer-fixture'))).toBe(true);
  });
});

describe('assembleBlueprintExam', () => {
  it('delivers the requested count with unique questions across many draws', () => {
    for (const count of [50, 60, 75, 100]) {
      for (let seed = 0; seed < 150; seed++) {
        const exam = assemble(count, seed);
        expect(exam.questions).toHaveLength(count);
        expect(new Set(exam.questions.map(question => question.id)).size).toBe(count);
      }
    }
  });
  it('keeps every domain within one of its quota', () => {
    for (const count of [50, 75, 100]) {
      const quotas = allocateDomainQuotas(bank.domains, count);
      for (let seed = 0; seed < 150; seed++) {
        const { questions } = assemble(count, seed);
        for (const domain of bank.domains) expect(Math.abs(questions.filter(question => question.domainId === domain.id).length - quotas.get(domain.id)!)).toBeLessThanOrEqual(1);
      }
    }
  });
  it('lands near the blueprint format mix', () => {
    const counts = formats(assemble(50).questions);
    expect(counts.match).toBeGreaterThanOrEqual(11); expect(counts.match).toBeLessThanOrEqual(14);
    expect(counts.hotspot).toBeGreaterThanOrEqual(12); expect(counts.hotspot).toBeLessThanOrEqual(15);
    expect(counts.order).toBeGreaterThanOrEqual(2); expect(counts.order).toBeLessThanOrEqual(4);
    expect(counts.multiple).toBeGreaterThanOrEqual(9); expect(counts.multiple).toBeLessThanOrEqual(12);
    expect(counts.single).toBeGreaterThanOrEqual(6); expect(counts.single).toBeLessThanOrEqual(10);
    expect(counts.series).toBe(4);
  });
  it('never splits a case study or series', () => {
    for (let seed = 0; seed < 100; seed++) {
      const exam = assemble(50, seed);
      for (const group of exam.groups) {
        const whole = bank.questions.filter(question => question.groupId === group.id).map(question => question.id);
        expect(exam.questions.filter(question => question.groupId === group.id).map(question => question.id)).toEqual(whole);
      }
      expect(exam.groups.filter(group => group.kind === 'case-study')).toHaveLength(1);
      expect(exam.groups.filter(group => group.kind === 'series')).toHaveLength(1);
    }
    expect(assemble(100).groups.filter(group => group.kind === 'case-study')).toHaveLength(2);
  });
  it('orders general questions first, then case studies, then the series', () => {
    const exam = assemble(50);
    expect(exam.sections.map(section => section.kind)).toEqual(['general', 'case-study', 'series']);
    expect(exam.sections.flatMap(section => section.cardIds)).toEqual(exam.questions.map(question => question.id));
  });
  it('prefers unseen questions and whole groups', () => {
    const first = assemble(50, 3);
    const seen = new Map(first.questions.map(question => [question.id, 1000]));
    const second = assemble(50, 3, seen);
    const repeated = second.questions.filter(question => seen.has(question.id));
    expect(repeated.length).toBeLessThan(first.questions.length / 2);
    expect(second.groups.map(group => group.id).filter(id => first.groups.some(group => group.id === id))).toEqual([]);
  });
  it('refuses rather than substitutes when a format runs out', () => {
    const noOrder: QuestionBank = { ...bank, questions: bank.questions.filter(question => question.kind !== 'order' || question.groupId) };
    expect(() => assemble(50, 1, new Map(), noOrder)).toThrow(/No questions were substituted/);
    const noCases: QuestionBank = { ...bank, groups: bank.groups!.filter(group => group.kind !== 'case-study'), questions: bank.questions.filter(question => !question.groupId?.startsWith('fixture-case')) };
    expect(() => assemble(50, 1, new Map(), noCases)).toThrow(/case studies/);
  });
  it('ignores questions that are not approved', () => {
    const drafted: QuestionBank = { ...bank, questions: bank.questions.map((question, index) => index < 5 ? { ...question, status: 'draft' as const } : question) };
    const exam = assemble(50, 2, new Map(), drafted);
    expect(exam.questions.every(question => question.status === 'approved')).toBe(true);
  });
  it('reports the largest exam the pool can build', () => {
    const largest = maxBlueprintCount(bank);
    expect(largest).toBeGreaterThanOrEqual(100);
    expect(largest).toBeLessThan(bank.questions.length);
    expect(assemble(largest).questions).toHaveLength(largest);
    expect(() => assemble(largest + 1)).toThrow();
  });
  it('needs a blueprint', () => {
    expect(() => assemble(50, 1, new Map(), { ...bank, blueprint: undefined })).toThrow(/blueprint/);
  });
});
