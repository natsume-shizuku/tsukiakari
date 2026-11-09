import { sel } from '../support/selection';
import { describe, expect, it } from 'vitest';
import { engineeringQuestionBank as bank } from '../../src/content/engineeringQuestionBank';
import { testFixturePack } from '../../src/content/testFixtures';
import { studyPacks } from '../../src/content/catalog';
import { validateQuestionBank } from '../../src/questionBankValidation';
import { questionBankManifests } from '../../src/content/questionBanks';

describe('independent engineering question bank', () => {
  it('is clearly labeled, separate from Library cards, and uses new identities for changed meanings', () => {
    expect(validateQuestionBank(bank)).toEqual(bank);
    expect(bank.fixture).toBe(true); expect(bank.title).toBe('Engineering test preview');
    expect(bank.questions).toHaveLength(300);
    expect(bank.questions[0].id).toBe('engineering-bank-question-001');
    expect(bank.questions.at(-1)?.id).toBe('engineering-bank-question-300');
    expect(bank.questions.every(question => !testFixturePack.cards.some(card => card.id === question.id))).toBe(true);
    expect(studyPacks.every(pack => pack.cards.every(card => !bank.questions.some(question => question.id === card.id)))).toBe(true);
    const manifest = questionBankManifests.find(item => item.id === bank.id)!;
    expect(manifest.domains).toEqual(bank.domains);
    expect(manifest.questionCount).toBe(bank.questions.length);
  });
  it('has accurate arithmetic, meaningful software-fixture variety and complete explanations', () => {
    expect(new Set(bank.questions.map(question => question.prompt)).size).toBe(300);
    expect(bank.questions.filter(question => question.kind === 'multiple')).toHaveLength(75);
    expect(bank.domains.map(domain => bank.questions.filter(question => question.domainId === domain.id).length)).toEqual([51, 96, 36, 36, 51, 30]);
    for (const question of bank.questions) {
      expect(sel(question).options).toHaveLength(4);
      expect(new Set(sel(question).options.map(option => option.text)).size).toBe(4);
      const expected = question.kind === 'single'
        ? Number(question.prompt.match(/What is (\d+) \+ (\d+)\?/)![1]) + Number(question.prompt.match(/What is (\d+) \+ (\d+)\?/)![2])
        : Number(question.prompt.match(/equal (\d+)/)![1]);
      const correct = sel(question).options.filter(option => {
        if (question.kind === 'single') return Number(option.text) === expected;
        const parts = option.text.split(' + ').map(Number);
        return parts[0] + parts[1] === expected;
      }).map(option => option.id);
      expect(sel(question).correctOptionIds).toEqual(correct);
      expect(correct).toHaveLength(question.kind === 'single' ? 1 : 2);
      expect(Object.keys(question.optionExplanations).sort()).toEqual(sel(question).options.map(option => option.id).sort());
    }
  });
});
