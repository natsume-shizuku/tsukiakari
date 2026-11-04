import { z } from 'zod';
import type { QuestionBank, StudyPack } from './domain';
import { examQuestionSchema, idSchema, sourceSchema } from './validation.ts';

const text = z.string().refine(value => value.trim().length > 0, 'Text must not be blank.');
const unique = (values: string[]) => new Set(values).size === values.length;
export const questionBankSchema = z.strictObject({
  id: idSchema, version: text, title: text, description: text, fixture: z.boolean(),
  domains: z.array(z.strictObject({ id: idSchema, title: text, weight: z.number().finite().positive().max(100) })).min(1),
  sources: z.array(sourceSchema).min(1), questions: z.array(examQuestionSchema).min(1),
}).superRefine((bank, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!unique(bank.domains.map(domain => domain.id))) issue('Bank domain IDs must be unique.');
  if (Math.abs(bank.domains.reduce((total, domain) => total + domain.weight, 0) - 100) > 1e-8) issue('Bank domain weights must total 100 percent.');
  if (!unique(bank.sources.map(source => source.id))) issue('Bank source IDs must be unique.');
  if (!unique(bank.questions.map(question => question.id))) issue('Bank question IDs must be unique.');
  if (!unique(bank.questions.map(question => question.prompt.trim().toLocaleLowerCase()))) issue('Bank questions must not duplicate the same prompt.');
  for (const question of bank.questions) {
    if (!bank.domains.some(domain => domain.id === question.domainId)) issue('Question refers to an unknown bank domain.');
    if (question.sourceIds.some(id => !bank.sources.some(source => source.id === id))) issue('Question refers to an unregistered bank source.');
  }
});

export function validateQuestionBank(input: unknown): QuestionBank { return questionBankSchema.parse(input); }

/** Validate newly published banks against canonical notes, never historical attempt snapshots. */
export function validateQuestionBankReferences(bank: QuestionBank, packs: readonly StudyPack[]): void {
  const byId = new Map(packs.map(pack => [pack.id, pack]));
  for (const question of bank.questions) {
    for (const reference of question.relatedNotes) {
      const pack = byId.get(reference.packId);
      if (!pack || !pack.notes.some(note => note.id === reference.noteId)) {
        throw new Error('Question refers to an unavailable canonical note: ' + reference.packId + '/' + reference.noteId + '.');
      }
      if (!bank.fixture && pack.fixture) {
        throw new Error('A published question bank cannot reference engineering fixture notes.');
      }
    }
  }
}