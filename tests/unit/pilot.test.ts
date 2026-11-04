import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import packData from '../../src/content/pilot/study-pack.json';
import bankData from '../../src/content/pilot/ab250-pilot-bank.json';
import approvals from '../../docs/phase7/pilot/approved-index.json';
import { validatePack } from '../../src/validation';
import { validateQuestionBank, validateQuestionBankReferences } from '../../src/questionBankValidation';
import { resolveCurationCards, resolveCurationNotes } from '../../src/content/catalog';
import { eligibleTestQuestions } from '../../src/testEngine';

describe('reviewed Contact Center pilot', () => {
  const pack = validatePack(packData);
  const bank = validateQuestionBank(bankData);
  it('contains the bounded pilot with valid primary sources and exact domain balance', () => {
    expect(pack.fixture).toBe(false);
    expect(pack.cards).toHaveLength(36);
    expect(pack.notes).toHaveLength(12);
    expect(bank.questions).toHaveLength(24);
    expect(bank.questions.filter(question => question.kind === 'single')).toHaveLength(18);
    expect(bank.questions.filter(question => question.kind === 'multiple')).toHaveLength(6);
    for(const domain of bank.domains) {
      const questions = bank.questions.filter(question => question.domainId === domain.id);
      expect(questions.filter(question => question.kind === 'single')).toHaveLength(3);
      expect(questions.filter(question => question.kind === 'multiple')).toHaveLength(1);
    }
    for(const source of [...pack.sources,...bank.sources]) {
      expect(new URL(source.url).protocol).toBe('https:');
      expect(new URL(source.url).hostname).toBe('learn.microsoft.com');
    }
    expect(() => validateQuestionBankReferences(bank,[pack])).not.toThrow();
    expect(new Set(bank.questions.map(question => question.conceptId)).size).toBe(24);
  });
  it('has independent reviewed evidence for every published item and no stale artifacts', () => {
    const items = [...pack.notes,...pack.cards,...bank.questions];
    expect(approvals).toHaveLength(items.length);
    const objectives = new Set(readFileSync('docs/phase7/objective-coverage.csv','utf8').trim().split(/\r?\n/).slice(1).map(line => line.split(',')[0]));
    for(const item of items) {
      const approval = approvals.find(record => record.id === item.id)!;
      expect(approval).toBeDefined();
      expect(approval.author).not.toBe(approval.reviewer);
      expect(approval.objectiveIds.length).toBeGreaterThan(0);
      expect(approval.objectiveIds.every(id => objectives.has(id))).toBe(true);
      expect(approval.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(() => execFileSync(process.execPath,['scripts/compile-pilot.mjs','--check'],{stdio:'pipe'})).not.toThrow();
  });
  it('curates shared identities and supplies every supporting note without duplicating cards', () => {
    const pilotIds = new Set(pack.cards.map(card => card.id));
    const implementation = resolveCurationCards('d365-contact-center').filter(item => pilotIds.has(item.card.id));
    const preparation = resolveCurationCards('ab250-preparation').filter(item => pilotIds.has(item.card.id));
    const advanced = resolveCurationCards('ab250-advanced').filter(item => pilotIds.has(item.card.id));
    expect(implementation).toHaveLength(24);
    expect(preparation).toHaveLength(36);
    expect(advanced).toHaveLength(12);
    const coreIds = new Set(implementation.map(item => item.card.id));
    expect(advanced.every(item => !coreIds.has(item.card.id))).toBe(true);
    expect([...implementation,...advanced].every(item => item.pack.id === 'contact-center-core')).toBe(true);
    for(const id of ['d365-contact-center','ab250-preparation','ab250-advanced']) {
      const notes = new Set(resolveCurationNotes(id).map(item => item.note.id));
      expect(resolveCurationCards(id).every(item => item.card.noteIds.every(noteId => notes.has(noteId)))).toBe(true);
    }
  });
  it('keeps the real pilot out of normal scored tests and cannot use the engineering bypass', () => {
    expect(() => eligibleTestQuestions(bank)).toThrow(/300/);
    expect(() => eligibleTestQuestions(bank,true)).toThrow(/fixture/);
  });
});
